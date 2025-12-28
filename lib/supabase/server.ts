import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Server-side Supabase client with service role (bypasses RLS)
// Only create client if URL is provided, otherwise return null
function createSupabaseAdmin() {
  if (!supabaseUrl) {
    console.warn('⚠️ NEXT_PUBLIC_SUPABASE_URL is not set. Supabase operations will fail.');
    console.warn('💡 Please add Supabase config to .env.local. See SUPABASE_SETUP.md for details.');
    return null;
  }

  // Prefer service role key (bypasses RLS)
  const key = supabaseServiceRoleKey || supabaseAnonKey;
  
  if (!supabaseServiceRoleKey && supabaseAnonKey) {
    console.warn('⚠️ Using ANON key instead of SERVICE_ROLE key. RLS policies will apply.');
    console.warn('💡 For API routes, use SUPABASE_SERVICE_ROLE_KEY to bypass RLS.');
  }
  if (!key) {
    console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set.');
    return null;
  }

  return createClient(supabaseUrl, key, {
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

