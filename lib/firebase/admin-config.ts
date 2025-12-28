import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// Firebase Admin SDK configuration
// For server-side operations that bypass security rules

let adminApp: App | null = null;
let adminDb: Firestore | null = null;
let adminInitialized = false;
let adminInitError: Error | null = null;

export function getAdminApp(): App {
  if (adminApp) {
    return adminApp;
  }

  // Check if already initialized
  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0];
    adminInitialized = true;
    return adminApp;
  }

  // If we've tried before and failed, throw the cached error
  if (adminInitError) {
    throw adminInitError;
  }

  // Initialize with service account or project config
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  
  if (!projectId) {
    adminInitError = new Error('NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set');
    throw adminInitError;
  }

  // Try to use service account if available
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  if (serviceAccountKey) {
    try {
      const serviceAccount = JSON.parse(serviceAccountKey);
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId,
      });
      adminInitialized = true;
      console.log('✅ Firebase Admin initialized with service account');
      return adminApp;
    } catch (error: any) {
      console.warn('⚠️ Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', error.message);
    }
  }

  // If no service account, try Application Default Credentials (ADC)
  // This works in production environments like Cloud Run, App Engine, etc.
  // For local development, you can use: gcloud auth application-default login
  if (!adminApp) {
    try {
      adminApp = initializeApp({
        projectId,
      });
      adminInitialized = true;
      console.log('✅ Firebase Admin initialized with Application Default Credentials');
      return adminApp;
    } catch (error: any) {
      console.error('❌ Failed to initialize Firebase Admin:', error.message);
      adminInitError = new Error(
        `Firebase Admin initialization failed: ${error.message}. ` +
        `For local development, either: ` +
        `1. Set FIREBASE_SERVICE_ACCOUNT_KEY in .env.local, or ` +
        `2. Run: gcloud auth application-default login`
      );
      throw adminInitError;
    }
  }

  return adminApp;
}

export function getAdminDb(): Firestore {
  if (adminDb) {
    return adminDb;
  }

  try {
    const app = getAdminApp();
    adminDb = getFirestore(app);
    return adminDb;
  } catch (error: any) {
    console.error('❌ Failed to get Admin Firestore:', error.message);
    throw error;
  }
}

// Check if Admin SDK is available
export function isAdminSDKAvailable(): boolean {
  try {
    getAdminApp();
    return true;
  } catch {
    return false;
  }
}

