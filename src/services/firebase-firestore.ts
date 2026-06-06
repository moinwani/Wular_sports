import { getFirestore, Firestore } from 'firebase/firestore';
import { getApp } from './firebase-core';

let _db: Firestore | null = null;

export function getDb(): Firestore | null {
    const app = getApp();
    if (!app) return null;
    try {
        if (!_db) _db = getFirestore(app);
        return _db;
    } catch {
        return null;
    }
}

export const db = new Proxy({} as Firestore, {
    get(_target, prop) {
        const instance = getDb();
        if (!instance) return undefined;
        const val = (instance as any)[prop];
        return typeof val === 'function' ? val.bind(instance) : val;
    }
});
