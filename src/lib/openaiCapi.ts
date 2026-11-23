import crypto from 'crypto';
import { phoneDigits } from './metaCapi';

/**
 * OpenAI Ads Conversions API — tells OpenAI (ChatGPT ads) about an order from
 * our server, alongside the browser pixel in src/services/openaiPixel.ts.
 *
 * Both sides use the id `order_<orderId>`, so OpenAI counts each order once
 * whichever arrives first. The server copy still lands when the buyer has an
 * ad blocker or never comes back from their UPI app. WhatsApp sales recorded
 * in the admin panel are sent too (action_source "other").
 *
 * Attribution rides on `oppref` — the click id ChatGPT adds to the landing
 * URL. The pixel keeps it in the `__oppref` cookie; we also keep our own copy
 * (src/utils/attributionCapture.ts) and store it on the order.
 */

const PIXEL_ID = process.env.OPENAI_PIXEL_ID || '9PvsxTZQb7RNGwGkdNNxgH';
const ENDPOINT = 'https://bzr.openai.com/v1/events';
/** OpenAI rejects events older than this */
export const OPENAI_MAX_AGE_DAYS = 7;

export const openaiConfigured = () => !!process.env.OPENAI_CAPI_KEY;

const sha = (v: string) => crypto.createHash('sha256').update(v, 'utf8').digest('hex');
const paise = (rupees: number) => Math.round((Number(rupees) || 0) * 100);
/** OpenAI's name rule: lowercase, no whitespace or ASCII punctuation, keep other letters */
const nameKey = (s?: string) => (s || '').toLowerCase().replace(/[\s!-/:-@[-`{-~]/g, '');
const one = (v?: string) => (v && v.trim() ? [v.trim().slice(0, 128)] : undefined);

export interface OpenAiResult {
    status: 'sent' | 'skipped' | 'error';
    reason?: string;
    at: string;
}

export interface OpenAiOrderOptions {
    /** Check the event with OpenAI without saving it (admin "Check connection") */
    validateOnly?: boolean;
}

/** Build the order_created event for one of our order documents. */
export function orderEventFromOrder(orderId: string, o: any, source: 'website' | 'chat', eventTime: number) {
    const a = o.attribution || {};
    const c = o.customerAddress || {};
    const digits = phoneDigits(o.customerPhone);
    const [first, ...rest] = String(o.customerName || '').trim().split(/\s+/);
    const isWeb = source === 'website';

    const user: Record<string, any> = {
        emails_sha256: o.customerEmail ? [sha(String(o.customerEmail).trim().toLowerCase())] : undefined,
        phone_numbers_sha256: digits.length >= 8 && digits.length <= 15 ? [sha(digits)] : undefined,
        // Same pseudonymous id for a customer on every order: their 10-digit phone, hashed
        external_ids_sha256: digits ? [sha(digits.slice(-10))] : undefined,
        first_names_sha256: nameKey(first) ? [sha(nameKey(first))] : undefined,
        last_names_sha256: nameKey(rest.join(' ')) ? [sha(nameKey(rest.join(' ')))] : undefined,
        cities: one(c.city),
        regions: one(c.state),
        postal_codes: c.pincode && /^[A-Za-z0-9 -]{1,32}$/.test(String(c.pincode).trim()) ? [String(c.pincode).trim()] : undefined,
        countries: !c.country || /india/i.test(c.country) ? ['IN'] : undefined,
        ip_address: isWeb && o.client?.ip ? o.client.ip : undefined,
        user_agent: isWeb && o.client?.userAgent ? o.client.userAgent : undefined,
        obref: a.obref || undefined,
    };
    Object.keys(user).forEach(k => user[k] === undefined && delete user[k]);

    const items = (o.items || []).map((i: any) => ({
        id: String(i.productId || i.id || i.productName || 'bat'),
        ...(i.productName || i.name ? { name: String(i.productName || i.name).slice(0, 200) } : {}),
        content_type: 'product',
        quantity: Math.max(1, Math.round(Number(i.quantity) || 1)),
        amount: paise(i.price),
        currency: 'INR',
    }));

    const event: Record<string, any> = {
        // Must match the browser pixel's event_id for the same order
        id: `order_${orderId}`,
        type: 'order_created',
        timestamp_ms: Math.round(eventTime),
        action_source: isWeb ? 'web' : 'other',
        data: {
            type: 'contents',
            amount: paise(o.total),
            currency: 'INR',
            ...(items.length ? { contents: items } : {}),
        },
    };
    if (isWeb) {
        const page = String(o.client?.pageUrl || '');
        event.source_url = /^https?:\/\/[^/\s]+/.test(page) ? page : 'https://wularsports.com/checkout';
    }
    if (a.oppref) event.oppref = a.oppref;
    if (Object.keys(user).length) event.user = user;
    return event;
}

/** Send events to OpenAI. One bad event fails the whole batch, so we send one at a time. */
export async function sendOpenAiEvent(event: Record<string, any>, opts: OpenAiOrderOptions = {}): Promise<OpenAiResult> {
    const at = new Date().toISOString();
    const key = process.env.OPENAI_CAPI_KEY;
    if (!key) return { status: 'skipped', reason: 'OPENAI_CAPI_KEY is not set', at };
    if (Date.now() - event.timestamp_ms > OPENAI_MAX_AGE_DAYS * 86400000) {
        return { status: 'skipped', reason: `older than ${OPENAI_MAX_AGE_DAYS} days — OpenAI only accepts recent sales`, at };
    }
    try {
        const res = await fetch(`${ENDPOINT}?pid=${encodeURIComponent(PIXEL_ID)}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                validate_only: !!opts.validateOnly,
                integration_source: 'wularsports-server',
                events: [event],
            }),
            signal: AbortSignal.timeout(15_000),
        });
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            let reason = '';
            try {
                const j = JSON.parse(text);
                reason = j?.error?.message || j?.message || j?.detail || '';
            } catch { /* not JSON */ }
            reason = reason || `HTTP ${res.status}${text ? `: ${text.slice(0, 200)}` : ''}`;
            console.error('OpenAI CAPI rejected event:', reason);
            return { status: 'error', reason: String(reason).slice(0, 300), at };
        }
        return { status: 'sent', at };
    } catch (err: any) {
        console.error('OpenAI CAPI unreachable:', err?.message);
        return { status: 'error', reason: err?.message || 'network error', at };
    }
}

export const sendOpenAiOrder = (orderId: string, o: any, source: 'website' | 'chat', eventTime: number) =>
    sendOpenAiEvent(orderEventFromOrder(orderId, o, source, eventTime));
