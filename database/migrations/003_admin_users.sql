CREATE TABLE IF NOT EXISTS admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(320) NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_users_self_read ON admin_users;
CREATE POLICY admin_users_self_read ON admin_users FOR SELECT
  USING (auth.uid() = user_id OR current_setting('app.admin', true) = 'true');

DROP POLICY IF EXISTS admin_users_server_write ON admin_users;
CREATE POLICY admin_users_server_write ON admin_users FOR ALL
  USING (current_setting('app.admin', true) = 'true')
  WITH CHECK (current_setting('app.admin', true) = 'true');