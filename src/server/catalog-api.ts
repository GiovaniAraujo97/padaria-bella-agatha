import './load-env';
import { scryptSync, timingSafeEqual, createHmac } from 'node:crypto';
import type { Express, Request, Response, NextFunction } from 'express';
import express from 'express';
import { Pool, PoolClient, types } from 'pg';
import { localCatalogEnabled, readLocalCatalog, updateLocalCatalog } from './local-catalog';

type ProductInput = {
  name: string;
  description: string;
  price: number;
  categoryId: number;
  image: string;
  featured: boolean;
  available: boolean;
  published: boolean;
  displayOrder: number;
  sizePrices?: Record<string, number>;
};

const pool = process.env['DATABASE_URL']
  ? new Pool({ connectionString: process.env['DATABASE_URL'] })
  : undefined;
const sizes = ['pequeno', 'medio', 'grande'] as const;
const cookieName = 'bella_admin';
const failedLogins = new Map<string, { count: number; resetAt: number }>();
types.setTypeParser(20, (value) => Number(value));

function database(_req: Request, res: Response): Pool | undefined {
  if (!pool) res.status(503).json({ error: 'Banco de dados não configurado.' });
  return pool;
}

function passwordMatches(password: string): boolean {
  if (password.length > 1024) return false;
  const configured = process.env['ADMIN_PASSWORD_HASH'] ?? '';
  const [salt, expected] = configured.split(':');
  if (!salt || !expected) return false;
  const actualBuffer = scryptSync(password, salt, 64);
  const expectedBuffer = Buffer.from(expected, 'hex');
  return expectedBuffer.length === actualBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

function sign(payload: string): string {
  return createHmac('sha256', process.env['SESSION_SECRET'] ?? '').update(payload).digest('base64url');
}

function adminSession(req: Request): boolean {
  const secret = process.env['SESSION_SECRET'];
  const token = req.cookies?.[cookieName] as string | undefined;
  if (!secret || secret.length < 32 || !token) return false;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;
  const expected = Buffer.from(sign(payload));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return false;
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { email: string; exp: number };
    return session.email === process.env['ADMIN_EMAIL'] && session.exp > Date.now();
  } catch { return false; }
}

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!adminSession(req)) {
    res.status(401).json({ error: 'Acesso administrativo necessário.' });
    return;
  }
  next();
}

function validProduct(value: unknown): value is ProductInput {
  if (!value || typeof value !== 'object') return false;
  const product = value as ProductInput;
  return typeof product.name === 'string' && product.name.trim().length > 0 && product.name.length <= 120
    && typeof product.description === 'string' && product.description.length <= 2000
    && Number.isFinite(product.price) && product.price >= 0
    && Number.isInteger(product.categoryId) && product.categoryId > 0
    && typeof product.image === 'string' && product.image.length <= 2048
    && ((product.image.startsWith('/') && !product.image.startsWith('//') && !product.image.includes('\\')) || /^https:\/\//i.test(product.image))
    && typeof product.featured === 'boolean' && typeof product.available === 'boolean'
    && typeof product.published === 'boolean' && Number.isInteger(product.displayOrder)
    && (!product.sizePrices || (typeof product.sizePrices === 'object' && Object.entries(product.sizePrices).every(([size, price]) => sizes.includes(size as typeof sizes[number]) && Number.isFinite(price) && price >= 0)));
}

async function adminQuery<T>(query: (client: PoolClient) => Promise<T>): Promise<T> {
  if (!pool) throw new Error('Banco de dados não configurado.');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.admin', 'true', true)");
    const result = await query(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}

function asyncRoute(handler: (req: Request, res: Response) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction) => { void handler(req, res).catch(next); };
}

export function registerCatalogApi(app: Express): void {
  app.use('/api', express.json({ limit: '32kb' }));
  app.use('/api', (req, _res, next) => {
    const cookies = req.headers.cookie?.split(';').map((item) => item.trim()).filter(Boolean) ?? [];
    (req as Request & { cookies?: Record<string, string> }).cookies = Object.fromEntries(cookies.map((item) => {
      const separator = item.indexOf('=');
      return [item.slice(0, separator), decodeURIComponent(item.slice(separator + 1))];
    }));
    next();
  });
  app.use('/api', (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const origin = req.get('origin');
      if (origin && new URL(origin).host !== req.get('host')) {
        res.status(403).json({ error: 'Origem da solicitação não permitida.' });
        return;
      }
      if (req.get('sec-fetch-site') === 'cross-site') {
        res.status(403).json({ error: 'Origem da solicitação não permitida.' });
        return;
      }
    }
    next();
  });

  app.post('/api/admin/login', asyncRoute(async (req, res) => {
    const { email, password } = req.body ?? {};
    if (!process.env['ADMIN_EMAIL'] || !process.env['ADMIN_PASSWORD_HASH'] || (process.env['SESSION_SECRET'] ?? '').length < 32) {
      res.status(503).json({ error: 'A autenticação administrativa não foi configurada.' });
      return;
    }
    const address = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    const now = Date.now();
    const attempt = failedLogins.get(address);
    if (attempt && attempt.resetAt > now && attempt.count >= 8) {
      res.status(429).json({ error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' });
      return;
    }
    if (email !== process.env['ADMIN_EMAIL'] || typeof password !== 'string' || !passwordMatches(password)) {
      if (!attempt || attempt.resetAt <= now) failedLogins.set(address, { count: 1, resetAt: now + 15 * 60 * 1000 });
      else attempt.count += 1;
      res.status(401).json({ error: 'E-mail ou senha inválidos.' });
      return;
    }
    failedLogins.delete(address);
    const payload = Buffer.from(JSON.stringify({ email, exp: Date.now() + 8 * 60 * 60 * 1000 })).toString('base64url');
    res.cookie(cookieName, `${payload}.${sign(payload)}`, {
      httpOnly: true, sameSite: 'strict', secure: process.env['NODE_ENV'] === 'production',
      path: '/', maxAge: 8 * 60 * 60 * 1000
    });
    res.json({ email });
  }));

  app.get('/api/admin/session', requireAdmin, (req, res) => res.json({ email: process.env['ADMIN_EMAIL'] }));
  app.post('/api/admin/logout', requireAdmin, (_req, res) => {
    res.clearCookie(cookieName, { httpOnly: true, sameSite: 'strict', secure: process.env['NODE_ENV'] === 'production', path: '/' });
    res.status(204).end();
  });

  app.get('/api/catalog', asyncRoute(async (req, res) => {
    if (localCatalogEnabled) {
      const catalog = await readLocalCatalog();
      const categories = catalog.categories.filter((category) => category.visible).sort((first, second) => first.displayOrder - second.displayOrder || first.name.localeCompare(second.name));
      const visibleSlugs = new Set(categories.map((category) => category.slug));
      res.json({ categories, products: catalog.products.filter((product) => product.published && visibleSlugs.has(product.category)) });
      return;
    }
    const db = database(req, res);
    if (!db) return;
    const client = await db.connect();
    try {
      await client.query('BEGIN READ ONLY');
      await client.query("SELECT set_config('app.admin', 'false', true)");
      const [categories, products] = await Promise.all([
        client.query('SELECT id, name, icon, slug, has_sizes AS "hasSizes", display_order AS "displayOrder" FROM categories WHERE is_visible ORDER BY display_order, name'),
        client.query(`SELECT p.id, p.name, p.description, p.price::float AS price, c.slug AS category,
            p.image_url AS image, p.featured, p.is_available AS available, c.has_sizes AS "categoryHasSizes", p.display_order AS "displayOrder",
            COALESCE(jsonb_object_agg(ps.size, ps.price::float) FILTER (WHERE ps.size IS NOT NULL), '{}') AS "sizePrices"
          FROM products p JOIN categories c ON c.id = p.category_id
          LEFT JOIN product_sizes ps ON ps.product_id = p.id
          WHERE p.is_published AND c.is_visible
          GROUP BY p.id, c.slug, c.has_sizes ORDER BY p.display_order, p.name`)
      ]);
      await client.query('COMMIT');
      res.json({ categories: categories.rows, products: products.rows });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
  }));

  app.get('/api/admin/categories', requireAdmin, asyncRoute(async (_req, res) => {
    if (localCatalogEnabled) {
      res.json((await readLocalCatalog()).categories.sort((first, second) => first.displayOrder - second.displayOrder || first.name.localeCompare(second.name)));
      return;
    }
    const result = await adminQuery((client) => client.query('SELECT id, name, icon, slug, has_sizes AS "hasSizes", is_visible AS visible, display_order AS "displayOrder" FROM categories ORDER BY display_order, name'));
    res.json(result.rows);
  }));

  app.post('/api/admin/categories', requireAdmin, asyncRoute(async (req, res) => {
    const { name, hasSizes } = req.body ?? {};
    if (typeof name !== 'string' || !name.trim() || name.length > 100 || typeof hasSizes !== 'boolean') {
      res.status(400).json({ error: 'Revise os campos da categoria.' }); return;
    }
    if (localCatalogEnabled) {
      const category = await updateLocalCatalog((catalog) => {
        const slug = categorySlug(name);
        if (catalog.categories.some((item) => item.slug === slug)) return undefined;
        const displayOrder = Math.max(0, ...catalog.categories.map((item) => item.displayOrder)) + 1;
        const created = { id: Math.max(0, ...catalog.categories.map((item) => item.id)) + 1, name: name.trim(), icon: 'bakery_dining', slug, hasSizes, visible: true, displayOrder };
        catalog.categories.push(created);
        return created;
      });
      if (!category) { res.status(409).json({ error: 'Já existe uma categoria com esses dados.' }); return; }
      res.status(201).json(category);
      return;
    }
    const result = await adminQuery((client) => client.query(`INSERT INTO categories(name, slug, has_sizes, display_order)
      SELECT $1, $2, $3, COALESCE(MAX(display_order), 0) + 1 FROM categories
      RETURNING id, name, icon, slug, has_sizes AS "hasSizes", is_visible AS visible, display_order AS "displayOrder"`, [name.trim(), categorySlug(name), hasSizes]));
    res.status(201).json(result.rows[0]);
  }));

  app.put('/api/admin/categories/order', requireAdmin, asyncRoute(async (req, res) => {
    const { categoryIds } = req.body ?? {};
    if (!Array.isArray(categoryIds) || categoryIds.some((id: unknown) => !Number.isSafeInteger(id) || (id as number) < 1)
      || new Set(categoryIds).size !== categoryIds.length) {
      res.status(400).json({ error: 'Lista de categorias inválida.' }); return;
    }
    if (localCatalogEnabled) {
      const updated = await updateLocalCatalog((catalog) => {
        if (categoryIds.length !== catalog.categories.length || categoryIds.some((id: number) => !catalog.categories.some((category) => category.id === id))) return false;
        const categoriesById = new Map(catalog.categories.map((category) => [category.id, category]));
        catalog.categories = categoryIds.map((id: number, index: number) => ({ ...categoriesById.get(id)!, displayOrder: index + 1 }));
        return true;
      });
      if (!updated) { res.status(400).json({ error: 'A lista de categorias mudou. Atualize a página e tente novamente.' }); return; }
      res.status(204).end();
      return;
    }
    const updated = await adminQuery(async (client) => {
      const current = await client.query('SELECT id FROM categories ORDER BY display_order, name FOR UPDATE');
      const currentIds = current.rows.map((row) => Number(row['id']));
      if (categoryIds.length !== currentIds.length || categoryIds.some((id: number) => !currentIds.includes(id))) return false;
      await client.query(`UPDATE categories AS category
        SET display_order = ordering.position::integer
        FROM unnest($1::bigint[]) WITH ORDINALITY AS ordering(id, position)
        WHERE category.id = ordering.id`, [categoryIds]);
      return true;
    });
    if (!updated) { res.status(400).json({ error: 'A lista de categorias mudou. Atualize a página e tente novamente.' }); return; }
    res.status(204).end();
  }));

  app.put('/api/admin/categories/:id', requireAdmin, asyncRoute(async (req, res) => {
    const { name, hasSizes } = req.body ?? {};
    if (!Number.isInteger(Number(req.params['id'])) || typeof name !== 'string' || !name.trim() || name.length > 100 || typeof hasSizes !== 'boolean') {
      res.status(400).json({ error: 'Revise os campos da categoria.' }); return;
    }
    if (localCatalogEnabled) {
      const result = await updateLocalCatalog((catalog) => {
        const id = Number(req.params['id']);
        const category = catalog.categories.find((item) => item.id === id);
        if (!category) return { status: 'missing' as const };
        const slug = categorySlug(name);
        if (catalog.categories.some((item) => item.id !== id && item.slug === slug)) return { status: 'duplicate' as const };
        category.name = name.trim();
        category.slug = slug;
        category.hasSizes = hasSizes;
        for (const product of catalog.products) {
          if (product.categoryId === id) {
            product.category = slug;
            product.categoryHasSizes = hasSizes;
          }
        }
        return { status: 'saved' as const, category };
      });
      if (result.status === 'missing') { res.status(404).json({ error: 'Categoria não encontrada.' }); return; }
      if (result.status === 'duplicate') { res.status(409).json({ error: 'Já existe uma categoria com esses dados.' }); return; }
      res.json(result.category);
      return;
    }
    const result = await adminQuery((client) => client.query('UPDATE categories SET name=$1, has_sizes=$2, updated_at=now() WHERE id=$3 RETURNING id, name, icon, slug, has_sizes AS "hasSizes", is_visible AS visible, display_order AS "displayOrder"', [name.trim(), hasSizes, req.params['id']]));
    if (!result.rowCount) { res.status(404).json({ error: 'Categoria não encontrada.' }); return; }
    res.json(result.rows[0]);
  }));

  app.delete('/api/admin/categories/:id', requireAdmin, asyncRoute(async (req, res) => {
    if (localCatalogEnabled) {
      const result = await updateLocalCatalog((catalog) => {
        const id = Number(req.params['id']);
        const index = catalog.categories.findIndex((item) => item.id === id);
        if (index === -1) return 'missing';
        if (catalog.products.some((product) => product.categoryId === id)) return 'associated';
        catalog.categories.splice(index, 1);
        return 'deleted';
      });
      if (result === 'missing') { res.status(404).json({ error: 'Categoria não encontrada.' }); return; }
      if (result === 'associated') { res.status(409).json({ error: 'A categoria ainda está associada a produtos.' }); return; }
      res.status(204).end();
      return;
    }
    const result = await adminQuery((client) => client.query('DELETE FROM categories WHERE id=$1', [req.params['id']]));
    if (!result.rowCount) { res.status(404).json({ error: 'Categoria não encontrada.' }); return; }
    res.status(204).end();
  }));

  app.get('/api/admin/products', requireAdmin, asyncRoute(async (_req, res) => {
    if (localCatalogEnabled) {
      res.json((await readLocalCatalog()).products);
      return;
    }
    const result = await adminQuery((client) => client.query(`SELECT p.id, p.name, p.description, p.price::float AS price, p.category_id AS "categoryId", c.slug AS category,
      p.image_url AS image, p.featured, p.is_available AS available, p.is_published AS published, c.has_sizes AS "categoryHasSizes", p.display_order AS "displayOrder",
      COALESCE(jsonb_object_agg(ps.size, ps.price::float) FILTER (WHERE ps.size IS NOT NULL), '{}') AS "sizePrices"
      FROM products p JOIN categories c ON c.id=p.category_id LEFT JOIN product_sizes ps ON ps.product_id=p.id
      GROUP BY p.id, c.slug, c.has_sizes ORDER BY p.display_order, p.name`));
    res.json(result.rows);
  }));

  const saveProduct = async (req: Request, res: Response, create: boolean) => {
    const input = req.body;
    if (!validProduct(input) || (!create && !Number.isInteger(Number(req.params['id'])))) {
      res.status(400).json({ error: 'Revise os campos do produto.' }); return;
    }
    const product = input;
    if (localCatalogEnabled) {
      const result = await updateLocalCatalog((catalog) => {
        const category = catalog.categories.find((item) => item.id === product.categoryId);
        if (!category) return { status: 'category-missing' as const };
        const id = create ? Math.max(0, ...catalog.products.map((item) => item.id)) + 1 : Number(req.params['id']);
        const existingIndex = catalog.products.findIndex((item) => item.id === id);
        if (!create && existingIndex === -1) return { status: 'missing' as const };
        const saved = {
          ...product,
          id,
          categoryId: category.id,
          category: category.slug,
          categoryHasSizes: category.hasSizes,
          sizePrices: { ...product.sizePrices }
        };
        if (create) catalog.products.push(saved);
        else catalog.products[existingIndex] = saved;
        return { status: 'saved' as const, id };
      });
      if (result.status === 'category-missing') { res.status(400).json({ error: 'Selecione uma categoria válida.' }); return; }
      if (result.status === 'missing') { res.status(404).json({ error: 'Produto não encontrado.' }); return; }
      res.status(create ? 201 : 200).json({ id: result.id });
      return;
    }
    const result = await adminQuery(async (client) => {
      const values = [product.name.trim(), product.description.trim(), product.price, product.categoryId, product.image.trim(), product.featured, product.available, product.published, product.displayOrder];
      const saved = create
        ? await client.query(`INSERT INTO products(name, description, price, category_id, image_url, featured, is_available, is_published, display_order)
            VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`, values)
        : await client.query(`UPDATE products SET name=$1, description=$2, price=$3, category_id=$4, image_url=$5, featured=$6,
            is_available=$7, is_published=$8, display_order=$9, updated_at=now() WHERE id=$10 RETURNING id`, [...values, req.params['id']]);
      if (!saved.rowCount) return undefined;
      const productId = saved.rows[0].id as number;
      await client.query('DELETE FROM product_sizes WHERE product_id=$1', [productId]);
      for (const [size, price] of Object.entries(product.sizePrices ?? {})) {
        await client.query('INSERT INTO product_sizes(product_id, size, price) VALUES($1,$2,$3)', [productId, size, price]);
      }
      return productId;
    });
    if (result === undefined) { res.status(404).json({ error: 'Produto não encontrado.' }); return; }
    res.status(create ? 201 : 200).json({ id: result });
  };

  app.post('/api/admin/products', requireAdmin, asyncRoute((req, res) => saveProduct(req, res, true)));
  app.put('/api/admin/products/:id', requireAdmin, asyncRoute((req, res) => saveProduct(req, res, false)));
  app.delete('/api/admin/products/:id', requireAdmin, asyncRoute(async (req, res) => {
    if (localCatalogEnabled) {
      const deleted = await updateLocalCatalog((catalog) => {
        const index = catalog.products.findIndex((product) => product.id === Number(req.params['id']));
        if (index === -1) return false;
        catalog.products.splice(index, 1);
        return true;
      });
      if (!deleted) { res.status(404).json({ error: 'Produto não encontrado.' }); return; }
      res.status(204).end();
      return;
    }
    const result = await adminQuery((client) => client.query('DELETE FROM products WHERE id=$1', [req.params['id']]));
    if (!result.rowCount) { res.status(404).json({ error: 'Produto não encontrado.' }); return; }
    res.status(204).end();
  }));

  app.use('/api', (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const code = (error as { code?: string }).code;
    if (!pool || (error as Error).message === 'Banco de dados não configurado.') { res.status(503).json({ error: 'Banco de dados indisponível ou não configurado.' }); return; }
    if (code === '23505') { res.status(409).json({ error: 'Já existe uma categoria com esses dados.' }); return; }
    if (code === '23503') { res.status(409).json({ error: 'A categoria ainda está associada a produtos.' }); return; }
    console.error('Erro na API do catálogo:', error);
    res.status(500).json({ error: 'Não foi possível concluir a operação.' });
  });
}

function categorySlug(name: string): string {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'categoria';
}