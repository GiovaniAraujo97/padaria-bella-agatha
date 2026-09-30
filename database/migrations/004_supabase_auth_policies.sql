DROP POLICY IF EXISTS categories_read_public_or_admin ON categories;
CREATE POLICY categories_read_public_or_admin ON categories FOR SELECT
  USING (is_visible OR EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND is_active
  ));

DROP POLICY IF EXISTS categories_admin_write ON categories;
CREATE POLICY categories_admin_write ON categories FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND is_active
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND is_active
  ));

DROP POLICY IF EXISTS products_read_public_or_admin ON products;
CREATE POLICY products_read_public_or_admin ON products FOR SELECT
  USING (is_published OR EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND is_active
  ));

DROP POLICY IF EXISTS products_admin_write ON products;
CREATE POLICY products_admin_write ON products FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND is_active
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND is_active
  ));

DROP POLICY IF EXISTS product_sizes_read_public_or_admin ON product_sizes;
CREATE POLICY product_sizes_read_public_or_admin ON product_sizes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM products p
    JOIN categories c ON c.id = p.category_id
    WHERE p.id = product_id AND p.is_published AND c.is_visible
  ) OR EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND is_active
  ));

DROP POLICY IF EXISTS product_sizes_admin_write ON product_sizes;
CREATE POLICY product_sizes_admin_write ON product_sizes FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND is_active
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND is_active
  ));

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', TRUE)
ON CONFLICT (id) DO UPDATE SET public = TRUE;

DROP POLICY IF EXISTS product_images_public_read ON storage.objects;
CREATE POLICY product_images_public_read ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS product_images_admin_insert ON storage.objects;
CREATE POLICY product_images_admin_insert ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND is_active
  ));

DROP POLICY IF EXISTS product_images_admin_update ON storage.objects;
CREATE POLICY product_images_admin_update ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images' AND EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND is_active
  ))
  WITH CHECK (bucket_id = 'product-images' AND EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND is_active
  ));

DROP POLICY IF EXISTS product_images_admin_delete ON storage.objects;
CREATE POLICY product_images_admin_delete ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND is_active
  ));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'categories'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'products'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'product_sizes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.product_sizes;
  END IF;
END $$;
