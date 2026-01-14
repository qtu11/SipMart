import * as admin from 'firebase-admin';
import { logger } from '@/lib/logger';

// Prevent initializing app multiple times
if (!admin.apps.length) {
    try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) as admin.ServiceAccount;
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
        }
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.warn('Failed to initialize Firebase Admin', { error: err.message });
    }
}

export async function sendPushNotification(token: string, title: string, body: string, data?: any) {
    if (!admin.apps.length) {
        // console.log('Firebase not initialized, skipping push');
        return false;
    }

    try {
        await admin.messaging().send({
            token,
            notification: { title, body },
            data: data ? { ...data } : undefined,
        });
        return true;
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('FCM Send Error', { error: err.message });
        return false;
    }
}
