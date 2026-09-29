CREATE TABLE IF NOT EXISTS categories (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(60) NOT NULL DEFAULT 'bakery_dining',
  slug VARCHAR(100) NOT NULL UNIQUE,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(2000) NOT NULL DEFAULT '',
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  image_url VARCHAR(2048) NOT NULL DEFAULT '',
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_sizes (
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size VARCHAR(16) NOT NULL CHECK (size IN ('pequeno', 'medio', 'grande')),
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  PRIMARY KEY (product_id, size)
);

CREATE INDEX IF NOT EXISTS products_public_order_idx ON products(is_published, display_order, name);
CREATE INDEX IF NOT EXISTS products_category_idx ON products(category_id);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories FORCE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE products FORCE ROW LEVEL SECURITY;
ALTER TABLE product_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_sizes FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS categories_read_public_or_admin ON categories;
CREATE POLICY categories_read_public_or_admin ON categories FOR SELECT
  USING (is_visible OR current_setting('app.admin', true) = 'true');
DROP POLICY IF EXISTS categories_admin_write ON categories;
CREATE POLICY categories_admin_write ON categories FOR ALL
  USING (current_setting('app.admin', true) = 'true')
  WITH CHECK (current_setting('app.admin', true) = 'true');

DROP POLICY IF EXISTS products_read_public_or_admin ON products;
CREATE POLICY products_read_public_or_admin ON products FOR SELECT
  USING (is_published OR current_setting('app.admin', true) = 'true');
DROP POLICY IF EXISTS products_admin_write ON products;
CREATE POLICY products_admin_write ON products FOR ALL
  USING (current_setting('app.admin', true) = 'true')
  WITH CHECK (current_setting('app.admin', true) = 'true');

DROP POLICY IF EXISTS product_sizes_read_public_or_admin ON product_sizes;
CREATE POLICY product_sizes_read_public_or_admin ON product_sizes FOR SELECT
  USING (current_setting('app.admin', true) = 'true' OR EXISTS (
    SELECT 1 FROM products p JOIN categories c ON c.id = p.category_id
    WHERE p.id = product_id AND p.is_published AND c.is_visible
  ));
DROP POLICY IF EXISTS product_sizes_admin_write ON product_sizes;
CREATE POLICY product_sizes_admin_write ON product_sizes FOR ALL
  USING (current_setting('app.admin', true) = 'true')
  WITH CHECK (current_setting('app.admin', true) = 'true');

SELECT set_config('app.admin', 'true', true);

-- Conteúdo demonstrativo migrado da vitrine atual para manter a apresentação local.
INSERT INTO categories(name, icon, slug, display_order) VALUES
  ('Pães artesanais', 'bakery_dining', 'paes', 1), ('Bolos', 'cake', 'bolos', 2),
  ('Tortas', 'pie_chart', 'tortas', 3), ('Doces', 'cookie', 'doces', 4),
  ('Salgados', 'tapas', 'salgados', 5), ('Cafés', 'coffee', 'cafes', 6),
  ('Bebidas', 'local_cafe', 'bebidas', 7), ('Combos', 'redeem', 'combos', 8)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products(category_id, name, description, price, image_url, featured, is_available, is_published, display_order)
SELECT c.id, seed.name, seed.description, seed.price, seed.image, TRUE, TRUE, TRUE, seed.id
FROM (VALUES
  (1, 'Bolo Floresta Negra', 'Chocolate intenso, cerejas frescas e chantilly leve.', 89.90, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=85', 'bolos'),
  (2, 'Torta Holandesa', 'Creme aveludado, base crocante e ganache belga.', 74.90, 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=800&q=85', 'tortas'),
  (3, 'Sonho de Creme', 'Massa fofinha recheada com creme de baunilha.', 9.50, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=85', 'doces'),
  (4, 'Pão Italiano', 'Casca rústica, miolo macio e fermentação natural.', 18.90, 'https://images.unsplash.com/photo-1585478259715-876acc5be8eb?auto=format&fit=crop&w=800&q=85', 'paes'),
  (5, 'Croissant de Manteiga', 'Folhado artesanal com manteiga de primeira.', 12.90, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=85', 'paes'),
  (6, 'Cheesecake de Frutas', 'Cheesecake delicado com geleia feita na casa.', 16.90, 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=85', 'tortas'),
  (7, 'Brownie Premium', 'Chocolate meio amargo, casquinha fina e interior úmido.', 11.90, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=85', 'doces'),
  (8, 'Pão de Queijo Gourmet', 'Queijo meia-cura e receita mineira de família.', 8.90, 'https://images.unsplash.com/photo-1608198093002-ad4e005484df?auto=format&fit=crop&w=800&q=85', 'salgados')
) AS seed(id, name, description, price, image, slug)
JOIN categories c ON c.slug = seed.slug
WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.name = seed.name AND p.category_id = c.id);

INSERT INTO product_sizes(product_id, size, price)
SELECT p.id, size_data.size, size_data.price
FROM (VALUES
  ('Bolo Floresta Negra', 'pequeno', 59.90), ('Bolo Floresta Negra', 'medio', 89.90), ('Bolo Floresta Negra', 'grande', 129.90),
  ('Torta Holandesa', 'pequeno', 49.90), ('Torta Holandesa', 'medio', 74.90), ('Torta Holandesa', 'grande', 109.90),
  ('Cheesecake de Frutas', 'pequeno', 11.90), ('Cheesecake de Frutas', 'medio', 16.90), ('Cheesecake de Frutas', 'grande', 24.90)
) AS size_data(name, size, price)
JOIN products p ON p.name = size_data.name
ON CONFLICT (product_id, size) DO NOTHING;