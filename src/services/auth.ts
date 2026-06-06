import {
    User,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithCredential
} from 'firebase/auth';
import { auth } from './firebase-auth';

/**
 * Authentication Service for Wular Sports
 */

// Store current user
let currentUser: User | null = null;



// Listen for auth state changes (browser only)
if (typeof window !== 'undefined') {
    try {
        onAuthStateChanged(auth, (user) => {
            currentUser = user;
        });
    } catch {
        // Firebase not configured — app works without auth (order saving disabled)
    }
}

/**
 * Sign in with Google using an ID Token (from One Tap)
 */
export const signInWithGoogle = async (idToken: string): Promise<User> => {
    try {
        const credential = GoogleAuthProvider.credential(idToken);
        const result = await signInWithCredential(auth, credential);
        // Log generic success without exposing email
        console.log('✅ Firebase Google Sign-In Successful');
        return result.user;
    } catch (error: any) {
        console.error('❌ Firebase Google Sign-In Failed!');
        console.error('Error Code:', error?.code);
        console.error('Error Message:', error?.message);

        if (error?.code === 'auth/operation-not-allowed') {
            console.error('👉 ACTION REQUIRED: You must enable the "Google" sign-in provider in your Firebase Console.');
        }

        throw error;
    }
};

/**
 * Initialize Google One Tap
 * Requires VITE_GOOGLE_CLIENT_ID
 */
export const initializeGoogleOneTap = (callback: (response: any) => void) => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
        console.warn('⚠️ Google Client ID not found. One Tap disabled.');
        return;
    }

    if (typeof window !== 'undefined' && (window as any).google) {
        (window as any).google.accounts.id.initialize({
            client_id: clientId,
            callback: callback,
            auto_select: true, // Attempt to sign in automatically
            cancel_on_tap_outside: false
        });

        (window as any).google.accounts.id.prompt(); // Display the One Tap prompt
    }
};

/**
 * Ensure user is signed in with a real Google account.
 * Anonymous users are rejected — placing an order requires Google sign-in.
 */
export const ensureAuthenticated = async (): Promise<string> => {
    const user = getCurrentUser();
    if (!user || user.isAnonymous || !user.email) {
        throw new Error('Please sign in with Google to place your order.');
    }
    return user.uid;
};

/**
 * Render the official Google Sign-In button into the given element.
 * Used on checkout to require sign-in before placing an order.
 */
export const renderGoogleSignInButton = (
    element: HTMLElement,
    onCredential: (response: { credential: string }) => void
) => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
        console.warn('⚠️ Google Client ID not configured.');
        return;
    }
    if (typeof window === 'undefined' || !(window as any).google?.accounts?.id) {
        console.warn('⚠️ Google Identity Services not loaded yet.');
        return;
    }

    (window as any).google.accounts.id.initialize({
        client_id: clientId,
        callback: onCredential,
        auto_select: false,
        cancel_on_tap_outside: true
    });

    (window as any).google.accounts.id.renderButton(element, {
        theme: 'filled_blue',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        width: 280
    });
};

/**
 * Subscribe to auth state changes. Returns an unsubscribe function.
 */
export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = (): User | null => {
    return auth.currentUser || currentUser;
};

/**
 * Get current user ID
 */
export const getCurrentUserId = (): string | null => {
    const user = getCurrentUser();
    return user ? user.uid : null;
};

/**
 * Check if current user is admin
 */
export const isAdmin = async (): Promise<boolean> => {
    try {
        const user = getCurrentUser();
        if (!user) return false;
        const idTokenResult = await user.getIdTokenResult();
        return idTokenResult.claims.admin === true;
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
    return getCurrentUser() !== null;
};

/**
 * Sign out current user
 */
export const signOut = async (): Promise<void> => {
    try {
        await auth.signOut();
        currentUser = null;
    } catch (error) {
        console.error('Error signing out:', error);
        throw error;
    }
};

/**
 * Wait for auth to be ready
 */
export const waitForAuth = (): Promise<User | null> => {
    return new Promise((resolve) => {
        if (currentUser) {
            resolve(currentUser);
            return;
        }
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
            resolve(user);
        });
    });
};

/**
 * Get user's email
 */
export const getUserEmail = (): string | null => {
    const user = getCurrentUser();
    return user?.email || null;
};

/**
 * Check if user is anonymous
 */
export const isAnonymous = (): boolean => {
    const user = getCurrentUser();
    return user?.isAnonymous || false;
};
