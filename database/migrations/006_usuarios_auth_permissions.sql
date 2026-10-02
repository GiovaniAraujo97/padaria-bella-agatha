REVOKE ALL ON TABLE public.usuarios FROM anon, PUBLIC;
GRANT SELECT ON TABLE public.usuarios TO authenticated;

DO $$
BEGIN
  IF to_regclass('public.admin_users') IS NOT NULL THEN
    EXECUTE $backfill$
      INSERT INTO public.usuarios (auth_user_id, empresa_id, nome, email, role)
      SELECT
        admin.user_id,
        company.id,
        split_part(admin.email, '@', 1),
        admin.email,
        'admin'
      FROM public.admin_users AS admin
      CROSS JOIN public.empresas AS company
      WHERE admin.is_active
        AND company.slug = 'padaria-bella-agatha'
      ON CONFLICT (email) DO UPDATE
      SET auth_user_id = EXCLUDED.auth_user_id,
          empresa_id = EXCLUDED.empresa_id,
          role = EXCLUDED.role
    $backfill$;
  END IF;
END $$;

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS usuarios_self_read ON public.usuarios;
DROP POLICY IF EXISTS usuarios_select_own_auth_user ON public.usuarios;
CREATE POLICY usuarios_select_own_auth_user ON public.usuarios FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid() AND role = 'admin');