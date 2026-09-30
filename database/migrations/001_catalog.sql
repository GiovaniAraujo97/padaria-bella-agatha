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
-- Catalog records are created from the admin panel.

