import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://ouhwlufpjylztmvzinqx.supabase.co',
  'sb_publishable_Kj1hEGG810afckHZkMnXJA_N51XQyf2',
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } }
);
