import { isPaid, toDate, keyFor } from './customers';
import { RangeWindow, timeBuckets, isWebsiteOrder } from './analytics';
import {
    Attribution, Campaign, SpendEntry, SourceId, Touch,
    classifyTouch, isPaidSource, platformSource, sourceDef,
} from '../lib/marketing';

/**
 * Marketing numbers for the admin panel: which source and campaign each
 * paid order is credited to, and what the ads cost against what they sold.
 *
 * How a sale is credited (first match wins):
 *  1. The source you picked in the admin panel (WhatsApp sales, fixes)
 *  2. A coupon that belongs to a campaign
 *  3. The ad link / referrer of the visitor's latest, then first, visit
 *  4. Imported pre-website history → "Before the website"
 *  5. Bought before → "Repeat customer"; otherwise "Website, no source" /
 *     "Not recorded" (WhatsApp)
 */

const DAY = 86400000;
const norm = (s?: string) => (s || '').trim().toLowerCase();

export interface AttributedOrder {
    order: any;
    at: number;
    revenue: number;
    source: SourceId;
    /** Campaign id, or "utm:<name>" for an ad link we have no campaign record for */
    campaignKey: string | null;
    campaignName: string | null;
    /** Plain-English reason, e.g. "ad link", "coupon INSTA150", "set by you" */
    basis: string;
    via: 'website' | 'whatsapp';
    newCustomer: boolean;
    customerKey: string;
}

export interface CampaignIndex {
    byId: Map<string, Campaign>;
    byName: Map<string, Campaign>;
    byCoupon: Map<string, Campaign>;
    byCode: Map<string, Campaign>;
}

export const indexCampaigns = (campaigns: Campaign[]): CampaignIndex => {
    const idx: CampaignIndex = { byId: new Map(), byName: new Map(), byCoupon: new Map(), byCode: new Map() };
    for (const c of campaigns) {
        idx.byId.set(c.id, c);
        idx.byName.set(norm(c.name), c);
        if (c.utmCampaign) idx.byName.set(norm(c.utmCampaign), c);
        if (c.couponCode) idx.byCoupon.set(c.couponCode.toUpperCase(), c);
        if (c.code) idx.byCode.set(c.code.toUpperCase(), c);
    }
    return idx;
};

const hostOf = (url?: string) => {
    try { return new URL(url || '').hostname.replace(/^www\./, ''); } catch { return ''; }
};

/** Explain where a single website visit came from. */
export const describeTouch = (t?: Touch | null): string => {
    if (!t) return '';
    if (t.campaign) return `${t.source || 'ad'} · ${t.campaign}${t.content ? ` · ${t.content}` : ''}`;
    if (t.source) return t.source;
    if (t.gclid) return 'Google ad click';
    if (t.fbclid) return 'Instagram/Facebook link';
    return t.referrer ? hostOf(t.referrer) : '';
};

type Resolved = Pick<AttributedOrder, 'source' | 'campaignKey' | 'campaignName' | 'basis'>;

/** What a visitor's website trail says, without any order context. */
export const resolveTrail = (a: Attribution | null | undefined, idx: CampaignIndex): Resolved | null => {
    for (const t of [a?.last, a?.first]) {
        const s = classifyTouch(t);
        if (!s) continue;
        const c = t?.campaign ? idx.byName.get(norm(t.campaign)) : undefined;
        return {
            source: s,
            campaignKey: c ? c.id : t?.campaign ? `utm:${norm(t.campaign)}` : null,
            campaignName: c ? c.name : t?.campaign || null,
            basis: t?.source || t?.campaign ? 'ad link' : t?.fbclid ? 'untagged link' : `from ${hostOf(t?.referrer)}`,
        };
    }
    return null;
};

export const resolveOrderSource = (o: any, idx: CampaignIndex, boughtBefore: boolean): Resolved => {
    const a: Attribution = o.attribution || {};
    const none = { campaignKey: null, campaignName: null };

    if (a.manual?.source) {
        const c = (a.manual.campaignId && idx.byId.get(a.manual.campaignId))
            || (a.manual.adCode && idx.byCode.get(a.manual.adCode.toUpperCase()))
            || undefined;
        return {
            source: a.manual.source,
            ...(c ? { campaignKey: c.id, campaignName: c.name } : none),
            basis: a.manual.adCode ? `ad code ${a.manual.adCode}` : 'set by you',
        };
    }

    const coupon = String(o.couponCode || '').toUpperCase();
    const byCoupon = coupon ? idx.byCoupon.get(coupon) : undefined;
    if (byCoupon) {
        return { source: platformSource(byCoupon.platform), campaignKey: byCoupon.id, campaignName: byCoupon.name, basis: `coupon ${coupon}` };
    }

    const trail = resolveTrail(a, idx);
    if (trail) return trail;

    if (o.migrated || o.source === 'whatsapp_pre_website') return { source: 'legacy', ...none, basis: 'imported history' };
    if (boughtBefore) return { source: 'repeat', ...none, basis: 'bought before' };
    return isWebsiteOrder(o)
        ? { source: 'direct', ...none, basis: 'no ad link or referrer' }
        : { source: 'unknown', ...none, basis: 'source not recorded' };
};

/** Credit every paid order, oldest first (so "new customer" is known). */
export const attributeOrders = (orders: any[], campaigns: Campaign[]): AttributedOrder[] => {
    const idx = indexCampaigns(campaigns);
    const paid = orders
        .filter(isPaid)
        .map(o => ({ o, t: toDate(o.createdAt)?.getTime() || 0 }))
        .sort((a, b) => a.t - b.t);
    const seen = new Set<string>();
    return paid.map(({ o, t }) => {
        const key = keyFor(o.customerPhone, o.customerEmail) || String(o.userId || o.id);
        const before = seen.has(key);
        seen.add(key);
        return {
            order: o,
            at: t,
            revenue: o.total || 0,
            ...resolveOrderSource(o, idx, before),
            via: isWebsiteOrder(o) ? 'website' : 'whatsapp',
            newCustomer: !before,
            customerKey: key,
        };
    });
};

/* ───────────── Spend ───────────── */

const dayStart = (d: string) => new Date(`${d}T00:00:00`).getTime();

/** Share of a spend entry that falls inside [start, end), spread evenly over its days. */
const overlapShare = (e: SpendEntry, start: number, end: number) => {
    const s = dayStart(e.from);
    const en = dayStart(e.to) + DAY;
    if (!(en > s)) return 0;
    return Math.max(0, Math.min(end, en) - Math.max(start, s)) / (en - s);
};

export const spendIn = (entries: SpendEntry[], start: number, end: number) =>
    entries.reduce((t, e) => {
        const f = overlapShare(e, start, end);
        return { amount: t.amount + e.amount * f, results: t.results + (e.results || 0) * f };
    }, { amount: 0, results: 0 });

/* ───────────── Summaries ───────────── */

export interface MarketingKpis {
    spend: number;
    adRevenue: number;
    adOrders: number;
    /** ₹ of sales per ₹1 of ads; null without spend */
    roas: number | null;
    newFromAds: number;
    /** Ad spend ÷ new customers credited to ads */
    costPerNewCustomer: number | null;
    results: number;
    costPerResult: number | null;
    orders: number;
    revenue: number;
    /** Paid orders whose source we couldn't work out */
    unknownOrders: number;
}

export const marketingKpis = (inWin: AttributedOrder[], spend: SpendEntry[], start: number, end: number): MarketingKpis => {
    const s = spendIn(spend, start, end);
    const ads = inWin.filter(a => isPaidSource(a.source));
    const adRevenue = ads.reduce((t, a) => t + a.revenue, 0);
    const newFromAds = ads.filter(a => a.newCustomer).length;
    return {
        spend: s.amount,
        adRevenue,
        adOrders: ads.length,
        roas: s.amount > 0 ? adRevenue / s.amount : null,
        newFromAds,
        costPerNewCustomer: s.amount > 0 && newFromAds > 0 ? s.amount / newFromAds : null,
        results: s.results,
        costPerResult: s.amount > 0 && s.results > 0 ? s.amount / s.results : null,
        orders: inWin.length,
        revenue: inWin.reduce((t, a) => t + a.revenue, 0),
        unknownOrders: inWin.filter(a => a.source === 'unknown' || a.source === 'meta_untagged').length,
    };
};

export interface SourceRow {
    source: SourceId;
    label: string;
    paid: boolean;
    orders: number;
    revenue: number;
    newCustomers: number;
    viaWhatsApp: number;
}

export const bySource = (inWin: AttributedOrder[]): SourceRow[] => {
    const m = new Map<SourceId, SourceRow>();
    for (const a of inWin) {
        const d = sourceDef(a.source);
        const row = m.get(a.source) || { source: a.source, label: d.label, paid: d.paid, orders: 0, revenue: 0, newCustomers: 0, viaWhatsApp: 0 };
        row.orders++;
        row.revenue += a.revenue;
        if (a.newCustomer) row.newCustomers++;
        if (a.via === 'whatsapp') row.viaWhatsApp++;
        m.set(a.source, row);
    }
    return [...m.values()].sort((x, y) => y.revenue - x.revenue);
};

export interface CampaignRow {
    key: string;
    name: string;
    campaign: Campaign | null;
    spend: number;
    results: number;
    orders: number;
    revenue: number;
    newCustomers: number;
    viaWhatsApp: number;
    roas: number | null;
    costPerOrder: number | null;
    costPerResult: number | null;
}

export const byCampaign = (inWin: AttributedOrder[], spend: SpendEntry[], campaigns: Campaign[], start: number, end: number): CampaignRow[] => {
    const rows = new Map<string, CampaignRow>();
    const row = (key: string, name: string, campaign: Campaign | null) => {
        let r = rows.get(key);
        if (!r) {
            r = { key, name, campaign, spend: 0, results: 0, orders: 0, revenue: 0, newCustomers: 0, viaWhatsApp: 0, roas: null, costPerOrder: null, costPerResult: null };
            rows.set(key, r);
        }
        return r;
    };
    const byId = new Map(campaigns.map(c => [c.id, c]));
    for (const e of spend) {
        const f = overlapShare(e, start, end);
        if (!f) continue;
        const c = byId.get(e.campaignId) || null;
        const r = row(e.campaignId, c?.name || 'Deleted campaign', c);
        r.spend += e.amount * f;
        r.results += (e.results || 0) * f;
    }
    for (const a of inWin) {
        if (!a.campaignKey) continue;
        const r = row(a.campaignKey, a.campaignName || 'Unnamed', byId.get(a.campaignKey) || null);
        r.orders++;
        r.revenue += a.revenue;
        if (a.newCustomer) r.newCustomers++;
        if (a.via === 'whatsapp') r.viaWhatsApp++;
    }
    // Active campaigns show even before they have spend or sales
    for (const c of campaigns) if (c.status === 'active') row(c.id, c.name, c);
    return [...rows.values()]
        .map(r => ({
            ...r,
            roas: r.spend > 0 ? r.revenue / r.spend : null,
            costPerOrder: r.spend > 0 && r.orders > 0 ? r.spend / r.orders : null,
            costPerResult: r.spend > 0 && r.results > 0 ? r.spend / r.results : null,
        }))
        .sort((x, y) => (y.spend - x.spend) || (y.revenue - x.revenue));
};

export interface AdSeriesPoint { label: string; tooltipLabel: string; adRevenue: number; spend: number; orders: number; }

/** Sales credited to ads, per chart bucket, with that bucket's spend for the tooltip. */
export const adSeries = (inWin: AttributedOrder[], spend: SpendEntry[], win: RangeWindow, now: number): AdSeriesPoint[] => {
    const ads = inWin.filter(a => isPaidSource(a.source));
    const earliest = [...ads.map(a => a.at), ...spend.map(e => dayStart(e.from))].filter(t => t > 0);
    return timeBuckets(win, now, earliest.length ? earliest : [now]).map(b => {
        const hits = ads.filter(a => a.at >= b.start && a.at < b.end);
        return {
            label: b.label,
            tooltipLabel: b.tooltipLabel,
            adRevenue: hits.reduce((t, a) => t + a.revenue, 0),
            orders: hits.length,
            spend: spendIn(spend, b.start, b.end).amount,
        };
    });
};

/** Website visitors who tapped WhatsApp or started checkout, grouped by where they came from. */
export const visitorsBySource = (visitors: { attribution: Attribution | null; whatsappClicks: number; startedCheckout: boolean; updatedAt?: string }[], idx: CampaignIndex, start: number, end: number) => {
    const m = new Map<SourceId, { source: SourceId; label: string; people: number; tappedWhatsApp: number; startedCheckout: number }>();
    for (const v of visitors) {
        const t = Date.parse(v.updatedAt || '');
        if (!(t >= start && t < end)) continue;
        const s = resolveTrail(v.attribution, idx)?.source || 'direct';
        const r = m.get(s) || { source: s, label: sourceDef(s).label, people: 0, tappedWhatsApp: 0, startedCheckout: 0 };
        r.people++;
        if (v.whatsappClicks > 0) r.tappedWhatsApp++;
        if (v.startedCheckout) r.startedCheckout++;
        m.set(s, r);
    }
    return [...m.values()].sort((a, b) => b.people - a.people);
};
