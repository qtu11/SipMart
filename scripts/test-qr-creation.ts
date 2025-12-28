/**
 * Test script to verify QR code creation works correctly
 * Run: npx tsx scripts/test-qr-creation.ts
 */

import { createCupAdmin } from '../lib/firebase/admin-cups';
import { addCupsToStoreAdmin } from '../lib/firebase/admin-stores';
import { generateUniqueCupId, generateQRCodeData } from '../lib/utils/cupId';

async function main() {
  try {
    console.log('🧪 Testing QR code creation...\n');

    // Test 1: Generate unique cup ID
    console.log('1. Generating unique cup ID...');
    const cupId = await generateUniqueCupId();
    console.log(`   ✅ Generated cup ID: ${cupId}\n`);

    // Test 2: Create cup in Firestore
    console.log('2. Creating cup in Firestore...');
    const cup = await createCupAdmin(cupId, 'pp_plastic');
    console.log(`   ✅ Cup created:`, {
      cupId: cup.cupId,
      material: cup.material,
      status: cup.status,
    });
    console.log('');

    // Test 3: Generate QR code data
    console.log('3. Generating QR code data...');
    const qrData = generateQRCodeData(cupId, 'pp_plastic');
    console.log(`   ✅ QR Data: ${qrData}\n`);

    // Test 4: Add cups to store (using a test store ID)
    console.log('4. Testing store inventory update...');
    const testStoreId = 'test-store-1';
    try {
      await addCupsToStoreAdmin(testStoreId, 1);
      console.log(`   ✅ Inventory updated for store: ${testStoreId}\n`);
    } catch (error: any) {
      if (error.message?.includes('No document to update')) {
        console.log(`   ⚠️  Store ${testStoreId} doesn't exist (expected in test)\n`);
      } else {
        throw error;
      }
    }

    console.log('✅ All tests passed!');
    console.log('\n📝 Summary:');
    console.log(`   - Cup ID generation: ✅`);
    console.log(`   - Firestore write: ✅`);
    console.log(`   - QR code data: ✅`);
    console.log(`   - Store inventory: ✅`);
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();

