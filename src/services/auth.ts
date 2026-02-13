import {
    signInAnonymously,
    User,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithCredential
} from 'firebase/auth';
import { auth } from './firebase';

/**
 * Authentication Service for Wular Sports
 */

// Store current user
let currentUser: User | null = null;

// Listen for auth state changes
onAuthStateChanged(auth, (user) => {
    currentUser = user;
});

/**
 * Sign in with Google using an ID Token (from One Tap)
 */
export const signInWithGoogle = async (idToken: string): Promise<User> => {
    try {
        const credential = GoogleAuthProvider.credential(idToken);
        const result = await signInWithCredential(auth, credential);
        return result.user;
    } catch (error) {
        console.error('❌ Google Sign-In failed:', error);
        throw error;
    }
};

/**
 * Initialize Google One Tap
 * Requires VITE_GOOGLE_CLIENT_ID
 */
export const initializeGoogleOneTap = (callback: (response: any) => void) => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
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
 * Ensure user is authenticated
 */
export const ensureAuthenticated = async (): Promise<string> => {
    try {
        if (currentUser) return currentUser.uid;
        const userCredential = await signInAnonymously(auth);
        currentUser = userCredential.user;
        return currentUser.uid;
    } catch (error: any) {
        console.error('❌ Authentication failed:', error);
        throw new Error('Unable to authenticate.');
    }
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
