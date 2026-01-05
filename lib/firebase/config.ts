import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getMessaging, Messaging, isSupported as isMessagingSupported } from 'firebase/messaging';
import { logger } from '../logger';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate Firebase config
if (typeof window !== 'undefined') {
  const missingConfigs: string[] = [];
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'undefined') missingConfigs.push('NEXT_PUBLIC_FIREBASE_API_KEY');
  if (!firebaseConfig.authDomain || firebaseConfig.authDomain === 'undefined') missingConfigs.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
  if (!firebaseConfig.projectId || firebaseConfig.projectId === 'undefined') missingConfigs.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');

  if (missingConfigs.length > 0) {
    logger.error(`Missing Firebase config: ${missingConfigs.join(', ')}`);

  }
}

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (error: unknown) {
    const err = error as Error; throw error;
  }
} else {
  app = getApps()[0];
}

// Initialize services
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);

// Initialize messaging (only in browser)
let messaging: Messaging | null = null;
if (typeof window !== 'undefined') {
  isMessagingSupported().then((supported) => {
    if (supported) {
      try {
        messaging = getMessaging(app);
      } catch (error) {
        console.warn('Firebase Messaging initialization error:', error);
      }
    }
  }).catch(() => {
    // Ignore messaging errors
  });
}
export { messaging };

export default app;

