import { readFile, rename, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Category } from '../app/core/interfaces/category.interface';
import { Product } from '../app/core/interfaces/product.interface';
import { CATEGORIES, PRODUCTS } from '../app/core/models/mock-data';

export interface LocalCategory extends Category {
  id: number;
  hasSizes: boolean;
  visible: boolean;
  displayOrder: number;
}

export interface LocalProduct extends Product {
  id: number;
  categoryId: number;
  categoryHasSizes: boolean;
  published: boolean;
  available: boolean;
  displayOrder: number;
}

export interface LocalCatalog {
  categories: LocalCategory[];
  products: LocalProduct[];
}

export const localCatalogEnabled = !process.env['DATABASE_URL'] && process.env['NODE_ENV'] !== 'production';

const catalogPath = resolve(process.cwd(), '.catalog-dev.json');
let queue: Promise<void> = Promise.resolve();

function createSeed(): LocalCatalog {
  const categories = CATEGORIES.map((category, index) => ({
    ...category,
    id: index + 1,
    hasSizes: category.slug === 'bolos' || category.slug === 'tortas',
    visible: true,
    displayOrder: index + 1
  }));
  const categoriesBySlug = new Map(categories.map((category) => [category.slug, category]));
  const products = PRODUCTS.map((product) => {
    const category = categoriesBySlug.get(product.category)!;
    return {
      ...product,
      categoryId: category.id,
      categoryHasSizes: category.hasSizes,
      available: product.available ?? true,
      published: product.published ?? true,
      displayOrder: product.displayOrder ?? product.id,
      sizePrices: { ...product.sizePrices }
    };
  });
  return { categories, products };
}

async function loadCatalog(): Promise<LocalCatalog> {
  try {
    return JSON.parse(await readFile(catalogPath, 'utf8')) as LocalCatalog;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    const catalog = createSeed();
    await saveCatalog(catalog);
    return catalog;
  }
}

async function saveCatalog(catalog: LocalCatalog): Promise<void> {
  const temporaryPath = `${catalogPath}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(catalog, null, 2), 'utf8');
  await rename(temporaryPath, catalogPath);
}

function enqueue<T>(operation: () => Promise<T>): Promise<T> {
  const result = queue.then(operation);
  queue = result.then(() => undefined, () => undefined);
  return result;
}

export function readLocalCatalog(): Promise<LocalCatalog> {
  return enqueue(loadCatalog);
}

export function updateLocalCatalog<T>(update: (catalog: LocalCatalog) => T): Promise<T> {
  return enqueue(async () => {
    const catalog = await loadCatalog();
    const result = update(catalog);
    await saveCatalog(catalog);
    return result;
  });
}