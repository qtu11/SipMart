import { addCupsToStoreAdmin } from './admin-stores';
import { addCupsToStore } from './stores';
import { isAdminSDKAvailable } from './admin-config';
import { getSupabaseAdmin } from '@/lib/supabase/server';

/**
 * Add cups to store with fallback mechanism
 */
export async function addCupsToStoreWithFallback(
  storeId: string,
  count: number
): Promise<void> {
  // Try Admin SDK first
  if (isAdminSDKAvailable()) {
    try {
      await addCupsToStoreAdmin(storeId, count);
      return;
    } catch (error: any) {
      console.warn('⚠️ Admin SDK failed, trying Supabase:', error.message);
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
      // Supabase stores table uses UUID, but we'll try to update by store_id
      const { error } = await supabase.rpc('increment_store_inventory', {
        p_store_id: storeId,
        p_available: count,
        p_total: count,
      });

      // If RPC doesn't exist, use direct update
      if (error && error.code === '42883') {
        const { data: store } = await supabase
          .from('stores')
          .select('cup_available, cup_total')
          .eq('store_id', storeId)
          .single();

        if (store) {
          await supabase
            .from('stores')
            .update({
              cup_available: (store.cup_available || 0) + count,
              cup_total: (store.cup_total || 0) + count,
            })
            .eq('store_id', storeId);
        } else {
          throw new Error(`Store ${storeId} not found`);
        }
      } else if (error) {
        throw error;
      }
      return;
    } catch (error: any) {
      console.warn('⚠️ Supabase failed, trying client SDK:', error.message);
    }
  }

  // Fallback to client SDK (requires authentication)
  try {
    await addCupsToStore(storeId, count);
  } catch (error: any) {
    throw new Error(
      `Failed to add cups to store: ${error.message}. ` +
      `Please ensure Firebase Admin SDK is configured or user is authenticated.`
    );
  }
}


