import type { NextApiRequest, NextApiResponse } from 'next';
import { db, FieldValue, Timestamp } from '../../../src/lib/firebaseAdmin';
import { isAdminRequest } from '../../../src/lib/adminAuth';
import { BUILT_IN_COUPONS } from '../../../src/data/coupons';
import { getCatalog } from '../../../src/lib/catalogServer';
import {
    Campaign, CouponDef, SpendEntry, PLATFORMS, SOURCES, normalizeCode, sanitizeAttribution,
} from '../../../src/lib/marketing';
import { metaConfigured, phoneDigits, purchaseFromOrder, sendPurchase } from '../../../src/lib/metaCapi';

/**
 * Admin-only marketing store (Admin SDK — these collections stay closed to
 * browsers by the default-deny Firestore rule, no rules change needed).
 *
 *  GET → { campaigns, spend, coupons, visitors, metaConfigured }
 *  POST { action: 'saveCampaign' | 'deleteCampaign' | 'saveSpend' | 'deleteSpend'
 *               | 'saveCoupon' | 'deleteCoupon' | 'setOrderSource' | 'recordSale' | 'metaTest', … }
 */

const CAMPAIGNS = 'marketingCampaigns';
const SPEND = 'adSpend';
const COUPONS = 'coupons';
const VISITORS = 'visitors';

const iso = (v: any): string | undefined =>
    v && typeof v.toDate === 'function' ? v.toDate().toISOString() : typeof v === 'string' ? v : undefined;
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const num = (v: unknown, min: number, max: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= min && n <= max ? n : null;
};
const isDay = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v));
const norm = (s?: string) => (s || '').trim().toLowerCase();
const last10 = (p: string) => p.replace(/\D/g, '').slice(-10);

class BadRequest extends Error {}
const bad = (msg: string): never => { throw new BadRequest(msg); };

/* ───────────── Reads ───────────── */

async function loadAll() {
    const [c, s, k, v] = await Promise.all([
        db.collection(CAMPAIGNS).get(),
        db.collection(SPEND).limit(5000).get(),
        db.collection(COUPONS).get(),
        db.collection(VISITORS).orderBy('updatedAt', 'desc').limit(2000).get(),
    ]);
    const campaigns = c.docs.map(d => ({ ...d.data(), id: d.id, createdAt: iso(d.get('createdAt')) }));
    const spend = s.docs.map(d => ({ ...d.data(), id: d.id, createdAt: iso(d.get('createdAt')) }));
    const builtIn = new Set(BUILT_IN_COUPONS.map(b => b.code));
    const saved = k.docs.map(d => ({
        ...d.data(), code: d.id, builtIn: builtIn.has(d.id),
        createdAt: iso(d.get('createdAt')), updatedAt: iso(d.get('updatedAt')),
    }));
    const coupons = [...saved, ...BUILT_IN_COUPONS.filter(b => !saved.some(x => x.code === b.code))];
    const visitors = v.docs.map(d => {
        const x = d.data();
        return {
            ref: d.id,
            attribution: x.attribution || null,
            whatsappClicks: x.whatsappClicks || 0,
            startedCheckout: !!x.startedCheckout,
            createdAt: iso(x.createdAt),
            updatedAt: iso(x.updatedAt),
        };
    });
    return { campaigns, spend, coupons, visitors };
}

/* ───────────── Campaigns & spend ───────────── */

function cleanCampaign(c: any, existing: Campaign[]): Omit<Campaign, 'id'> & { id?: string } {
    const name = str(c?.name, 80) || bad('Give the campaign a name');
    const platform = PLATFORMS.some(p => p.id === c?.platform) ? c.platform : 'meta';
    const code = normalizeCode(c?.code).slice(0, 12);
    if (code && existing.some(x => x.code === code && x.id !== c?.id)) bad(`Code ${code} is already used by another campaign`);
    const status = ['active', 'paused', 'ended'].includes(c?.status) ? c.status : 'active';
    const out: any = { name, platform, status };
    if (c?.id) out.id = String(c.id);
    out.code = code || FieldValue.delete();
    out.utmCampaign = str(c?.utmCampaign, 120) || FieldValue.delete();
    out.couponCode = normalizeCode(c?.couponCode) || FieldValue.delete();
    return out;
}

async function saveSpend(body: any) {
    const rows: any[] = Array.isArray(body.entries) ? body.entries.slice(0, 500) : bad('No spend rows');
    const via = body.via === 'csv' ? 'csv' : 'manual';
    const campSnap = await db.collection(CAMPAIGNS).get();
    const campaigns = campSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Campaign[];
    const byName = new Map(campaigns.map(c => [norm(c.name), c]));
    const created: Campaign[] = [];
    const saved: SpendEntry[] = [];
    const batch = db.batch();

    for (const r of rows) {
        const amount = num(r.amount, 0, 10_000_000);
        if (amount == null) bad('Spend amount must be a number');
        if (!isDay(r.from) || !isDay(r.to) || r.from > r.to) bad('Each spend row needs a valid from/to date');
        if ((Date.parse(r.to) - Date.parse(r.from)) / 86400000 > 400) bad('A spend row can cover at most 400 days');

        let campaign = r.campaignId ? campaigns.find(c => c.id === r.campaignId) : undefined;
        if (!campaign) {
            const name = str(r.campaignName, 80) || bad('Each spend row needs a campaign');
            campaign = byName.get(norm(name));
            if (!campaign) {
                const ref = db.collection(CAMPAIGNS).doc();
                const platform = PLATFORMS.some(p => p.id === r.platform) ? r.platform : 'meta';
                campaign = { id: ref.id, name, platform, status: 'active' };
                batch.set(ref, { name, platform, status: 'active', createdAt: FieldValue.serverTimestamp() });
                byName.set(norm(name), campaign);
                campaigns.push(campaign);
                created.push(campaign);
            }
        }
        // One entry per campaign + period: importing the same report twice replaces, never doubles
        const id = `${campaign.id}_${r.from}_${r.to}`;
        const results = num(r.results, 0, 10_000_000);
        const entry: SpendEntry = {
            id, campaignId: campaign.id, from: r.from, to: r.to, amount: Math.round(amount! * 100) / 100, via,
            ...(results != null ? { results } : {}),
        };
        const { id: _id, ...doc } = entry;
        batch.set(db.collection(SPEND).doc(id), { ...doc, createdAt: FieldValue.serverTimestamp() });
        saved.push(entry);
    }
    await batch.commit();
    return { spend: saved, created };
}

/* ───────────── Coupons ───────────── */

function cleanCoupon(c: any): CouponDef {
    const code = normalizeCode(c?.code) || bad('Coupon code is required (letters and numbers)');
    if (code.length < 3) bad('Coupon code must be at least 3 characters');
    const type = c?.type === 'percent' ? 'percent' : 'per_bat';
    const value = type === 'percent' ? num(c?.value, 1, 90) : num(c?.value, 1, 5000);
    if (value == null) bad(type === 'percent' ? 'Percent must be between 1 and 90' : '₹ off per bat must be between 1 and 5000');
    const expiresAt = c?.expiresAt ? (isDay(c.expiresAt) ? c.expiresAt : bad('Expiry must be a date')) : undefined;
    return {
        code, type, value: value!, active: c?.active !== false,
        ...(expiresAt ? { expiresAt } : {}),
        ...(str(c?.note, 100) ? { note: str(c?.note, 100) } : {}),
    };
}

/* ───────────── WhatsApp sales ───────────── */

const PAYMENT_MODES = ['upi', 'bank', 'cash', 'card', 'cod', 'other'];
const SALE_STATUSES = ['confirmed', 'processing', 'shipped', 'delivered'];
const PICKABLE = SOURCES.filter(s => s.pickable).map(s => s.id) as string[];

/** Find where this person came from on the website: by Ref code, else via their checkout lead's phone. */
async function findVisitor(ref: string, phone: string) {
    let visitorRef = /^WS-[A-Z0-9]{6}$/.test(ref) ? ref : '';
    if (!visitorRef && phone) {
        const leads = await db.collection('leads').where('phone', '==', phone).limit(3).get();
        visitorRef = leads.docs.map(d => d.get('visitorRef')).find(Boolean) || '';
    }
    if (!visitorRef) return null;
    const snap = await db.collection(VISITORS).doc(visitorRef).get();
    return { ref: visitorRef, attribution: snap.exists ? snap.get('attribution') : null };
}

async function recordSale(b: any) {
    const c = b.customer || {};
    const name = str(c.name, 100) || bad('Customer name is required');
    const digits = phoneDigits(c.phone);
    if (digits.length < 10 || digits.length > 15) bad('Enter a valid phone number');
    const phone10 = last10(digits);

    const { products } = await getCatalog({ fresh: true });
    const items: any[] = Array.isArray(b.items) ? b.items.slice(0, 50) : [];
    if (!items.length) bad('Add at least one bat');
    const orderItems = items.map(it => {
        const product = products.find(p => p.id === it.productId);
        const productName = str(it.productName, 100) || product?.name || bad('Each item needs a name');
        const price = num(it.price, 0, 1_000_000);
        const quantity = num(it.quantity, 1, 1000);
        if (price == null || quantity == null || !Number.isInteger(quantity)) bad('Check item price and quantity');
        return { productId: product?.id || normalizeCode(productName).toLowerCase() || 'custom', productName, price: price!, quantity: quantity!, size: str(it.size, 30) };
    });
    const subtotal = orderItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const discount = num(b.discount ?? 0, 0, subtotal) ?? bad('Discount can’t be more than the total');
    const total = subtotal - discount!;

    const paymentMode = PAYMENT_MODES.includes(b.paymentMode) ? b.paymentMode : 'upi';
    const isCOD = paymentMode === 'cod';
    const status = SALE_STATUSES.includes(b.status) ? b.status : 'confirmed';

    // Sale date: today → now; an earlier day → midday India time on that day
    let createdAt = Date.now();
    if (b.date) {
        if (!isDay(b.date)) bad('Sale date is invalid');
        const today = new Date(Date.now() + 5.5 * 3600000).toISOString().slice(0, 10);
        if (b.date > today) bad('Sale date can’t be in the future');
        if (b.date !== today) createdAt = Date.parse(`${b.date}T12:00:00+05:30`);
    }

    const source = b.source ? (PICKABLE.includes(b.source) ? b.source : bad('Unknown source')) : '';
    const campaignId = str(b.campaignId, 60);
    const adCode = normalizeCode(b.adCode).slice(0, 12);

    // Pull the website trail (which ad they clicked before messaging us)
    const visitor = await findVisitor(normalizeCode(b.ref), phone10);
    const web = sanitizeAttribution({ ...(visitor?.attribution || {}), ref: visitor?.ref });
    const attribution: Record<string, any> = { ...(web || {}) };
    if (source || campaignId || adCode) {
        attribution.manual = {
            source: source || 'meta_ads',
            ...(campaignId ? { campaignId } : {}),
            ...(adCode ? { adCode } : {}),
            at: new Date().toISOString(),
        };
    }

    const order: Record<string, any> = {
        userId: `wa_${phone10}`,
        orderNumber: `WA${Date.now()}`,
        customerName: name,
        customerEmail: str(c.email, 254),
        customerPhone: `+${digits}`,
        customerAddress: {
            street: str(c.address, 300), city: str(c.city, 100), state: str(c.state, 100),
            pincode: str(c.pincode, 10), country: 'India',
        },
        items: orderItems,
        subtotal, discount, total,
        couponCode: normalizeCode(b.couponCode),
        bookingAmount: 0, codFee: 0,
        remaining: isCOD ? total : 0,
        totalAtDoor: isCOD ? total : 0,
        paymentMethod: isCOD ? 'cod' : 'full',
        paymentMode,
        paymentStatus: isCOD ? 'pending' : 'completed',
        status,
        channel: 'whatsapp',
        recordedBy: 'admin',
        notes: str(b.notes, 1000),
        // No order emails for chat sales — the conversation already has the details
        emailStatus: { admin: 'skipped', customer: 'skipped' },
        createdAt: Timestamp.fromMillis(createdAt),
        updatedAt: FieldValue.serverTimestamp(),
        ...(Object.keys(attribution).length ? { attribution } : {}),
    };

    const ref = db.collection('orders').doc();
    await ref.set(order);

    let meta = null;
    if (b.sendToMeta !== false && metaConfigured()) {
        meta = await sendPurchase(purchaseFromOrder(ref.id, order, 'chat', createdAt));
        await ref.update({ metaPurchase: meta });
    }

    // Their checkout lead (if any) is now a customer
    const leads = await db.collection('leads').where('phone', '==', phone10).limit(5).get();
    await Promise.all(leads.docs.map(d => d.ref.update({ status: 'converted' })));

    return {
        orderId: ref.id,
        meta,
        foundWebsiteVisit: !!(web?.first || web?.last),
    };
}

/* ───────────── Handler ───────────── */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (!(await isAdminRequest(req))) {
        return res.status(403).json({ error: 'Admin access required' });
    }

    try {
        if (req.method === 'GET') {
            return res.status(200).json({ ...(await loadAll()), metaConfigured: metaConfigured() });
        }
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

        const b = req.body || {};
        switch (b.action) {
            case 'saveCampaign': {
                const existing = (await db.collection(CAMPAIGNS).get()).docs.map(d => ({ id: d.id, ...(d.data() as any) }));
                const { id, ...data } = cleanCampaign(b.campaign, existing);
                const ref = id ? db.collection(CAMPAIGNS).doc(id) : db.collection(CAMPAIGNS).doc();
                await ref.set({ ...data, ...(id ? {} : { createdAt: FieldValue.serverTimestamp() }) }, { merge: true });
                const saved = (await ref.get()).data() || {};
                return res.status(200).json({ campaign: { ...saved, id: ref.id, createdAt: iso(saved.createdAt) } });
            }
            case 'deleteCampaign': {
                const id = str(b.id, 60) || bad('Missing campaign');
                const spend = await db.collection(SPEND).where('campaignId', '==', id).get();
                const batch = db.batch();
                spend.docs.forEach(d => batch.delete(d.ref));
                batch.delete(db.collection(CAMPAIGNS).doc(id));
                await batch.commit();
                return res.status(200).json({ ok: true });
            }
            case 'saveSpend':
                return res.status(200).json(await saveSpend(b));
            case 'deleteSpend': {
                await db.collection(SPEND).doc(str(b.id, 200) || bad('Missing entry')).delete();
                return res.status(200).json({ ok: true });
            }
            case 'saveCoupon': {
                const c = cleanCoupon(b.coupon);
                const { code, ...data } = c;
                const ref = db.collection(COUPONS).doc(code);
                const exists = (await ref.get()).exists;
                // Fields left blank in the form are cleared
                await ref.set({
                    ...data,
                    expiresAt: data.expiresAt || FieldValue.delete(),
                    note: data.note || FieldValue.delete(),
                    updatedAt: FieldValue.serverTimestamp(),
                    ...(exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
                }, { merge: true });
                return res.status(200).json({ coupon: c });
            }
            case 'deleteCoupon': {
                await db.collection(COUPONS).doc(normalizeCode(b.code) || bad('Missing code')).delete();
                return res.status(200).json({ ok: true });
            }
            case 'setOrderSource': {
                const ref = db.collection('orders').doc(str(b.orderId, 100) || bad('Missing order'));
                if (!(await ref.get()).exists) bad('Order not found');
                if (!b.source) {
                    await ref.update({ 'attribution.manual': FieldValue.delete(), updatedAt: FieldValue.serverTimestamp() });
                } else {
                    if (!PICKABLE.includes(b.source)) bad('Unknown source');
                    const manual = {
                        source: b.source,
                        ...(str(b.campaignId, 60) ? { campaignId: str(b.campaignId, 60) } : {}),
                        at: new Date().toISOString(),
                    };
                    // Replace the whole manual map (a merge would keep an old campaign link)
                    await ref.update({ 'attribution.manual': manual, updatedAt: FieldValue.serverTimestamp() });
                }
                const saved = (await ref.get()).get('attribution') || null;
                return res.status(200).json({ attribution: saved });
            }
            case 'recordSale':
                return res.status(200).json(await recordSale(b));
            case 'metaTest': {
                const testCode = str(b.testCode, 40) || bad('Paste the test code from Meta Events Manager → Test events');
                const r = await sendPurchase({
                    eventId: `test_${Date.now()}`, eventTime: Date.now(), actionSource: 'chat',
                    value: 1, orderId: 'TEST', items: [{ id: 'test', quantity: 1, price: 1 }],
                    phone: '9999999999', name: 'Test Buyer', city: 'Srinagar', state: 'Jammu and Kashmir', testCode,
                });
                return res.status(200).json(r);
            }
            default:
                return res.status(400).json({ error: 'Unknown action' });
        }
    } catch (err: any) {
        if (err instanceof BadRequest) return res.status(400).json({ error: err.message });
        console.error('admin/marketing failed:', err?.message);
        return res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
}
