/**
 * Supabase service exports
 * Centralized export for all Supabase operations
 */

// Users
export * from './users';

// Clients
export { supabase } from './client';
export { supabaseAdmin, getSupabaseAdmin } from './server';

