
import { getAllStores } from './lib/supabase/stores';

async function verifyStoreData() {
    try {
        console.log("Fetching stores from DB...");
        const stores = await getAllStores();

        if (stores.length === 0) {
            console.log("No stores found in DB.");
            return;
        }

        console.log(`Found ${stores.length} stores.`);
        stores.forEach(store => {
            console.log(`Store: ${store.name} (${store.storeId})`);
            console.log(` - Raw Cup Available: ${store.cupAvailable}`);
            console.log(` - Raw Cup Total: ${store.cupTotal}`);

            // Simulate API Transformation
            const transformed = {
                cupInventory: {
                    available: store.cupAvailable || 0,
                    total: store.cupTotal || 0,
                }
            };
            console.log(` - Transformed API/Frontend View: Available=${transformed.cupInventory.available}/${transformed.cupInventory.total}`);
            if (store.cupAvailable > 0) {
                console.log("   ✅ Has cups available.");
            } else {
                console.log("   ⚠️ No cups availble (might be normal if none added).");
            }
        });

    } catch (error) {
        console.error("Error verification:", error);
    }
}

verifyStoreData();
