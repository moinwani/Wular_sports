/**
 * Client-side analytics — the same metric families as the offline SQL pack
 * (analytics/sql/*.sql), computed live in the browser from the Firestore
 * collections the admin panel already has access to. Real data, no export.
 *
 * The GA4 *visitor* funnel (page_view → view_item → …) lives in GA4/BigQuery,
 * not Firestore, so here we show the Firestore-derivable *checkout* funnel
 * (leads → orders started → paid) instead.
 */

import { isPaid, toDate, Customer, SEGMENTS, Segment } from './customers';
import { products } from '../data/products';

const DAY = 86400000;
/** Short catalog names ("Legacy Edition 2.0"), so website and WhatsApp sales of a bat group together */
const CATALOG_NAME = new Map(products.map(p => [p.id, p.name.split(' — ')[0].trim()]));

/* ───────────── Date ranges (scope every number on the Analytics tab) ───────────── */

export type RangeId = '30d' | '90d' | '12m' | 'all';

export const RANGES: { id: RangeId; label: string; days: number | null }[] = [
    { id: '30d', label: 'Last 30 days', days: 30 },
    { id: '90d', label: 'Last 90 days', days: 90 },
    { id: '12m', label: 'Last 12 months', days: 365 },
    { id: 'all', label: 'All time', days: null },
];

export interface RangeWindow { start: number; end: number; prevStart: number | null; days: number | null; }

export const rangeWindow = (id: RangeId, now: number): RangeWindow => {
    const days = RANGES.find(r => r.id === id)!.days;
    if (days == null) return { start: 0, end: now + 1, prevStart: null, days: null };
    const start = now - days * DAY;
    return { start, end: now + 1, prevStart: start - days * DAY, days };
};

const timeOf = (o: any) => toDate(o.createdAt)?.getTime() || 0;
export const inWindow = (list: any[], start: number, end: number, at: (x: any) => number = timeOf) =>
    list.filter(x => { const t = at(x); return t >= start && t < end; });

export interface RangeKpis {
    revenue: number; orders: number; aov: number; customers: number; bats: number;
}

export const computeRangeKpis = (orders: any[]): RangeKpis => {
    const paid = orders.filter(isPaid);
    const revenue = paid.reduce((s, o) => s + (o.total || 0), 0);
    const keys = new Set(paid.map(o => String(o.customerPhone || o.customerEmail || o.userId)));
    return {
        revenue,
        orders: paid.length,
        aov: paid.length ? revenue / paid.length : 0,
        customers: keys.size,
        bats: paid.reduce((s, o) => s + (o.items || []).reduce((q: number, it: any) => q + (it.quantity || 1), 0), 0),
    };
};

export interface SeriesPoint { label: string; tooltipLabel: string; revenue: number; orders: number; }

export interface TimeBucket { start: number; end: number; label: string; tooltipLabel: string; }

/** Chart buckets for a window: by day (≤31 days), week (≤120 days) or month. */
export const timeBuckets = (win: RangeWindow, now: number, earliest: number[]): TimeBucket[] => {
    const first = win.days == null ? Math.min(now, ...earliest) : win.start;
    const spanDays = Math.max(1, Math.ceil((now - first) / DAY));
    const unit: 'day' | 'week' | 'month' = spanDays <= 31 ? 'day' : spanDays <= 120 ? 'week' : 'month';

    const buckets: TimeBucket[] = [];
    const fmt = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleDateString('en-IN', o);
    if (unit === 'month') {
        const d = new Date(first); d.setDate(1); d.setHours(0, 0, 0, 0);
        while (d.getTime() <= now) {
            const s = d.getTime(); d.setMonth(d.getMonth() + 1);
            const sd = new Date(s);
            buckets.push({ start: s, end: d.getTime(), label: fmt(sd, { month: 'short' }) + (sd.getMonth() === 0 ? ` ’${String(sd.getFullYear()).slice(2)}` : ''), tooltipLabel: fmt(sd, { month: 'long', year: 'numeric' }) });
        }
    } else {
        const step = unit === 'day' ? DAY : 7 * DAY;
        const d = new Date(first); d.setHours(0, 0, 0, 0);
        for (let s = d.getTime(); s <= now; s += step) {
            const sd = new Date(s);
            buckets.push({
                start: s, end: s + step,
                label: fmt(sd, { day: 'numeric', month: 'short' }),
                tooltipLabel: unit === 'day' ? fmt(sd, { weekday: 'short', day: 'numeric', month: 'short' }) : `Week of ${fmt(sd, { day: 'numeric', month: 'short' })}`,
            });
        }
    }
    return buckets;
};

/** Paid revenue per time bucket. */
export const revenueSeries = (orders: any[], win: RangeWindow, now: number): SeriesPoint[] => {
    const paid = orders.filter(isPaid).map(o => ({ t: timeOf(o), total: o.total || 0 })).filter(x => x.t > 0);
    return timeBuckets(win, now, paid.map(p => p.t)).map(b => {
        const hits = paid.filter(p => p.t >= b.start && p.t < b.end);
        return { label: b.label, tooltipLabel: b.tooltipLabel, revenue: hits.reduce((s, p) => s + p.total, 0), orders: hits.length };
    });
};

export interface BarRow { label: string; value: number; sub?: string; }

/** Paid revenue by shipping state, top N + "Other". */
export const salesByState = (orders: any[], top = 8): BarRow[] => {
    const m = new Map<string, { revenue: number; orders: number }>();
    for (const o of orders.filter(isPaid)) {
        const s = (o.customerAddress?.state || 'Unknown').trim() || 'Unknown';
        const cur = m.get(s) || { revenue: 0, orders: 0 };
        cur.revenue += o.total || 0; cur.orders++;
        m.set(s, cur);
    }
    const rows = [...m.entries()].sort((a, b) => b[1].revenue - a[1].revenue);
    const head = rows.slice(0, top).map(([label, v]) => ({ label, value: v.revenue, sub: `${v.orders} order${v.orders === 1 ? '' : 's'}` }));
    const rest = rows.slice(top);
    if (rest.length) {
        const r = rest.reduce((a, [, v]) => ({ revenue: a.revenue + v.revenue, orders: a.orders + v.orders }), { revenue: 0, orders: 0 });
        head.push({ label: `Other (${rest.length} state${rest.length === 1 ? '' : 's'})`, value: r.revenue, sub: `${r.orders} order${r.orders === 1 ? '' : 's'}` });
    }
    return head;
};

export interface SplitPart { label: string; value: number; count: number; }

const split = (orders: any[], a: [string, (o: any) => boolean], bLabel: string): SplitPart[] => {
    const paid = orders.filter(isPaid);
    const yes = paid.filter(a[1]), no = paid.filter(o => !a[1](o));
    const sum = (l: any[]) => l.reduce((s, o) => s + (o.total || 0), 0);
    return [
        { label: a[0], value: sum(yes), count: yes.length },
        { label: bLabel, value: sum(no), count: no.length },
    ];
};

export const paymentSplit = (orders: any[]) => split(orders, ['Prepaid', o => o.paymentMethod !== 'cod'], 'Cash on delivery');

export const channelSplit = (orders: any[]) =>
    split(orders, ['Website', o => isWebsiteOrder(o)], 'WhatsApp');

/** Each paid order is either the customer's first purchase or a repeat purchase. */
export const firstVsRepeat = (ordersInWindow: any[], customers: Customer[]): SplitPart[] => {
    const firstOrders = new Set<any>();
    customers.forEach(c => {
        const paid = c.orders.filter(isPaid);
        if (paid.length) firstOrders.add(paid.reduce((a, b) => (timeOf(b) < timeOf(a) ? b : a)));
    });
    return split(ordersInWindow, ['First orders', o => firstOrders.has(o)], 'Repeat orders');
};

export const isWebsiteOrder = (o: any) => o.source !== 'whatsapp_pre_website' && o.channel !== 'whatsapp';

/**
 * Website checkout conversion: of the checkouts started on the site (every
 * order document is created when the customer clicks Pay), how many paid.
 * Pre-website WhatsApp sales are excluded — they never went through checkout.
 */
export const checkoutConversion = (orders: any[]) => {
    const site = orders.filter(o => isWebsiteOrder(o) && o.status !== 'cancelled');
    const paid = site.filter(isPaid).length;
    return { started: site.length, paid, unpaid: site.length - paid, rate: site.length ? Math.round((paid / site.length) * 100) : 0 };
};

export interface SegmentRow { segment: Segment; customers: number; revenue: number; share: number; }

export const segmentSummary = (customers: Customer[]): SegmentRow[] => {
    const total = customers.reduce((s, c) => s + c.totalSpent, 0) || 1;
    return SEGMENTS.map(segment => {
        const list = customers.filter(c => c.segment === segment);
        const revenue = list.reduce((s, c) => s + c.totalSpent, 0);
        return { segment, customers: list.length, revenue, share: revenue / total };
    }).filter(r => r.customers > 0);
};

export interface Cohort { cohort: string; customers: number; repeat: number; repeatRate: number; avgLtv: number; }

export const computeCohorts = (orders: any[]): Cohort[] => {
    const paid = orders.filter(isPaid).map(o => ({ userId: o.userId, ts: toDate(o.createdAt), total: o.total || 0 }))
        .filter(o => o.userId && o.ts) as { userId: string; ts: Date; total: number }[];

    const firstMonth: Record<string, string> = {};
    const stats: Record<string, { orders: number; ltv: number }> = {};
    // first order month per customer
    const firstTs: Record<string, number> = {};
    for (const o of paid) {
        const t = o.ts.getTime();
        if (firstTs[o.userId] === undefined || t < firstTs[o.userId]) firstTs[o.userId] = t;
    }
    for (const [uid, t] of Object.entries(firstTs)) {
        const d = new Date(t);
        firstMonth[uid] = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
    for (const o of paid) {
        stats[o.userId] = stats[o.userId] || { orders: 0, ltv: 0 };
        stats[o.userId].orders++;
        stats[o.userId].ltv += o.total;
    }
    const byCohort: Record<string, { customers: number; repeat: number; ltvSum: number }> = {};
    for (const uid of Object.keys(stats)) {
        const c = firstMonth[uid];
        byCohort[c] = byCohort[c] || { customers: 0, repeat: 0, ltvSum: 0 };
        byCohort[c].customers++;
        if (stats[uid].orders > 1) byCohort[c].repeat++;
        byCohort[c].ltvSum += stats[uid].ltv;
    }
    return Object.entries(byCohort)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([cohort, v]) => ({
            cohort,
            customers: v.customers,
            repeat: v.repeat,
            repeatRate: +(100 * v.repeat / v.customers).toFixed(1),
            avgLtv: Math.round(v.ltvSum / v.customers),
        }));
};

export interface CouponRow { segment: string; orders: number; avgOrderValue: number; avgCart: number; discountCost: number; }

export const computeCoupon = (orders: any[]): CouponRow[] => {
    const paid = orders.filter(isPaid);
    const groups: Record<string, any[]> = { 'With coupon': [], 'No coupon': [] };
    for (const o of paid) (o.couponCode ? groups['With coupon'] : groups['No coupon']).push(o);
    return Object.entries(groups).filter(([, arr]) => arr.length).map(([segment, arr]) => ({
        segment,
        orders: arr.length,
        avgOrderValue: Math.round(arr.reduce((s, o) => s + (o.total || 0), 0) / arr.length),
        avgCart: Math.round(arr.reduce((s, o) => s + (o.subtotal || o.total || 0), 0) / arr.length),
        discountCost: arr.reduce((s, o) => s + (o.discount || 0), 0),
    })).sort((a, b) => b.orders - a.orders);
};

export interface ProductRow { product: string; units: number; revenue: number; avgRating: number | null; reviews: number; }

export const computeProducts = (orders: any[], reviews: any[]): ProductRow[] => {
    // Grouped by name: imported WhatsApp orders can carry a different id for the same bat
    const sales: Record<string, { name: string; ids: Set<string>; units: number; revenue: number }> = {};
    for (const o of orders.filter(isPaid)) {
        for (const it of (o.items || [])) {
            const id = it.productId || it.id || it.productName;
            if (!id) continue;
            const name = CATALOG_NAME.get(it.productId) || String(it.productName || it.name || id).trim();
            const k = name.toLowerCase();
            sales[k] = sales[k] || { name, ids: new Set(), units: 0, revenue: 0 };
            sales[k].ids.add(String(id));
            sales[k].units += it.quantity || 1;
            sales[k].revenue += (it.price || 0) * (it.quantity || 1);
        }
    }
    const rate: Record<string, { sum: number; n: number }> = {};
    for (const r of reviews.filter(r => r.status === 'approved')) {
        rate[r.productId] = rate[r.productId] || { sum: 0, n: 0 };
        rate[r.productId].sum += r.rating || 0;
        rate[r.productId].n++;
    }
    return Object.values(sales).map(s => {
        const rs = [...s.ids].map(id => rate[id]).filter(Boolean);
        const n = rs.reduce((t, x) => t + x.n, 0);
        const sum = rs.reduce((t, x) => t + x.sum, 0);
        return {
            product: s.name,
            units: s.units,
            revenue: Math.round(s.revenue),
            avgRating: n ? +(sum / n).toFixed(2) : null,
            reviews: n,
        };
    }).sort((a, b) => b.revenue - a.revenue);
};

export interface LeadPipeline {
    total: number; converted: number; conversionRate: number;
    reachableOpen: number; tappedWhatsApp: number; openPipelineValue: number;
}

export const computeLeadPipeline = (leads: any[]): LeadPipeline => {
    const total = leads.length;
    const converted = leads.filter(l => l.status === 'converted').length;
    return {
        total,
        converted,
        conversionRate: total ? +(100 * converted / total).toFixed(1) : 0,
        reachableOpen: leads.filter(l => l.status === 'browsing' && l.phone).length,
        tappedWhatsApp: leads.filter(l => (l.whatsappClicks || 0) > 0).length,
        openPipelineValue: leads.filter(l => l.status === 'browsing').reduce((s, l) => s + (l.cartTotal || 0), 0),
    };
};
