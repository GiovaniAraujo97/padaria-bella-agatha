ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS has_sizes BOOLEAN NOT NULL DEFAULT FALSE;

SELECT set_config('app.admin', 'true', true);

UPDATE categories
SET has_sizes = TRUE
WHERE slug IN ('bolos', 'tortas');