import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

let _app: FirebaseApp | null = null;
let _db: Firestore | null = null;
let _auth: Auth | null = null;

function getApp(): FirebaseApp | null {
    if (typeof window === 'undefined') return null;
    if (!_app) {
        _app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    }
    return _app;
}

export function getDb(): Firestore | null {
    const app = getApp();
    if (!app) return null;
    if (!_db) _db = getFirestore(app);
    return _db;
}

export function getFirebaseAuth(): Auth | null {
    const app = getApp();
    if (!app) return null;
    if (!_auth) _auth = getAuth(app);
    return _auth;
}

export const analytics = null;

// Lazy proxy exports for backward compatibility
export const db = new Proxy({} as Firestore, {
    get(_target, prop) {
        const instance = getDb();
        if (!instance) return undefined;
        const val = (instance as any)[prop];
        return typeof val === 'function' ? val.bind(instance) : val;
    }
});

export const auth = new Proxy({} as Auth, {
    get(_target, prop) {
        const instance = getFirebaseAuth();
        if (!instance) return undefined;
        const val = (instance as any)[prop];
        return typeof val === 'function' ? val.bind(instance) : val;
    }
});

export default _app;
