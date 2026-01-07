import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Server-side Supabase client with service role (bypasses RLS)
// Only create client if URL is provided, otherwise return null
function createSupabaseAdmin() {
  // Prevent client-side execution to avoid White Screen errors
  if (typeof window !== 'undefined') {
    return null;
  }

  if (!supabaseUrl) {
    // Only throw logs in development/build to avoid hard crashes if possible, 
    // but better to throw if misconfigured on server.
    // Yet for safety against build crashes:
    console.error('⚠️ NEXT_PUBLIC_SUPABASE_URL is not set.');
    return null;
  }

  if (!supabaseServiceRoleKey) {
    console.error(
      '⚠️ SUPABASE_SERVICE_ROLE_KEY is not set. Service role operations will fail. ' +
      'Add it to Vercel Environment Variables.'
    );
    // Don't throw immediately to allow app to start, but admin ops will fail.
    return null;
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
  if (typeof window !== 'undefined') {
    throw new Error('getSupabaseAdmin() cannot be called on the client-side. Use Supabase Client instead.');
  }

  if (!supabaseAdmin) {
    throw new Error(
      'Supabase Admin is not configured. Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL.'
    );
  }
  return supabaseAdmin;
}

export default supabaseAdmin;

