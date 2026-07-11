import {
    User,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithCredential,
    signInAnonymously,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendEmailVerification,
    sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from './firebase';

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
 * Ensure the user has a Firebase session before writing an order.
 * Guests get a silent anonymous session — checkout never requires an account.
 */
export const ensureAuthenticated = async (): Promise<string> => {
    try {
        const user = getCurrentUser();
        if (user) return user.uid;
        const userCredential = await signInAnonymously(auth);
        currentUser = userCredential.user;
        return currentUser.uid;
    } catch (error: any) {
        console.error('❌ Authentication failed:', error);
        throw new Error('Unable to process your order right now. Please try again.');
    }
};

/**
 * Create an account with email + password and send a verification email.
 * Verification is informational only — it never blocks checkout.
 */
export const registerWithEmail = async (email: string, password: string): Promise<User> => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    try {
        await sendEmailVerification(credential.user);
    } catch {
        // Verification email failing shouldn't fail registration
    }
    return credential.user;
};

/**
 * Sign in to an existing email/password account.
 */
export const signInWithEmail = async (email: string, password: string): Promise<User> => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
};

/**
 * Send a password reset email.
 */
export const sendPasswordReset = async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email);
};

/**
 * Render the official Google Sign-In button into the given element.
 * Optional convenience on checkout — auto-fills the customer's email.
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
