// firebase.js (keep it at the root of your project)
import {initializeApp} from 'firebase/app';
import {getAuth} from 'firebase/auth';
import {getFirestore} from 'firebase/firestore';
import {getStorage} from 'firebase/storage';

const firebaseConfig = {
    apiKey: 'AIzaSyCIg5BlkNSuxBgdnxgshvF2Lq9D75sNP4o',
    authDomain: 'datum-115a.firebaseapp.com',
    projectId: 'datum-115a',
    storageBucket: 'datum-115a.appspot.com',
    messagingSenderId: '676156721682',
    appId: '1:676156721682:web:7c37c624c2a074651e66cb',
    measurementId: 'G-BZW74VCDEQ',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig, 'app');

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Initialize Firestore and get a reference to the service
const db = getFirestore(app);

// Initialize Firebase Storage and get a reference to the service
const storage = getStorage(app);

// Export the initialized instances
export {app, auth, db, storage};
