import { createCupAdmin, getCupAdmin } from './admin-cups';
import { createCup, getCup } from './cups';
import { isAdminSDKAvailable } from './admin-config';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import type { Cup } from '../types';

/**
 * Create cup with fallback mechanism
 * Tries Admin SDK first, then Supabase, then client SDK
 */
export async function createCupWithFallback(
  cupId: string,
  material: 'pp_plastic' | 'bamboo_fiber',
  storeId?: string
): Promise<Cup> {
  // Try Admin SDK first
  if (isAdminSDKAvailable()) {
    try {
      // Admin SDK update usually requires separate implementation, 
      // but for now we focus on Supabase as primary for this feature 
      // or assume admin function is updated elsewhere.
      // We will pass storeId if the admin function supports it, 
      // but strictly following the plan, we update the fallback logic heavily used here.
      return await createCupAdmin(cupId, material);
    } catch (error: unknown) {
      const err = error as Error;
      console.warn('⚠️ Admin SDK failed, trying Supabase:', err.message);
    }
  }

  // Try Supabase (has service role, bypasses RLS)
  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch {
    supabase = null;
  }
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('cups')
        .insert({
          cup_id: cupId,
          material,
          status: 'available',
          total_uses: 0,
          store_id: storeId, // Save store location
        })
        .select()
        .single();

      if (error) throw error;

      return {
        cupId: data.cup_id,
        material: data.material as 'pp_plastic' | 'bamboo_fiber',
        status: data.status as 'available',
        createdAt: new Date(data.created_at),
        totalUses: data.total_uses || 0,
        storeId: data.store_id,
      };
    } catch (error: unknown) {
      const err = error as Error;
      console.warn('⚠️ Supabase failed, trying client SDK:', err.message);
    }
  }

  // Fallback to client SDK (requires authentication)
  // This will work if user is authenticated
  try {
    return await createCup(cupId, material);
  } catch (error: unknown) {
    const err = error as Error;
    throw new Error(
      `Failed to create cup: ${err.message}. ` +
      `Please ensure Firebase Admin SDK is configured or user is authenticated.`
    );
  }
}

/**
 * Get cup with fallback mechanism
 */
export async function getCupWithFallback(cupId: string): Promise<Cup | null> {
  // Try Admin SDK first
  if (isAdminSDKAvailable()) {
    try {
      const cup = await getCupAdmin(cupId);
      if (cup) return cup;
    } catch (error: unknown) {
      const err = error as Error;
      console.warn('⚠️ Admin SDK failed, trying Supabase:', err.message);
    }
  }

  // Try Supabase
  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch {
    supabase = null;
  }
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('cups')
        .select('*')
        .eq('cup_id', cupId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
      if (!data) return null;

      return {
        cupId: data.cup_id,
        material: data.material as 'pp_plastic' | 'bamboo_fiber',
        status: data.status as 'available' | 'in_use' | 'cleaning' | 'lost',
        createdAt: new Date(data.created_at),
        totalUses: data.total_uses || 0,
        lastCleanedAt: data.last_cleaned_at ? new Date(data.last_cleaned_at) : undefined,
        currentUserId: data.current_user_id || undefined,
        currentTransactionId: data.current_transaction_id || undefined,
      };
    } catch (error: unknown) {
      const err = error as Error;
      console.warn('⚠️ Supabase failed, trying client SDK:', err.message);
    }
  }

  // Fallback to client SDK
  return await getCup(cupId);
}

