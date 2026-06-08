import {
    doc,
    setDoc,
    Timestamp
} from 'firebase/firestore';
import { getFirestoreDb } from './firebase-firestore';

const SUBSCRIBERS_COLLECTION = 'subscribers';

/**
 * Subscribe a new email to the newsletter
 */
export const subscribeToNewsletter = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
        // Sanitize: lowercase and trim (required by Firestore rules)
        const sanitizedEmail = email.toLowerCase().trim();

        if (!sanitizedEmail || !sanitizedEmail.includes('@')) {
            return { success: false, message: 'Please enter a valid email address.' };
        }

        // 1. Add/Update subscriber
        // Note: Using email as ID ensures uniqueness. 
        // Firestore Rules 'allow create' only allows this if it doesn't exist.
        // If it exists, it's an 'update' which is blocked for public.
        await setDoc(doc(getFirestoreDb(), SUBSCRIBERS_COLLECTION, sanitizedEmail), {
            email: sanitizedEmail,
            subscribedAt: Timestamp.fromDate(new Date()),
            status: 'active'
        });

        return { success: true, message: 'Successfully subscribed to Wular Insights!' };
    } catch (error) {
        console.error('Newsletter subscription failed:', error);

        // Better error handling for permission errors
        if (error && typeof error === 'object' && 'code' in error) {
            // Already exists (handled by rules blocking update)
            if ((error as any).code === 'permission-denied') {
                return { success: false, message: 'This email is already subscribed or invalid.' };
            }
        }

        return { success: false, message: 'Subscription failed. Please try again later.' };
    }
};
