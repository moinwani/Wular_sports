/**
 * OpenAI Ads measurement pixel (ChatGPT ads).
 *
 * The loader + init live in pages/_document.tsx. This file sends the
 * conversion events, using OpenAI's standard event names:
 *   page_viewed · contents_viewed · items_added · checkout_started ·
 *   order_created · lead_created (WhatsApp taps)
 *
 * Amounts must be integers in the currency's minor unit, so rupees are sent
 * as paise (₹3,300 → 330000). Never called on /admin.
 */

type OaiqFn = (...args: unknown[]) => void;

export interface PixelItem {
    id: string;
    name: string;
    price: number;      // rupees
    quantity?: number;
}

const CURRENCY = 'INR';
const paise = (rupees: number) => Math.round((Number(rupees) || 0) * 100);

function oaiq(): OaiqFn | null {
    if (typeof window === 'undefined') return null;
    if (window.location.pathname.startsWith('/admin')) return null;
    const fn = (window as unknown as { oaiq?: OaiqFn }).oaiq;
    return typeof fn === 'function' ? fn : null;
}

function measure(event: string, data: Record<string, unknown>, options?: Record<string, unknown>) {
    const fn = oaiq();
    if (!fn) return;
    try {
        if (options) fn('measure', event, data, options);
        else fn('measure', event, data);
    } catch { /* tracking must never break the shop */ }
}

function contents(items: PixelItem[]) {
    return items.map(item => ({
        id: String(item.id),
        name: item.name,
        content_type: 'product',
        quantity: Math.max(1, Math.round(item.quantity || 1)),
        amount: paise(item.price),
        currency: CURRENCY,
    }));
}

function total(items: PixelItem[]) {
    return items.reduce((sum, i) => sum + (Number(i.price) || 0) * (i.quantity || 1), 0);
}

export function oaiPageViewed(path: string) {
    measure('page_viewed', {
        type: 'contents',
        contents: [{ id: path, name: typeof document !== 'undefined' ? document.title : path, content_type: 'page' }],
    });
}

export function oaiProductViewed(item: PixelItem) {
    measure('contents_viewed', { type: 'contents', amount: paise(item.price), currency: CURRENCY, contents: contents([item]) });
}

export function oaiItemsAdded(items: PixelItem[]) {
    measure('items_added', { type: 'contents', amount: paise(total(items)), currency: CURRENCY, contents: contents(items) });
}

export function oaiCheckoutStarted(items: PixelItem[], value?: number) {
    measure('checkout_started', {
        type: 'contents', amount: paise(value ?? total(items)), currency: CURRENCY, contents: contents(items),
    });
}

/** value = what the order is worth after discount (full order value, also for COD). */
export function oaiOrderCreated(orderId: string, items: PixelItem[], value: number) {
    measure('order_created', {
        type: 'contents', amount: paise(value), currency: CURRENCY, contents: contents(items),
    }, { event_id: `order_${orderId}` });
}

/** A WhatsApp tap is how most Wular sales start, so it counts as a lead. */
export function oaiLeadCreated() {
    measure('lead_created', { type: 'customer_action' });
}
