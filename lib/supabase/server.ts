import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Server-side Supabase client with service role (bypasses RLS)
// Only create client if URL is provided, otherwise return null
function createSupabaseAdmin() {
  if (!supabaseUrl) {
    throw new Error(
      '⚠️ NEXT_PUBLIC_SUPABASE_URL is not set. Please add it to .env.local'
    );
  }

  if (!supabaseServiceRoleKey) {
    throw new Error(
      '⚠️ SUPABASE_SERVICE_ROLE_KEY is not set. Server operations require service role key. ' +
      'Add SUPABASE_SERVICE_ROLE_KEY to .env.local (NOT NEXT_PUBLIC_)'
    );
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export const supabaseAdmin = createSupabaseAdmin();

// Helper to get admin client (throws error if not configured)
export function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    throw new Error(
      'Supabase is not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local. ' +
      'See SUPABASE_SETUP.md for setup instructions.'
    );
  }
  return supabaseAdmin;
}

export default supabaseAdmin;

