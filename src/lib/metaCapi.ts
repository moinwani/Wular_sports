import crypto from 'crypto';

/**
 * Meta Conversions API — tells Meta about a purchase from our server.
 *
 * Website sales are sent once payment is confirmed (so a buyer who never
 * returns from their UPI app still counts). WhatsApp sales recorded in the
 * admin panel are sent too, matched to the person's Instagram/Facebook
 * account by their hashed phone number — that is how Meta learns which ads
 * produce buyers even when the sale happens in a chat.
 */

const PIXEL_ID = process.env.META_PIXEL_ID || '988733203744597';
const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v23.0';
/** Meta rejects events older than this */
export const META_MAX_AGE_DAYS = 7;

export const metaConfigured = () => !!process.env.META_CAPI_ACCESS_TOKEN;

const sha = (v: string) => crypto.createHash('sha256').update(v.trim().toLowerCase()).digest('hex');
const hashIf = (v?: string) => (v && v.trim() ? sha(v) : undefined);

/** Phone in E.164 digits without '+', defaulting 10-digit numbers to India */
export const phoneDigits = (p?: string) => {
    const d = String(p || '').replace(/\D/g, '');
    if (d.length === 10) return `91${d}`;
    return d;
};

export interface PurchaseInput {
    eventId: string;
    eventTime: number;                  // ms
    actionSource: 'website' | 'chat' | 'system_generated';
    value: number;
    orderId: string;
    items: { id: string; name?: string; price?: number; quantity?: number }[];
    phone?: string;
    email?: string;
    name?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    fbp?: string;
    fbc?: string;
    ip?: string;
    userAgent?: string;
    pageUrl?: string;
    testCode?: string;
}

export interface MetaResult {
    status: 'sent' | 'skipped' | 'error';
    reason?: string;
    at: string;
}

export async function sendPurchase(e: PurchaseInput): Promise<MetaResult> {
    const at = new Date().toISOString();
    const token = process.env.META_CAPI_ACCESS_TOKEN;
    if (!token) return { status: 'skipped', reason: 'META_CAPI_ACCESS_TOKEN is not set', at };
    if (Date.now() - e.eventTime > META_MAX_AGE_DAYS * 86400000) {
        return { status: 'skipped', reason: `older than ${META_MAX_AGE_DAYS} days — Meta only accepts recent sales`, at };
    }

    const [first, ...rest] = String(e.name || '').trim().split(/\s+/);
    const digits = phoneDigits(e.phone);
    const user: Record<string, any> = {
        ph: digits ? [sha(digits)] : undefined,
        em: e.email ? [sha(e.email)] : undefined,
        fn: hashIf(first),
        ln: hashIf(rest.join(' ')),
        ct: hashIf(e.city?.replace(/\s+/g, '')),
        st: hashIf(e.state?.replace(/\s+/g, '')),
        zp: hashIf(e.zip?.replace(/\s+/g, '')),
        // Meta wants ISO country codes; we only know India's for sure
        country: !e.country || /india/i.test(e.country) ? sha('in') : undefined,
        external_id: digits ? [sha(digits.slice(-10))] : undefined,
        fbp: e.fbp,
        fbc: e.fbc,
        client_ip_address: e.ip,
        client_user_agent: e.userAgent,
    };
    Object.keys(user).forEach(k => user[k] === undefined && delete user[k]);

    const event: Record<string, any> = {
        event_name: 'Purchase',
        event_time: Math.floor(e.eventTime / 1000),
        event_id: e.eventId,
        action_source: e.actionSource,
        user_data: user,
        custom_data: {
            currency: 'INR',
            value: Math.round(e.value),
            order_id: e.orderId,
            content_type: 'product',
            content_ids: e.items.map(i => i.id),
            contents: e.items.map(i => ({ id: i.id, quantity: i.quantity || 1, item_price: i.price || 0 })),
            num_items: e.items.reduce((s, i) => s + (i.quantity || 1), 0),
        },
    };
    if (e.actionSource === 'website') event.event_source_url = e.pageUrl || 'https://wularsports.com/checkout';

    const testCode = e.testCode || process.env.META_CAPI_TEST_CODE;
    try {
        const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${PIXEL_ID}/events?access_token=${encodeURIComponent(token)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: [event], ...(testCode ? { test_event_code: testCode } : {}) }),
        });
        const json: any = await res.json().catch(() => ({}));
        if (!res.ok || json.error) {
            const reason = json?.error?.error_user_msg || json?.error?.message || `HTTP ${res.status}`;
            console.error('Meta CAPI rejected purchase:', reason);
            return { status: 'error', reason: String(reason).slice(0, 300), at };
        }
        return { status: 'sent', at };
    } catch (err: any) {
        console.error('Meta CAPI unreachable:', err?.message);
        return { status: 'error', reason: err?.message || 'network error', at };
    }
}

/** Build the Meta purchase for one of our order documents. */
export function purchaseFromOrder(orderId: string, o: any, source: 'website' | 'chat', eventTime: number): PurchaseInput {
    const a = o.attribution || {};
    // Meta requires the browser's user agent on website events; orders placed
    // before we stored it go as server-generated instead
    const actionSource = source === 'website' && !o.client?.userAgent ? 'system_generated' : source;
    return {
        eventId: `purchase_${orderId}`,
        eventTime,
        actionSource,
        value: o.total || 0,
        orderId,
        items: (o.items || []).map((i: any) => ({ id: i.productId || i.id || i.productName, name: i.productName, price: i.price, quantity: i.quantity })),
        phone: o.customerPhone,
        email: o.customerEmail,
        name: o.customerName,
        city: o.customerAddress?.city,
        state: o.customerAddress?.state,
        zip: o.customerAddress?.pincode,
        country: o.customerAddress?.country,
        fbp: a.fbp,
        fbc: a.fbc,
        ip: actionSource === 'website' ? o.client?.ip : undefined,
        userAgent: actionSource === 'website' ? o.client?.userAgent : undefined,
        pageUrl: o.client?.pageUrl,
    };
}
