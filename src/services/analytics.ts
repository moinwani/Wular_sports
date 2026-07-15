/**
 * Client-side analytics — the same metric families as the offline SQL pack
 * (analytics/sql/*.sql), computed live in the browser from the Firestore
 * collections the admin panel already has access to. Real data, no export.
 *
 * The GA4 *visitor* funnel (page_view → view_item → …) lives in GA4/BigQuery,
 * not Firestore, so here we show the Firestore-derivable *checkout* funnel
 * (leads → orders started → paid) instead.
 */

const PAID = ['confirmed', 'processing', 'shipped', 'delivered'];
const isPaid = (o: any) => PAID.includes(o.status);

const toDate = (v: any): Date | null => {
    if (!v) return null;
    if (v instanceof Date) return v;
    if (typeof v.toDate === 'function') return v.toDate();
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
};

export interface Kpis {
    paidRevenue: number;
    paidOrders: number;
    abandoned: number;
    cancelled: number;
    avgOrderValue: number;
    uniqueCustomers: number;
    discountGiven: number;
    ordersPerCustomer: number;
}

export const computeKpis = (orders: any[]): Kpis => {
    const paid = orders.filter(isPaid);
    const revenue = paid.reduce((s, o) => s + (o.total || 0), 0);
    const customers = new Set(paid.map(o => o.userId).filter(Boolean));
    return {
        paidRevenue: revenue,
        paidOrders: paid.length,
        abandoned: orders.filter(o => o.status === 'pending').length,
        cancelled: orders.filter(o => o.status === 'cancelled').length,
        avgOrderValue: paid.length ? Math.round(revenue / paid.length) : 0,
        uniqueCustomers: customers.size,
        discountGiven: paid.reduce((s, o) => s + (o.discount || 0), 0),
        ordersPerCustomer: customers.size ? +(paid.length / customers.size).toFixed(2) : 0,
    };
};

export interface FunnelStep { step: string; count: number; pct: number; stepConv: number | null; }

/** Checkout-level funnel from Firestore (leads → orders → paid). */
export const computeCheckoutFunnel = (orders: any[], leads: any[]): FunnelStep[] => {
    const leadsCount = leads.length;
    const ordersStarted = orders.length;            // any order doc = checkout reached
    const paid = orders.filter(isPaid).length;
    const top = Math.max(leadsCount, ordersStarted, 1);
    const pct = (n: number) => +(100 * n / top).toFixed(1);
    const conv = (n: number, prev: number) => prev ? +(100 * n / prev).toFixed(1) : null;
    return [
        { step: 'Leads captured', count: leadsCount, pct: pct(leadsCount), stepConv: null },
        { step: 'Reached checkout', count: ordersStarted, pct: pct(ordersStarted), stepConv: conv(ordersStarted, leadsCount) },
        { step: 'Paid', count: paid, pct: pct(paid), stepConv: conv(paid, ordersStarted) },
    ];
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

export interface RfmSegment { segment: string; customers: number; avgOrders: number; avgSpend: number; tone: 'good' | 'bad' | 'neutral'; }

const quartile = (sortedAsc: number[], value: number): number => {
    // 1..4 by position; ties share
    const n = sortedAsc.length;
    if (n === 0) return 1;
    const rank = sortedAsc.filter(v => v <= value).length; // 1..n
    return Math.min(4, Math.max(1, Math.ceil(rank / n * 4)));
};

export const computeRfm = (orders: any[]): RfmSegment[] => {
    const paid = orders.filter(isPaid).map(o => ({ userId: o.userId, ts: toDate(o.createdAt), total: o.total || 0 }))
        .filter(o => o.userId && o.ts) as { userId: string; ts: Date; total: number }[];
    if (!paid.length) return [];

    const now = Date.now();
    const per: Record<string, { recency: number; freq: number; mon: number }> = {};
    for (const o of paid) {
        const days = (now - o.ts.getTime()) / 86400000;
        per[o.userId] = per[o.userId] || { recency: days, freq: 0, mon: 0 };
        per[o.userId].recency = Math.min(per[o.userId].recency, days);
        per[o.userId].freq++;
        per[o.userId].mon += o.total;
    }
    const custs = Object.entries(per).map(([userId, v]) => ({ userId, ...v }));
    // recency: lower is better → invert for scoring
    const recSorted = custs.map(c => -c.recency).sort((a, b) => a - b);
    const freqSorted = custs.map(c => c.freq).sort((a, b) => a - b);
    const monSorted = custs.map(c => c.mon).sort((a, b) => a - b);

    const segCount: Record<string, { n: number; orders: number; spend: number }> = {};
    for (const c of custs) {
        const r = quartile(recSorted, -c.recency);
        const f = quartile(freqSorted, c.freq);
        const m = quartile(monSorted, c.mon);
        let seg: string;
        if (r >= 3 && f >= 3 && m >= 3) seg = 'Champions';
        else if (r >= 3 && f >= 2) seg = 'Loyal';
        else if (r >= 3 && f === 1) seg = 'New / Promising';
        else if (r === 2) seg = 'Needs Attention';
        else seg = 'At Risk / Lapsed';
        segCount[seg] = segCount[seg] || { n: 0, orders: 0, spend: 0 };
        segCount[seg].n++;
        segCount[seg].orders += c.freq;
        segCount[seg].spend += c.mon;
    }
    const tone = (s: string): 'good' | 'bad' | 'neutral' =>
        s === 'Champions' ? 'good' : s === 'At Risk / Lapsed' ? 'bad' : 'neutral';
    return Object.entries(segCount)
        .map(([segment, v]) => ({
            segment, customers: v.n,
            avgOrders: +(v.orders / v.n).toFixed(1),
            avgSpend: Math.round(v.spend / v.n),
            tone: tone(segment),
        }))
        .sort((a, b) => b.customers - a.customers);
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
    const sales: Record<string, { name: string; units: number; revenue: number }> = {};
    for (const o of orders.filter(isPaid)) {
        for (const it of (o.items || [])) {
            const id = it.productId || it.id || it.productName;
            if (!id) continue;
            sales[id] = sales[id] || { name: it.productName || it.name || id, units: 0, revenue: 0 };
            sales[id].units += it.quantity || 1;
            sales[id].revenue += (it.price || 0) * (it.quantity || 1);
        }
    }
    const rate: Record<string, { sum: number; n: number }> = {};
    for (const r of reviews.filter(r => r.status === 'approved')) {
        rate[r.productId] = rate[r.productId] || { sum: 0, n: 0 };
        rate[r.productId].sum += r.rating || 0;
        rate[r.productId].n++;
    }
    return Object.entries(sales).map(([id, s]) => ({
        product: s.name,
        units: s.units,
        revenue: Math.round(s.revenue),
        avgRating: rate[id] ? +(rate[id].sum / rate[id].n).toFixed(2) : null,
        reviews: rate[id]?.n || 0,
    })).sort((a, b) => b.revenue - a.revenue);
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
