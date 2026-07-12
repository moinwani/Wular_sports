import {
    collection, doc, addDoc, getDocs, updateDoc, deleteDoc,
    query, where, orderBy, limit, serverTimestamp
} from 'firebase/firestore';
import { getFirestoreDb } from './firebase-firestore';

export interface Review {
    id: string;
    productId: string;
    rating: number;
    text?: string;
    name?: string;
    city?: string;
    status: 'pending' | 'approved';
    createdAt?: Date;
}

const REVIEWS_COLLECTION = 'reviews';

/**
 * Submit a customer review — starts as 'pending' until the admin approves it.
 */
export const submitReview = async (input: {
    productId: string;
    rating: number;
    text?: string;
    name?: string;
    city?: string;
}): Promise<void> => {
    const { ensureAuthenticated, getCurrentUserId } = await import('./auth');
    await ensureAuthenticated();
    const uid = getCurrentUserId();
    if (!uid) throw new Error('Could not start a session. Please try again.');

    const data: Record<string, any> = {
        productId: input.productId.substring(0, 60),
        rating: Math.min(5, Math.max(1, Math.round(input.rating))),
        status: 'pending',
        userId: uid,
        createdAt: serverTimestamp(),
    };
    if (input.text) data.text = input.text.substring(0, 1000);
    if (input.name) data.name = input.name.substring(0, 60);
    if (input.city) data.city = input.city.substring(0, 60);

    await addDoc(collection(getFirestoreDb(), REVIEWS_COLLECTION), data);
};

/**
 * Approved reviews for a product (public).
 * Equality-only filters so no composite index is needed; sorted client-side.
 */
export const getApprovedReviews = async (productId: string): Promise<Review[]> => {
    const q = query(
        collection(getFirestoreDb(), REVIEWS_COLLECTION),
        where('productId', '==', productId),
        where('status', '==', 'approved'),
        limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs
        .map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() } as Review))
        .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
};

/**
 * All reviews for moderation (admin only).
 */
export const getAllReviews = async (): Promise<Review[]> => {
    const q = query(
        collection(getFirestoreDb(), REVIEWS_COLLECTION),
        orderBy('createdAt', 'desc'),
        limit(500)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() } as Review));
};

export const approveReview = async (id: string): Promise<void> => {
    await updateDoc(doc(getFirestoreDb(), REVIEWS_COLLECTION, id), { status: 'approved' });
};

export const deleteReview = async (id: string): Promise<void> => {
    await deleteDoc(doc(getFirestoreDb(), REVIEWS_COLLECTION, id));
};
