/**
 * Marketing attribution — shared by the browser (capturing where a visitor
 * came from), the API routes (storing it safely) and the admin panel
 * (crediting each sale to a source and campaign). Pure code, no imports,
 * so it is safe to use on both the client and the server.
 */

/* ───────────── Sources: where a customer came from ───────────── */

export type SourceId =
    | 'meta_ads' | 'google_ads' | 'influencer'
    | 'instagram' | 'facebook' | 'meta_untagged' | 'youtube' | 'search'
    | 'referral' | 'repeat' | 'direct' | 'other' | 'unknown' | 'legacy';

export interface SourceDef {
    id: SourceId;
    label: string;
    /** Money was spent to get this sale (counts towards ROAS / cost per customer) */
    paid: boolean;
    /** Offered in the "Where did they come from?" picker */
    pickable: boolean;
}

export const SOURCES: SourceDef[] = [
    { id: 'meta_ads', label: 'Meta ad (Instagram / Facebook)', paid: true, pickable: true },
    { id: 'google_ads', label: 'Google ad', paid: true, pickable: true },
    { id: 'influencer', label: 'Influencer / paid collab', paid: true, pickable: true },
    { id: 'instagram', label: 'Instagram post or profile (free)', paid: false, pickable: true },
    { id: 'facebook', label: 'Facebook post or page (free)', paid: false, pickable: true },
    { id: 'meta_untagged', label: 'Instagram/Facebook link (untagged)', paid: false, pickable: false },
    { id: 'youtube', label: 'YouTube', paid: false, pickable: true },
    { id: 'search', label: 'Google search', paid: false, pickable: true },
    { id: 'referral', label: 'Friend / word of mouth', paid: false, pickable: true },
    { id: 'repeat', label: 'Repeat customer', paid: false, pickable: true },
    { id: 'direct', label: 'Website, no source', paid: false, pickable: false },
    { id: 'other', label: 'Other', paid: false, pickable: true },
    { id: 'unknown', label: 'Not recorded', paid: false, pickable: false },
    { id: 'legacy', label: 'Before the website', paid: false, pickable: false },
];

export const SOURCE_IDS = SOURCES.map(s => s.id);
export const sourceDef = (id: string): SourceDef => SOURCES.find(s => s.id === id) || SOURCES.find(s => s.id === 'other')!;
export const isPaidSource = (id: string) => sourceDef(id).paid;

export type Platform = 'meta' | 'google' | 'influencer' | 'other';

export const PLATFORMS: { id: Platform; label: string; source: SourceId }[] = [
    { id: 'meta', label: 'Meta (Instagram / Facebook)', source: 'meta_ads' },
    { id: 'google', label: 'Google', source: 'google_ads' },
    { id: 'influencer', label: 'Influencer', source: 'influencer' },
    { id: 'other', label: 'Other', source: 'other' },
];

export const platformSource = (p?: string): SourceId => PLATFORMS.find(x => x.id === p)?.source || 'other';

/* ───────────── Touches: one visit that arrived from somewhere ───────────── */

export interface Touch {
    source?: string;     // utm_source
    medium?: string;     // utm_medium
    campaign?: string;   // utm_campaign
    content?: string;    // utm_content (ad name)
    term?: string;       // utm_term (ad set name)
    fbclid?: string;
    gclid?: string;
    referrer?: string;
    landing?: string;    // first page of the visit
    at?: string;         // ISO time of the visit
}

export interface Attribution {
    /** First visit that came from somewhere (kept 90 days) */
    first?: Touch;
    /** Most recent visit that came from somewhere */
    last?: Touch;
    /** Meta browser ids — let Meta match the purchase to the ad click */
    fbp?: string;
    fbc?: string;
    /** Visitor Ref code, the same one put in WhatsApp messages from the site */
    ref?: string;
    /** Set by the owner in the admin panel; always wins */
    manual?: { source: SourceId; campaignId?: string; adCode?: string; at?: string };
}

const lower = (v?: string) => (v || '').toLowerCase();

/** Classify an external referrer URL; null for our own site or no referrer. */
export const classifyReferrer = (ref?: string): SourceId | null => {
    if (!ref) return null;
    let host = '';
    try { host = new URL(ref).hostname.toLowerCase(); } catch { return null; }
    if (!host || host === 'localhost' || host.endsWith('wularsports.com') || host.endsWith('vercel.app')) return null;
    if (/(^|\.)instagram\.com$/.test(host)) return 'instagram';
    if (/(^|\.)(facebook|messenger)\.com$/.test(host) || host === 'fb.me' || host === 'fb.com') return 'facebook';
    if (/(^|\.)youtube\.com$/.test(host) || host === 'youtu.be') return 'youtube';
    if (/(^|\.)google\.[a-z.]+$/.test(host) || /(^|\.)(bing|duckduckgo|yahoo)\.com$/.test(host)) return 'search';
    return 'other';
};

/** Which source a visit came from; null when it carries no information. */
export const classifyTouch = (t?: Touch | null): SourceId | null => {
    if (!t) return null;
    const s = lower(t.source);
    const m = lower(t.medium);
    const paid = /paid|cpc|ppc|cpm|^ads?$|_ads?$|sponsored/.test(m);
    if (s) {
        if (s === 'meta' || /facebook|instagram|^fb$|^ig$|^an$|messenger/.test(s)) {
            if (paid || s === 'meta') return 'meta_ads';
            return /insta|^ig$/.test(s) ? 'instagram' : 'facebook';
        }
        if (/google|adwords/.test(s)) return paid || t.gclid ? 'google_ads' : 'search';
        if (/youtube|^yt$/.test(s)) return paid ? 'google_ads' : 'youtube';
        if (/influenc|creator|collab/.test(s) || /influenc/.test(m)) return 'influencer';
        return 'other';
    }
    if (t.gclid) return 'google_ads';
    // Meta adds fbclid to both ad clicks and post links — without UTM tags
    // we can't tell which, so it stays its own honest bucket.
    if (t.fbclid) return 'meta_untagged';
    return classifyReferrer(t.referrer);
};

/* ───────────── Sanitising (API routes store only these shapes) ───────────── */

const TOUCH_KEYS: (keyof Touch)[] = ['source', 'medium', 'campaign', 'content', 'term', 'fbclid', 'gclid', 'referrer', 'landing', 'at'];
const clip = (v: unknown, n: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, n) : undefined);

export const sanitizeTouch = (t: any): Touch | undefined => {
    if (!t || typeof t !== 'object') return undefined;
    const out: Touch = {};
    for (const k of TOUCH_KEYS) {
        const v = clip(t[k], k === 'referrer' || k === 'landing' ? 300 : 200);
        if (v) out[k] = v;
    }
    return Object.keys(out).length ? out : undefined;
};

export const sanitizeAttribution = (a: any): Attribution | undefined => {
    if (!a || typeof a !== 'object') return undefined;
    const out: Attribution = {};
    const first = sanitizeTouch(a.first);
    const last = sanitizeTouch(a.last);
    if (first) out.first = first;
    if (last) out.last = last;
    const fbp = clip(a.fbp, 120);
    const fbc = clip(a.fbc, 300);
    const ref = clip(a.ref, 12);
    if (fbp && /^fb\.\d\.\d+\.\d+$/.test(fbp)) out.fbp = fbp;
    if (fbc && /^fb\.\d\.\d+\.\S+$/.test(fbc)) out.fbc = fbc;
    if (ref && /^WS-[A-Z0-9]{6}$/.test(ref)) out.ref = ref;
    return Object.keys(out).length ? out : undefined;
};

/* ───────────── Campaigns, ad spend and coupons (admin-managed) ───────────── */

export interface Campaign {
    id: string;
    name: string;
    platform: Platform;
    /** Short code customers send in their first WhatsApp message, e.g. "L2" */
    code?: string;
    /** Matches utm_campaign on website visits; defaults to the name */
    utmCampaign?: string;
    /** A coupon code that belongs to this campaign (e.g. an influencer code) */
    couponCode?: string;
    status: 'active' | 'paused' | 'ended';
    createdAt?: string;
}

export interface SpendEntry {
    id: string;
    campaignId: string;
    from: string;        // YYYY-MM-DD, inclusive
    to: string;          // YYYY-MM-DD, inclusive
    amount: number;      // ₹
    /** Ads Manager "Results", e.g. messaging conversations started */
    results?: number;
    via?: 'manual' | 'csv';
    createdAt?: string;
}

export type CouponType = 'per_bat' | 'percent';

export interface CouponDef {
    code: string;
    type: CouponType;
    value: number;
    active: boolean;
    expiresAt?: string;   // YYYY-MM-DD, last valid day
    note?: string;
    builtIn?: boolean;
    createdAt?: string;
}

export const normalizeCode = (s: unknown) =>
    String(s || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 24);

export const couponLabel = (c: Pick<CouponDef, 'type' | 'value'>) =>
    c.type === 'percent' ? `${c.value}% off` : `₹${c.value} off per bat`;

/** The discount a coupon gives on a cart — the server recomputes this, never trusts the browser. */
export const couponDiscount = (c: Pick<CouponDef, 'type' | 'value'>, subtotal: number, bats: number) =>
    c.type === 'percent'
        ? Math.round((subtotal * Math.min(Math.max(c.value, 0), 90)) / 100)
        : Math.max(c.value, 0) * bats;

/** Is this coupon usable today? (expiresAt is the last valid day, India time) */
export const couponLive = (c: Pick<CouponDef, 'active' | 'expiresAt'>, now = Date.now()) => {
    if (!c.active) return false;
    if (!c.expiresAt) return true;
    const end = Date.parse(`${c.expiresAt}T23:59:59+05:30`);
    return isNaN(end) || now <= end;
};

/* ───────────── Setup helpers shown in the admin panel ───────────── */

/** Paste into Meta Ads Manager → Ad → Tracking → URL parameters */
export const META_URL_PARAMS =
    'utm_source=meta&utm_medium=paid&utm_campaign={{campaign.name}}&utm_term={{adset.name}}&utm_content={{ad.name}}';

/** Pre-filled first message for a click-to-WhatsApp ad, carrying the campaign code */
export const whatsappAdMessage = (code: string) =>
    `Hi Wular Sports! I saw your ad and want to know more about your bats. (Code: ${code})`;
