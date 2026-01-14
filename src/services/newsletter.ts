import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

const SUBSCRIBERS_COLLECTION = 'subscribers';

/**
 * Subscribe a new email to the newsletter
 */
export const subscribeToNewsletter = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
        // Sanitize: lowercase and trim (required by Firestore rules)
        const sanitizedEmail = email.toLowerCase().trim();

        // 1. Check if already subscribed
        const q = query(collection(db, SUBSCRIBERS_COLLECTION), where('email', '==', sanitizedEmail));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            return { success: false, message: 'You are already subscribed!' };
        }

        // 2. Add new subscriber
        await addDoc(collection(db, SUBSCRIBERS_COLLECTION), {
            email: sanitizedEmail,
            subscribedAt: Timestamp.fromDate(new Date()),
            status: 'active'
        });

        return { success: true, message: 'Successfully subscribed to Wular Insights!' };
    } catch (error) {
        console.error('Newsletter subscription failed:', error);

        // Better error handling for permission errors
        if (error && typeof error === 'object' && 'code' in error) {
            if ((error as any).code === 'permission-denied') {
                return { success: false, message: 'Unable to subscribe. Please try again later.' };
            }
        }

        return { success: false, message: 'Subscription failed. Please try again later.' };
    }
};
