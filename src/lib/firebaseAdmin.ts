import * as admin from 'firebase-admin';

function getServiceAccount(): Record<string, unknown> {
    const encoded = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (encoded) {
        return JSON.parse(Buffer.from(encoded, 'base64').toString('utf-8'));
    }

    const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (keyPath) {
        return require(keyPath);
    }

    throw new Error(
        'FIREBASE_SERVICE_ACCOUNT environment variable is required. ' +
        'Set it to the base64-encoded service account JSON from Firebase Console.'
    );
}

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(getServiceAccount()),
    });
}

export const auth = admin.auth();
