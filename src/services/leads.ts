import { doc, setDoc, serverTimestamp, increment } from 'firebase/firestore';
import { getFirestoreDb } from './firebase-firestore';
import { CartItem } from '../types';
import { getVisitorRef } from '../utils/helpers';

/**
 * Checkout lead capture.
 *
 * As soon as a visitor enters a reachable contact detail (phone or email) on
 * the checkout form, we save whatever they've typed so far — even if they
 * never click Place Order. Keyed by the visitor's Firebase uid, so repeated
 * edits update the same lead instead of creating duplicates.
 *
 * All failures are swallowed: lead capture must never interfere with checkout.
 */

const LEADS_COLLECTION = 'leads';

const LEAD_FIELDS = [
    'firstName', 'lastName', 'email', 'phone', 'countryCode',
    'address', 'city', 'state', 'zip', 'country',
] as const;

export const saveCheckoutLead = async (
    form: Record<string, string>,
    cart: CartItem[],
    total: number
): Promise<void> => {
    try {
        const { ensureAuthenticated, getCurrentUserId } = await import('./auth');
        await ensureAuthenticated();
        const uid = getCurrentUserId();
        if (!uid) return;

        const data: Record<string, any> = {
            status: 'browsing',
            cartTotal: total,
            cartSummary: cart
                .map(i => `${i.name}${i.size ? ` (${i.size})` : ''} x${i.quantity}`)
                .join(', ')
                .substring(0, 500),
            visitorRef: getVisitorRef(),
            updatedAt: serverTimestamp(),
        };

        for (const field of LEAD_FIELDS) {
            const value = form[field];
            if (value) data[field] = String(value).substring(0, 500);
        }

        await setDoc(doc(getFirestoreDb(), LEADS_COLLECTION, uid), data, { merge: true });
    } catch {
        // Lead capture is best-effort only
    }
};

/**
 * Track a WhatsApp button click anywhere on the site. Records which button
 * was clicked (and which product, if any) on the visitor's lead — including
 * their Ref code, which is also embedded in the pre-filled WhatsApp message.
 * When the chat converts into a sale, the admin finds the lead by Ref and
 * marks it sold.
 */
export const trackWhatsAppClick = async (
    source: string,
    detail?: string,
    extra?: Record<string, any>
): Promise<void> => {
    try {
        if (typeof window !== 'undefined' && (window as any).dataLayer) {
            (window as any).dataLayer.push({
                event: 'whatsapp_click',
                source,
                detail: detail || '',
                ...(extra || {}),
            });
        }

        const { ensureAuthenticated, getCurrentUserId } = await import('./auth');
        await ensureAuthenticated();
        const uid = getCurrentUserId();
        if (!uid) return;

        const data: Record<string, any> = {
            whatsappClicks: increment(1),
            lastWhatsAppSource: source.substring(0, 100),
            visitorRef: getVisitorRef(),
            updatedAt: serverTimestamp(),
        };
        if (detail) data.whatsappProduct = String(detail).substring(0, 200);

        await setDoc(doc(getFirestoreDb(), LEADS_COLLECTION, uid), data, { merge: true });
    } catch {
        // Best-effort only
    }
};

/**
 * Mark the visitor's lead as converted once their order is placed,
 * so the admin Leads tab only surfaces people who still need follow-up.
 */
export const markLeadConverted = async (): Promise<void> => {
    try {
        const { getCurrentUserId } = await import('./auth');
        const uid = getCurrentUserId();
        if (!uid) return;
        await setDoc(
            doc(getFirestoreDb(), LEADS_COLLECTION, uid),
            { status: 'converted', updatedAt: serverTimestamp() },
            { merge: true }
        );
    } catch {
        // Best-effort only
    }
};
