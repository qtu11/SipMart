import { getSupabaseAdmin } from './server';

// Store type based on Prisma schema
export interface Store {
    storeId: string;
    name: string;
    gpsLat: number;
    gpsLng: number;
    address: string;
    cupAvailable: number;
    cupInUse: number;
    cupCleaning: number;
    cupTotal: number;
    partnerStatus: 'active' | 'inactive' | 'pending';
    createdAt: Date;
}

const getAdmin = () => getSupabaseAdmin();

// Create store
export async function createStore(params: {
    name: string;
    gpsLat: number;
    gpsLng: number;
    address: string;
    cupTotal?: number;
}): Promise<Store> {
    const { name, gpsLat, gpsLng, address, cupTotal = 0 } = params;

    const { data, error } = await getAdmin()
        .from('stores')
        .insert({
            name,
            gps_lat: gpsLat,
            gps_lng: gpsLng,
            address,
            cup_available: cupTotal,
            cup_in_use: 0,
            cup_cleaning: 0,
            cup_total: cupTotal,
            partner_status: 'active',
        })
        .select()
        .single();

    if (error) throw error;
    return mapStoreFromDb(data);
}

// Get store by ID
export async function getStore(storeId: string): Promise<Store | null> {
    const { data, error } = await getAdmin()
        .from('stores')
        .select('*')
        .eq('store_id', storeId)
        .single();

    if (error || !data) return null;
    return mapStoreFromDb(data);
}

// Get all stores
export async function getAllStores(filters?: {
    partnerStatus?: Store['partnerStatus'];
    limit?: number;
}): Promise<Store[]> {
    let query = getAdmin()
        .from('stores')
        .select('*')
        .order('name', { ascending: true });

    if (filters?.partnerStatus) {
        query = query.eq('partner_status', filters.partnerStatus);
    }
    if (filters?.limit) {
        query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    if (!data) return [];

    return data.map(mapStoreFromDb);
}

// Get active stores
export async function getActiveStores(): Promise<Store[]> {
    return getAllStores({ partnerStatus: 'active' });
}

// Update store inventory
export async function updateStoreInventory(
    storeId: string,
    inventory: {
        cupAvailable?: number;
        cupInUse?: number;
        cupCleaning?: number;
        cupTotal?: number;
    }
): Promise<Store> {
    const updateData: any = {};

    if (inventory.cupAvailable !== undefined) updateData.cup_available = inventory.cupAvailable;
    if (inventory.cupInUse !== undefined) updateData.cup_in_use = inventory.cupInUse;
    if (inventory.cupCleaning !== undefined) updateData.cup_cleaning = inventory.cupCleaning;
    if (inventory.cupTotal !== undefined) updateData.cup_total = inventory.cupTotal;

    const { data, error } = await getAdmin()
        .from('stores')
        .update(updateData)
        .eq('store_id', storeId)
        .select()
        .single();

    if (error) throw error;
    if (!data) throw new Error('Store not found');

    return mapStoreFromDb(data);
}

// Add cups to store
export async function addCupsToStore(storeId: string, count: number): Promise<Store> {
    const store = await getStore(storeId);
    if (!store) throw new Error('Store not found');

    return updateStoreInventory(storeId, {
        cupAvailable: store.cupAvailable + count,
        cupTotal: store.cupTotal + count,
    });
}

// Borrow cup from store
export async function borrowCupFromStore(storeId: string): Promise<Store> {
    const store = await getStore(storeId);
    if (!store) throw new Error('Store not found');
    if (store.cupAvailable <= 0) throw new Error('No cups available');

    return updateStoreInventory(storeId, {
        cupAvailable: store.cupAvailable - 1,
        cupInUse: store.cupInUse + 1,
    });
}

// Return cup to store
export async function returnCupToStore(storeId: string): Promise<Store> {
    const store = await getStore(storeId);
    if (!store) throw new Error('Store not found');

    return updateStoreInventory(storeId, {
        cupInUse: Math.max(0, store.cupInUse - 1),
        cupCleaning: store.cupCleaning + 1,
    });
}

// Mark cup cleaned at store
export async function markCupCleanedAtStore(storeId: string): Promise<Store> {
    const store = await getStore(storeId);
    if (!store) throw new Error('Store not found');

    return updateStoreInventory(storeId, {
        cupCleaning: Math.max(0, store.cupCleaning - 1),
        cupAvailable: store.cupAvailable + 1,
    });
}

// Update store status
export async function updateStoreStatus(
    storeId: string,
    status: Store['partnerStatus']
): Promise<Store> {
    const { data, error } = await getAdmin()
        .from('stores')
        .update({
            partner_status: status,
        })
        .eq('store_id', storeId)
        .select()
        .single();

    if (error) throw error;
    if (!data) throw new Error('Store not found');

    return mapStoreFromDb(data);
}

// Find nearby stores
export async function findNearbyStores(
    lat: number,
    lng: number,
    radiusKm: number = 5
): Promise<Store[]> {
    // Get all active stores
    const stores = await getActiveStores();

    // Filter by distance using Haversine formula
    const nearbyStores = stores.filter(store => {
        const distance = calculateDistance(lat, lng, store.gpsLat, store.gpsLng);
        return distance <= radiusKm;
    });

    // Sort by distance
    return nearbyStores.sort((a, b) => {
        const distA = calculateDistance(lat, lng, a.gpsLat, a.gpsLng);
        const distB = calculateDistance(lat, lng, b.gpsLat, b.gpsLng);
        return distA - distB;
    });
}

// Delete store
export async function deleteStore(storeId: string): Promise<void> {
    const { error } = await getAdmin()
        .from('stores')
        .delete()
        .eq('store_id', storeId);

    if (error) throw error;
}

// Helper: Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
}

// Map database row to Store type
function mapStoreFromDb(row: any): Store {
    return {
        storeId: row.store_id,
        name: row.name,
        gpsLat: parseFloat(row.gps_lat),
        gpsLng: parseFloat(row.gps_lng),
        address: row.address,
        cupAvailable: row.cup_available || 0,
        cupInUse: row.cup_in_use || 0,
        cupCleaning: row.cup_cleaning || 0,
        cupTotal: row.cup_total || 0,
        partnerStatus: row.partner_status as Store['partnerStatus'],
        createdAt: new Date(row.created_at),
    };
}
