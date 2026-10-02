import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://wcbmrnsxtqsijbrehglp.supabase.co',
  'sb_publishable_CC3o2DWSPUAa0R5_lOXT6g_SoHRCdji',
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } }
);
