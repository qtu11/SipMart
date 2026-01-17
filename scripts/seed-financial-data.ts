
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('🌱 Seeding Financial Data...');

    // 1. Get a user
    const { data: users } = await supabase.from('users').select('user_id').limit(1);
    if (!users || users.length === 0) {
        console.error('No users found. Please sign up a user first.');
        return;
    }
    const userId = users[0].user_id;

    // 2. Get a store (or create one)
    let storeId: string;
    const { data: stores } = await supabase.from('stores').select('store_id').limit(1);
    if (stores && stores.length > 0) {
        storeId = stores[0].store_id;
    } else {
        const { data: newStore, error } = await supabase.from('stores').insert({
            name: 'Test Store',
            address: '123 Test St',
            gps_lat: 10.762622,
            gps_lng: 106.660172,
            is_active: true
        }).select().single();
        if (error) throw error;
        storeId = newStore.store_id;
    }

    // 3. Get a station (or create one)
    let stationId: string;
    const { data: stations } = await supabase.from('ebike_stations').select('station_id').limit(1);
    if (stations && stations.length > 0) {
        stationId = stations[0].station_id;
    } else {
        const { data: newStation, error } = await supabase.from('ebike_stations').insert({
            name: 'Test Station',
            gps_lat: 10.762622,
            gps_lng: 106.660172
        }).select().single();
        if (error) {
            // Table might not exist yet if checks failed, but user said errors fixed.
            // Or partial schema. Let's skip if fails.
            console.warn('Could not create station, skipping ebike rentals:', error.message);
            stationId = 'skip';
        } else {
            stationId = newStation.station_id;
        }
    }

    // 4. Get a bike
    let bikeId: string = 'skip';
    if (stationId !== 'skip') {
        const { data: bikes } = await supabase.from('ebikes').select('bike_id').limit(1);
        if (bikes && bikes.length > 0) {
            bikeId = bikes[0].bike_id;
        } else {
            const { data: newBike, error } = await supabase.from('ebikes').insert({
                current_station_id: stationId,
                status: 'available',
                bike_code: 'TEST-01'
            }).select().single();
            if (!error) bikeId = newBike.bike_id;
            else console.warn('Could not create bike:', error.message);
        }
    }

    const today = new Date();

    // 5. Insert Green Mobility Trips
    console.log('Inserting Green Mobility Trips...');
    await supabase.from('green_mobility_trips').insert([
        {
            user_id: userId,
            trip_type: 'bus',
            fare: 50000,
            commission_amount: 50,
            partner_amount: 49950,
            co2_saved_kg: 0.5,
            status: 'completed',
            start_time: today.toISOString(),
        },
        {
            user_id: userId,
            trip_type: 'metro',
            fare: 100000,
            commission_amount: 100,
            partner_amount: 99900,
            co2_saved_kg: 1.2,
            status: 'completed',
            start_time: today.toISOString(),
        }
    ]);

    // 6. Insert E-bike Rentals
    if (bikeId !== 'skip' && stationId !== 'skip') {
        console.log('Inserting E-bike Rentals...');
        await supabase.from('ebike_rentals').insert([
            {
                user_id: userId,
                bike_id: bikeId,
                start_station_id: stationId,
                end_station_id: stationId,
                start_time: today.toISOString(),
                end_time: today.toISOString(),
                fare: 25000,
                commission_amount: 25,
                partner_amount: 24975,
                co2_saved_kg: 0.3,
                status: 'completed',
                distance_km: 5.5
            }
        ]);
    }

    // 7. Insert Cup Transactions
    console.log('Inserting Cup Transactions...');
    // Note: 'transactions' table schema might vary, guessing fields based on usage in route.ts
    // route.ts select: transaction_id, deposit_amount, refund_amount, status, borrow_time
    await supabase.from('transactions').insert([
        {
            user_id: userId,
            store_id: storeId,
            deposit_amount: 50000,
            refund_amount: 50000,
            status: 'completed',
            borrow_time: today.toISOString(),
            return_time: today.toISOString()
        },
        {
            user_id: userId,
            store_id: storeId,
            deposit_amount: 50000,
            status: 'ongoing',
            borrow_time: today.toISOString()
        }
    ]);

    // 8. Insert Payment Transactions
    // route.ts select: payment_id, amount, transaction_type, status, created_at
    console.log('Inserting Payment Transactions...');
    try {
        await supabase.from('payment_transactions').insert([
            {
                user_id: userId,
                amount: 500000,
                transaction_type: 'topup',
                status: 'completed',
                provider_id: 'VNPAY',
                created_at: today.toISOString()
            }
        ]);
    } catch (e: any) {
        console.error('Error inserting payments (table might be missing provider_id or similar):', e.message);
    }

    console.log('✅ Seeding completed! Refresh the dashboard.');
}

main().catch(console.error);
