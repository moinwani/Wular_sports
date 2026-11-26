/**
 * Google Customer Reviews opt-in (Merchant Center → Customer reviews).
 *
 * After an order, the confirmation page shows Google's small pop-up asking the
 * buyer whether Google may email them a short survey once the bat arrives.
 * Their answers become the seller rating (stars) on Google Shopping and ads.
 *
 * The checkout keeps the order id and email in sessionStorage for this one
 * page view; the confirmation page reads it once, checks it matches the order
 * in the address bar, and removes it.
 */
export const REVIEW_OPTIN_KEY = 'ws_gcr_optin';

const MERCHANT_ID = 5676681964;
const PLATFORM_SRC = 'https://apis.google.com/js/platform.js?onload=renderOptIn';
/** Dispatch within 24 hours + India Post 6–7 business days ≈ 10 calendar days */
const DELIVERY_DAYS = 10;

const isoDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Show the opt-in for this order, if the checkout left its details. */
export function showReviewOptIn(orderId: string): void {
    if (typeof window === 'undefined' || !orderId) return;
    let saved: { id?: string; email?: string } | null = null;
    try {
        saved = JSON.parse(sessionStorage.getItem(REVIEW_OPTIN_KEY) || 'null');
        sessionStorage.removeItem(REVIEW_OPTIN_KEY);
    } catch { return; }
    if (!saved || saved.id !== orderId || !saved.email) return;

    const delivery = new Date();
    delivery.setDate(delivery.getDate() + DELIVERY_DAYS);
    const w = window as any;
    w.renderOptIn = () => {
        w.gapi?.load('surveyoptin', () => {
            w.gapi.surveyoptin.render({
                merchant_id: MERCHANT_ID,
                order_id: orderId,
                email: saved!.email,
                delivery_country: 'IN',
                estimated_delivery_date: isoDate(delivery),
            });
        });
    };
    if (document.querySelector(`script[src="${PLATFORM_SRC}"]`)) { if (w.gapi) w.renderOptIn(); return; }
    const script = document.createElement('script');
    script.src = PLATFORM_SRC;
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
}
