CREATE TABLE IF NOT EXISTS public.categories (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(60) NOT NULL DEFAULT 'bakery_dining',
  slug VARCHAR(100) NOT NULL,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  has_sizes BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  category_id BIGINT NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
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

CREATE TABLE IF NOT EXISTS public.product_sizes (
  product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size VARCHAR(16) NOT NULL CHECK (size IN ('pequeno', 'medio', 'grande')),
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  PRIMARY KEY (product_id, size)
);

CREATE INDEX IF NOT EXISTS products_public_order_idx
  ON public.products (is_published, display_order, name);
CREATE INDEX IF NOT EXISTS products_category_idx
  ON public.products (category_id);

INSERT INTO public.empresas (nome, slug)
VALUES ('Padaria Bella Agatha', 'padaria-bella-agatha')
ON CONFLICT (slug) DO NOTHING;

DO $$
DECLARE
  empresa_id_type TEXT;
BEGIN
  SELECT format_type(attribute.atttypid, attribute.atttypmod)
  INTO empresa_id_type
  FROM pg_attribute AS attribute
  WHERE attribute.attrelid = 'public.empresas'::regclass
    AND attribute.attname = 'id'
    AND NOT attribute.attisdropped;

  IF empresa_id_type IS NULL THEN
    RAISE EXCEPTION 'public.empresas.id was not found';
  END IF;

  EXECUTE format('ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS empresa_id %s', empresa_id_type);
  EXECUTE format('ALTER TABLE public.products ADD COLUMN IF NOT EXISTS empresa_id %s', empresa_id_type);
  IF to_regclass('public.categorias') IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.categorias ADD COLUMN IF NOT EXISTS empresa_id %s', empresa_id_type);
    EXECUTE format(
      'UPDATE public.categorias AS category SET empresa_id = company.id FROM public.empresas AS company WHERE company.slug = %L AND category.empresa_id IS NULL',
      'padaria-bella-agatha'
    );
    ALTER TABLE public.categorias ALTER COLUMN empresa_id SET NOT NULL;
  END IF;
END $$;

UPDATE public.categories AS category
SET empresa_id = company.id
FROM public.empresas AS company
WHERE company.slug = 'padaria-bella-agatha'
  AND category.empresa_id IS NULL;

UPDATE public.products AS product
SET empresa_id = company.id
FROM public.empresas AS company
WHERE company.slug = 'padaria-bella-agatha'
  AND product.empresa_id IS NULL;

DELETE FROM public.product_sizes AS size
USING public.products AS product
WHERE size.product_id = product.id
  AND (
    NOT EXISTS (
      SELECT 1 FROM public.empresas AS company
      WHERE company.id = product.empresa_id
    )
    OR NOT EXISTS (
      SELECT 1 FROM public.categories AS category
      WHERE category.id = product.category_id
        AND category.empresa_id = product.empresa_id
    )
  );

DELETE FROM public.products AS product
WHERE NOT EXISTS (
    SELECT 1 FROM public.empresas AS company
    WHERE company.id = product.empresa_id
  )
  OR NOT EXISTS (
    SELECT 1 FROM public.categories AS category
    WHERE category.id = product.category_id
      AND category.empresa_id = product.empresa_id
  );

DELETE FROM public.categories AS category
WHERE NOT EXISTS (
  SELECT 1 FROM public.empresas AS company
  WHERE company.id = category.empresa_id
);

DELETE FROM public.usuarios AS usuario
WHERE NOT EXISTS (
  SELECT 1 FROM public.empresas AS company
  WHERE company.id = usuario.empresa_id
);

DO $$
BEGIN
  IF to_regclass('public.categorias') IS NOT NULL THEN
    EXECUTE $cleanup$
      DELETE FROM public.categorias AS category
      WHERE NOT EXISTS (
        SELECT 1 FROM public.empresas AS company
        WHERE company.id = category.empresa_id
      )
    $cleanup$;
  END IF;
END $$;

ALTER TABLE public.categories ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE public.products ALTER COLUMN empresa_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'categories_empresa_id_fkey'
      AND conrelid = 'public.categories'::regclass
  ) THEN
    ALTER TABLE public.categories
      ADD CONSTRAINT categories_empresa_id_fkey
      FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'products_empresa_id_fkey'
      AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_empresa_id_fkey
      FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'categories_id_empresa_id_key'
      AND conrelid = 'public.categories'::regclass
  ) THEN
    ALTER TABLE public.categories
      ADD CONSTRAINT categories_id_empresa_id_key UNIQUE (id, empresa_id);
  END IF;

  IF to_regclass('public.categorias') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'categorias_empresa_id_fkey'
        AND conrelid = 'public.categorias'::regclass
    ) THEN
      ALTER TABLE public.categorias
        ADD CONSTRAINT categorias_empresa_id_fkey
        FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'categorias_id_empresa_id_key'
        AND conrelid = 'public.categorias'::regclass
    ) THEN
      ALTER TABLE public.categorias
        ADD CONSTRAINT categorias_id_empresa_id_key UNIQUE (id, empresa_id);
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'categories_slug_key'
      AND conrelid = 'public.categories'::regclass
  ) THEN
    ALTER TABLE public.categories DROP CONSTRAINT categories_slug_key;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'categories_empresa_slug_key'
      AND conrelid = 'public.categories'::regclass
  ) THEN
    ALTER TABLE public.categories
      ADD CONSTRAINT categories_empresa_slug_key UNIQUE (empresa_id, slug);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'products_category_empresa_fkey'
      AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_category_empresa_fkey
      FOREIGN KEY (category_id, empresa_id)
      REFERENCES public.categories (id, empresa_id)
      ON DELETE RESTRICT;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'products_category_id_fkey'
      AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products DROP CONSTRAINT products_category_id_fkey;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS categories_empresa_order_idx
  ON public.categories (empresa_id, display_order, name);
CREATE INDEX IF NOT EXISTS products_empresa_order_idx
  ON public.products (empresa_id, display_order, name);
CREATE INDEX IF NOT EXISTS usuarios_empresa_id_idx
  ON public.usuarios (empresa_id);
DO $$
BEGIN
  IF to_regclass('public.categorias') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS categorias_empresa_order_idx
      ON public.categorias (empresa_id, id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.current_empresa_id()
RETURNS BIGINT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT empresa_id::BIGINT
  FROM public.usuarios
  WHERE auth_user_id = auth.uid() AND role = 'admin'
$$;

REVOKE ALL ON FUNCTION public.current_empresa_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_empresa_id() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.enforce_current_empresa_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  tenant_id BIGINT;
BEGIN
  tenant_id := public.current_empresa_id();
  IF tenant_id IS NULL THEN
    RAISE EXCEPTION 'Authenticated user is not assigned to a company'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.empresa_id IS NULL THEN
    NEW.empresa_id := tenant_id;
  ELSIF NEW.empresa_id::BIGINT <> tenant_id THEN
    RAISE EXCEPTION 'Cannot write data for another company'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS categories_set_empresa_id ON public.categories;
CREATE TRIGGER categories_set_empresa_id
  BEFORE INSERT OR UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.enforce_current_empresa_id();

DROP TRIGGER IF EXISTS products_set_empresa_id ON public.products;
CREATE TRIGGER products_set_empresa_id
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.enforce_current_empresa_id();

DO $$
BEGIN
  IF to_regclass('public.categorias') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS categorias_set_empresa_id ON public.categorias;
    CREATE TRIGGER categorias_set_empresa_id
      BEFORE INSERT OR UPDATE ON public.categorias
      FOR EACH ROW EXECUTE FUNCTION public.enforce_current_empresa_id();
  END IF;
END $$;

DO $$
DECLARE
  policy RECORD;
BEGIN
  FOR policy IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = ANY (ARRAY['empresas', 'usuarios', 'categories', 'categorias', 'products', 'product_sizes'])
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', policy.policyname, policy.tablename);
  END LOOP;
END $$;

ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF to_regclass('public.categorias') IS NOT NULL THEN
    ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_sizes ENABLE ROW LEVEL SECURITY;

CREATE POLICY empresas_public_read ON public.empresas FOR SELECT TO anon
  USING (ativo AND slug = 'padaria-bella-agatha');
CREATE POLICY empresas_admin_read ON public.empresas FOR SELECT TO authenticated
  USING (id = public.current_empresa_id());
CREATE POLICY empresas_admin_update ON public.empresas FOR UPDATE TO authenticated
  USING (id = public.current_empresa_id())
  WITH CHECK (id = public.current_empresa_id());

CREATE POLICY usuarios_admin_read_self ON public.usuarios FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid() AND role = 'admin');

CREATE POLICY categories_public_read ON public.categories FOR SELECT TO anon
  USING (is_visible AND EXISTS (
    SELECT 1 FROM public.empresas AS company
    WHERE company.id = empresa_id
      AND company.ativo
      AND company.slug = 'padaria-bella-agatha'
  ));
CREATE POLICY categories_tenant_read ON public.categories FOR SELECT TO authenticated
  USING (empresa_id = public.current_empresa_id());
CREATE POLICY categories_tenant_insert ON public.categories FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.current_empresa_id());
CREATE POLICY categories_tenant_update ON public.categories FOR UPDATE TO authenticated
  USING (empresa_id = public.current_empresa_id())
  WITH CHECK (empresa_id = public.current_empresa_id());
CREATE POLICY categories_tenant_delete ON public.categories FOR DELETE TO authenticated
  USING (empresa_id = public.current_empresa_id());

DO $$
BEGIN
  IF to_regclass('public.categorias') IS NOT NULL THEN
    EXECUTE $policy$
      CREATE POLICY categorias_public_read ON public.categorias FOR SELECT TO anon
      USING (ativo AND EXISTS (
        SELECT 1 FROM public.empresas AS company
        WHERE company.id = empresa_id AND company.ativo AND company.slug = 'padaria-bella-agatha'
      ))
    $policy$;
    EXECUTE $policy$
      CREATE POLICY categorias_tenant_read ON public.categorias FOR SELECT TO authenticated
      USING (empresa_id = public.current_empresa_id())
    $policy$;
    EXECUTE $policy$
      CREATE POLICY categorias_tenant_insert ON public.categorias FOR INSERT TO authenticated
      WITH CHECK (empresa_id = public.current_empresa_id())
    $policy$;
    EXECUTE $policy$
      CREATE POLICY categorias_tenant_update ON public.categorias FOR UPDATE TO authenticated
      USING (empresa_id = public.current_empresa_id())
      WITH CHECK (empresa_id = public.current_empresa_id())
    $policy$;
    EXECUTE $policy$
      CREATE POLICY categorias_tenant_delete ON public.categorias FOR DELETE TO authenticated
      USING (empresa_id = public.current_empresa_id())
    $policy$;
  END IF;
END $$;

CREATE POLICY products_public_read ON public.products FOR SELECT TO anon
  USING (is_published AND EXISTS (
    SELECT 1 FROM public.empresas AS company
    WHERE company.id = empresa_id
      AND company.ativo
      AND company.slug = 'padaria-bella-agatha'
  ));
CREATE POLICY products_tenant_read ON public.products FOR SELECT TO authenticated
  USING (empresa_id = public.current_empresa_id());
CREATE POLICY products_tenant_insert ON public.products FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.current_empresa_id());
CREATE POLICY products_tenant_update ON public.products FOR UPDATE TO authenticated
  USING (empresa_id = public.current_empresa_id())
  WITH CHECK (empresa_id = public.current_empresa_id());
CREATE POLICY products_tenant_delete ON public.products FOR DELETE TO authenticated
  USING (empresa_id = public.current_empresa_id());

CREATE POLICY product_sizes_public_read ON public.product_sizes FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1
    FROM public.products AS product
    JOIN public.categories AS category
      ON category.id = product.category_id
     AND category.empresa_id = product.empresa_id
    JOIN public.empresas AS company ON company.id = product.empresa_id
    WHERE product.id = product_id
      AND product.is_published
      AND category.is_visible
      AND company.ativo
      AND company.slug = 'padaria-bella-agatha'
  ));
CREATE POLICY product_sizes_tenant_read ON public.product_sizes FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.products AS product
    WHERE product.id = product_id AND product.empresa_id = public.current_empresa_id()
  ));
CREATE POLICY product_sizes_tenant_insert ON public.product_sizes FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.products AS product
    WHERE product.id = product_id AND product.empresa_id = public.current_empresa_id()
  ));
CREATE POLICY product_sizes_tenant_update ON public.product_sizes FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.products AS product
    WHERE product.id = product_id AND product.empresa_id = public.current_empresa_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.products AS product
    WHERE product.id = product_id AND product.empresa_id = public.current_empresa_id()
  ));
CREATE POLICY product_sizes_tenant_delete ON public.product_sizes FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.products AS product
    WHERE product.id = product_id AND product.empresa_id = public.current_empresa_id()
  ));

GRANT SELECT ON public.empresas, public.categories, public.products, public.product_sizes
  TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.empresas, public.categories, public.products, public.product_sizes
  TO authenticated;
GRANT SELECT ON public.usuarios TO authenticated;
DO $$
BEGIN
  IF to_regclass('public.categorias') IS NOT NULL THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.categorias TO authenticated;
    GRANT SELECT ON public.categorias TO anon;
  END IF;
END $$;
DO $$
DECLARE
  sequence_name TEXT;
BEGIN
  sequence_name := pg_get_serial_sequence('public.categories', 'id');
  IF sequence_name IS NOT NULL THEN
    EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE %s TO authenticated', sequence_name);
  END IF;

  sequence_name := pg_get_serial_sequence('public.products', 'id');
  IF sequence_name IS NOT NULL THEN
    EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE %s TO authenticated', sequence_name);
  END IF;
END $$;

DO $$
DECLARE
  policy RECORD;
BEGIN
  FOR policy IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname LIKE 'product_images_%'
  LOOP
    EXECUTE format('DROP POLICY %I ON storage.objects', policy.policyname);
  END LOOP;
END $$;

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', TRUE)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

CREATE POLICY product_images_public_read ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'product-images');
CREATE POLICY product_images_tenant_insert ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = public.current_empresa_id()::TEXT
  );
CREATE POLICY product_images_tenant_update ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = public.current_empresa_id()::TEXT
  )
  WITH CHECK (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = public.current_empresa_id()::TEXT
  );
CREATE POLICY product_images_tenant_delete ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = public.current_empresa_id()::TEXT
  );

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'categories'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'products'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'product_sizes'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.product_sizes;
    END IF;
  END IF;
END $$;