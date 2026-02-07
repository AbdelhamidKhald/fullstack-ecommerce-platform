import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Please copy .env.example to .env and fill in your Supabase credentials. ' +
    'See README.md for setup instructions.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
