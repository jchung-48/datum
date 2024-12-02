import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin only if it hasn't been initialized already
try {
    if (!process.env.FIREBASE_ADMIN_JSON) {
        throw new Error('Missing FIREBASE_ADMIN_JSON environment variable');
    }
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(
                process.env.FIREBASE_ADMIN_JSON || '',
            ),
        });
    }
} catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
}

export default admin;
