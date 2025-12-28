/**
 * Migration script to ensure Firebase Admin SDK is properly configured
 * Run this script to verify and setup Firebase Admin SDK
 */

import { getAdminApp, getAdminDb } from '../lib/firebase/admin-config';

async function main() {
  try {
    console.log('🔧 Initializing Firebase Admin SDK...');
    
    const app = getAdminApp();
    console.log('✅ Firebase Admin App initialized');
    
    const db = getAdminDb();
    console.log('✅ Firestore Admin initialized');
    
    // Test connection by reading a document
    console.log('🧪 Testing connection...');
    const testCollection = db.collection('_test');
    const snapshot = await testCollection.limit(1).get();
    console.log('✅ Connection successful!');
    
    console.log('\n📋 Configuration Summary:');
    console.log(`   Project ID: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'NOT SET'}`);
    console.log(`   Service Account: ${process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? 'SET' : 'NOT SET (using ADC)'}`);
    
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Make sure NEXT_PUBLIC_FIREBASE_PROJECT_ID is set in .env.local');
    console.error('   2. Either set FIREBASE_SERVICE_ACCOUNT_KEY or configure Application Default Credentials');
    console.error('   3. For local dev, run: gcloud auth application-default login');
    process.exit(1);
  }
}

main();

