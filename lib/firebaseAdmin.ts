import admin from 'firebase-admin';

// Initialize Firebase Admin only if it hasn't been initialized already
try {
  admin.initializeApp({
    credential: admin.credential.cert('./datum-115a-firebase-adminsdk-8jq7s-5464beb7be.json')
  });
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
}

export default admin;