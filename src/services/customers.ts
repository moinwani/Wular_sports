/**
 * Unified customer view — merges orders, checkout leads and newsletter
 * subscribers into one profile per person (matched by phone, then email).
 * Pure functions: computed in the admin panel from data it already loads.
 */

export const PAID_STATUSES = ['confirmed', 'processing', 'shipped', 'delivered'];
export const isPaid = (o: any) => PAID_STATUSES.includes(o?.status);

export type Segment = 'Wholesale' | 'VIP' | 'Repeat' | 'New buyer' | 'Lead' | 'Subscriber';

export const SEGMENTS: Segment[] = ['Wholesale', 'VIP', 'Repeat', 'New buyer', 'Lead', 'Subscriber'];

/** A buyer whose last paid order is older than this is flagged "at risk". */
export const AT_RISK_DAYS = 120;

export interface CustomerProfileData {
    tags?: string[];
    notes?: string;
    lastContactedAt?: string;           // ISO
    contacts?: { at: string; template: string }[];
}

export interface Customer {
    key: string;
    name: string;
    phone: string;          // with country code, e.g. +919876543210
    email: string;
    city: string;
    state: string;
    country: string;
    orders: any[];          // every order, newest first
    paidOrders: number;
    totalSpent: number;
    avgOrder: number;
    batsBought: number;
    firstOrderAt: Date | null;
    lastOrderAt: Date | null;
    daysSinceLastOrder: number | null;
    unfinishedCheckouts: number;
    products: string[];
    lead: any | null;       // most recent checkout lead
    subscribed: boolean;
    sources: string[];      // 'website', 'whatsapp'
    segment: Segment;
    atRisk: boolean;
    profile: CustomerProfileData;
}

export const toDate = (v: any): Date | null => {
    if (!v) return null;
    if (v instanceof Date) return v;
    if (typeof v.toDate === 'function') return v.toDate();
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
};

const digits = (s: any) => String(s || '').replace(/\D/g, '');
const phoneKey = (phone: any) => { const d = digits(phone); return d.length >= 7 ? d.slice(-10) : ''; };
const emailKey = (email: any) => String(email || '').trim().toLowerCase();
const DAY = 86400000;

/** Customer key used for the admin "customerProfiles" store (tags/notes). */
export const keyFor = (phone: any, email: any): string => phoneKey(phone) || emailKey(email);

const blank = (key: string): Customer => ({
    key, name: '', phone: '', email: '', city: '', state: '', country: '',
    orders: [], paidOrders: 0, totalSpent: 0, avgOrder: 0, batsBought: 0,
    firstOrderAt: null, lastOrderAt: null, daysSinceLastOrder: null,
    unfinishedCheckouts: 0, products: [], lead: null, subscribed: false,
    sources: [], segment: 'Subscriber', atRisk: false, profile: {},
});

export function buildCustomers(
    orders: any[],
    leads: any[],
    subscribers: any[],
    profiles: Record<string, CustomerProfileData> = {},
    now: number = Date.now()
): Customer[] {
    const byKey = new Map<string, Customer>();
    const emailToKey = new Map<string, string>();

    const get = (key: string) => {
        let c = byKey.get(key);
        if (!c) { c = blank(key); byKey.set(key, c); }
        return c;
    };
    const resolve = (phone: any, email: any): string => {
        const pk = phoneKey(phone);
        const ek = emailKey(email);
        if (pk) { if (ek && !emailToKey.has(ek)) emailToKey.set(ek, pk); return pk; }
        return (ek && emailToKey.get(ek)) || ek;
    };

    // Orders first: they carry the most reliable identity + address
    for (const o of orders) {
        const key = resolve(o.customerPhone, o.customerEmail);
        if (!key) continue;
        const c = get(key);
        c.orders.push(o);
        c.name = c.name || o.customerName || '';
        c.phone = c.phone || o.customerPhone || '';
        c.email = c.email || o.customerEmail || '';
        const a = o.customerAddress || {};
        if (!c.city && a.city) { c.city = a.city; c.state = a.state || ''; c.country = a.country || 'India'; }
        const src = o.source === 'whatsapp_pre_website' || o.channel === 'whatsapp' ? 'whatsapp' : 'website';
        if (!c.sources.includes(src)) c.sources.push(src);
    }

    for (const l of leads) {
        const phone = l.phone ? `${l.countryCode || '+91'}${l.phone}` : '';
        const key = resolve(phone, l.email);
        if (!key) continue;
        const c = get(key);
        const prev = c.lead ? toDate(c.lead.updatedAt) : null;
        const cur = toDate(l.updatedAt);
        if (!c.lead || (cur && prev && cur > prev)) c.lead = l;
        c.name = c.name || [l.firstName, l.lastName].filter(Boolean).join(' ');
        c.phone = c.phone || phone;
        c.email = c.email || l.email || '';
        if (!c.city && l.city) { c.city = l.city; c.state = l.state || ''; c.country = l.country || 'India'; }
    }

    for (const s of subscribers) {
        const key = resolve('', s.email);
        if (!key) continue;
        const c = get(key);
        c.subscribed = c.subscribed || s.status !== 'unsubscribed';
        c.email = c.email || s.email || '';
    }

    for (const c of byKey.values()) {
        c.orders.sort((a, b) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0));
        const paid = c.orders.filter(isPaid);
        c.paidOrders = paid.length;
        c.totalSpent = paid.reduce((s, o) => s + (o.total || 0), 0);
        c.avgOrder = paid.length ? Math.round(c.totalSpent / paid.length) : 0;
        c.batsBought = paid.reduce((s, o) => s + (o.items || []).reduce((q: number, it: any) => q + (it.quantity || 1), 0), 0);
        c.unfinishedCheckouts = c.orders.filter(o => o.status === 'pending').length;
        const dates = paid.map(o => toDate(o.createdAt)).filter(Boolean) as Date[];
        c.firstOrderAt = dates.length ? new Date(Math.min(...dates.map(d => d.getTime()))) : null;
        c.lastOrderAt = dates.length ? new Date(Math.max(...dates.map(d => d.getTime()))) : null;
        c.daysSinceLastOrder = c.lastOrderAt ? Math.floor((now - c.lastOrderAt.getTime()) / DAY) : null;
        c.products = [...new Set(paid.flatMap(o => (o.items || []).map((it: any) => it.productName || it.name)).filter(Boolean))];
        c.name = c.name || (c.email ? c.email.split('@')[0] : 'Unknown');
        c.profile = profiles[c.key] || {};

        const maxBatsInOrder = Math.max(0, ...paid.map(o => (o.items || []).reduce((q: number, it: any) => q + (it.quantity || 1), 0)));
        c.segment =
            c.totalSpent >= 100000 || maxBatsInOrder >= 10 ? 'Wholesale'
            : c.paidOrders >= 3 || c.totalSpent >= 15000 ? 'VIP'
            : c.paidOrders >= 2 ? 'Repeat'
            : c.paidOrders === 1 ? 'New buyer'
            : c.lead || c.unfinishedCheckouts > 0 ? 'Lead'
            : 'Subscriber';
        c.atRisk = c.paidOrders > 0 && (c.daysSinceLastOrder ?? 0) > AT_RISK_DAYS;
    }

    return [...byKey.values()].sort((a, b) => b.totalSpent - a.totalSpent || (toDate(b.lead?.updatedAt)?.getTime() || 0) - (toDate(a.lead?.updatedAt)?.getTime() || 0));
}

export const firstName = (name: string) => (name || '').trim().split(/\s+/)[0] || 'there';

/** wa.me link for a customer phone + message, or null if no usable number. */
export const whatsappLink = (phone: string, message: string): string | null => {
    const d = digits(phone);
    if (d.length < 10) return null;
    const full = d.length === 10 ? `91${d}` : d;
    return `https://wa.me/${full}?text=${encodeURIComponent(message)}`;
};

const csvCell = (v: any) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const download = (filename: string, rows: (string | number)[][]) => {
    const csv = rows.map(r => r.map(csvCell).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
};

const isoDay = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : '');

/** Human-readable customer export (for WhatsApp Business broadcast lists, records). */
export const exportCustomersCSV = (customers: Customer[]) => download(
    `wular-customers-${isoDay(new Date())}.csv`,
    [
        ['Name', 'Phone', 'Email', 'City', 'State', 'Segment', 'At risk', 'Paid orders', 'Total spent', 'Last order', 'Tags', 'Notes'],
        ...customers.map(c => [
            c.name, c.phone, c.email, c.city, c.state, c.segment, c.atRisk ? 'yes' : '',
            c.paidOrders, c.totalSpent, isoDay(c.lastOrderAt), (c.profile.tags || []).join('; '), c.profile.notes || '',
        ]),
    ]
);

/**
 * Meta Ads "customer list" format — upload in Ads Manager → Audiences →
 * Custom audience → Customer list, then build a Lookalike audience from it.
 * `value` = lifetime spend, which enables value-based lookalikes.
 */
export const exportMetaAudienceCSV = (customers: Customer[]) => download(
    `wular-meta-audience-${isoDay(new Date())}.csv`,
    [
        ['phone', 'email', 'fn', 'ln', 'ct', 'st', 'country', 'value'],
        ...customers.filter(c => c.phone || c.email).map(c => {
            const [fn, ...rest] = (c.name || '').trim().split(/\s+/);
            const d = digits(c.phone);
            return [
                d ? (d.length === 10 ? `91${d}` : d) : '', c.email, fn || '', rest.join(' '),
                c.city, c.state, c.country === 'India' || !c.country ? 'IN' : c.country, c.totalSpent,
            ];
        }),
    ]
);
