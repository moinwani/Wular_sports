import { getAuth, Auth } from 'firebase/auth';
import { getApp } from './firebase-core';

let _auth: Auth | null = null;

export function getFirebaseAuth(): Auth | null {
    const app = getApp();
    if (!app) return null;
    try {
        if (!_auth) _auth = getAuth(app);
        return _auth;
    } catch {
        return null;
    }
}

export const auth = new Proxy({} as Auth, {
    get(_target, prop) {
        const instance = getFirebaseAuth();
        if (!instance) return undefined;
        const val = (instance as any)[prop];
        return typeof val === 'function' ? val.bind(instance) : val;
    }
});
