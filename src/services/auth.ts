import {
    getAuth,
    signInAnonymously,
    User,
    onAuthStateChanged
} from 'firebase/auth';
import { auth } from './firebase';

/**
 * Authentication Service for Wular Sports
 * 
 * Provides secure authentication for checkout and order management
 * Uses Firebase Anonymous Authentication for guest checkout
 */

// Store current user
let currentUser: User | null = null;

// Listen for auth state changes
onAuthStateChanged(auth, (user) => {
    currentUser = user;
});

/**
 * Ensure user is authenticated (create anonymous user if needed)
 * Call this before creating orders
 */
export const ensureAuthenticated = async (): Promise<string> => {
    try {
        // Check if already authenticated
        if (currentUser) {
            return currentUser.uid;
        }

        // Create anonymous user for guest checkout
        const userCredential = await signInAnonymously(auth);
        currentUser = userCredential.user;

        console.log('✅ Anonymous user created:', currentUser.uid);
        return currentUser.uid;

    } catch (error: any) {
        console.error('❌ Authentication failed:', error);
        throw new Error('Unable to authenticate. Please try again.');
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
 * Admin status is set via custom claims (see scripts/admin-setup.js)
 */
export const isAdmin = async (): Promise<boolean> => {
    try {
        const user = getCurrentUser();
        if (!user) return false;

        // Get ID token result with custom claims
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
 * Sign out current user (optional, mostly for testing)
 */
export const signOut = async (): Promise<void> => {
    try {
        await auth.signOut();
        currentUser = null;
        console.log('✅ Signed out');
    } catch (error) {
        console.error('Error signing out:', error);
        throw error;
    }
};

/**
 * Wait for auth to be ready
 * Useful in components that need to check auth on mount
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
 * Get user's email (if available)
 * Anonymous users don't have email
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
