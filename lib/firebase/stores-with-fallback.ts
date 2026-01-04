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
      // Validate UUID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(storeId);
      let targetStoreId = storeId;

      if (!isUuid) {
        // Try to look up store by name if ID is not UUID
        const { data: storeByName } = await supabase
          .from('stores')
          .select('store_id')
          .eq('name', storeId)
          .single();

        if (storeByName) {
          targetStoreId = storeByName.store_id;
        } else {
          throw new Error(`Invalid UUID "${storeId}" and store lookup by name failed`);
        }
      }

      // Supabase stores table uses UUID, but we'll try to update by store_id
      const { error } = await supabase.rpc('increment_store_inventory', {
        p_store_id: targetStoreId,
        p_total: count,
        p_available: count,
      });

      // If RPC doesn't exist, use direct update
      if (error && error.code === '42883') {
        const { data: store } = await supabase
          .from('stores')
          .select('cup_available, cup_total')
          .eq('store_id', targetStoreId)
          .single();

        if (store) {
          await supabase
            .from('stores')
            .update({
              cup_available: (store.cup_available || 0) + count,
              cup_total: (store.cup_total || 0) + count,
            })
            .eq('store_id', targetStoreId);
        } else {
          throw new Error(`Store ${targetStoreId} not found`);
        }
      } else if (error) {
        throw error;
      }
      return;
    } catch (error: unknown) {
      const err = error as Error;
      console.warn('⚠️ Supabase failed, trying client SDK:', err.message);
    }
  }

  // Fallback to client SDK (requires authentication)
  try {
    await addCupsToStore(storeId, count);
  } catch (error: unknown) {
    const err = error as Error;
    throw new Error(
      `Failed to add cups to store: ${err.message}. ` +
      `Please ensure Firebase Admin SDK is configured or user is authenticated.`
    );
  }
}
