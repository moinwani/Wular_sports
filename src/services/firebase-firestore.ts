import { getFirestore, Firestore } from 'firebase/firestore';
import { getApp } from './firebase-core';

let _db: Firestore | null = null;

export function getFirestoreDb(): Firestore {
    const app = getApp();
    if (!app) throw new Error('Firebase app not initialized');
    if (!_db) _db = getFirestore(app);
    return _db;
}
