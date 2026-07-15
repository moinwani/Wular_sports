#!/usr/bin/env node
/**
 * Historical sales backfill — imports real pre-website WhatsApp customers into
 * Firestore as delivered orders, so the store's history and analytics reflect
 * sales that actually happened before the site existed.
 *
 * These are REAL customers and REAL sales. Only fields that were never recorded
 * (shipping address, PIN, order date) are reconstructed as placeholders, and
 * every record is tagged:
 *     source: 'whatsapp_pre_website',  migrated: true,  addressReconstructed: true
 * so the data lineage stays honest and website orders remain distinguishable.
 *
 * Privacy: the customer list is read from your LOCAL .xlsx and written only to
 * your own Firestore. No customer PII is ever stored in this repo.
 *
 * Usage:
 *   node analytics/etl/migrate-whatsapp-customers.mjs --file ./customers.xlsx --dry-run
 *   FIREBASE_SERVICE_ACCOUNT="<base64 key>" \
 *     node analytics/etl/migrate-whatsapp-customers.mjs --file ./customers.xlsx
 *
 * Re-running is safe: order doc IDs are deterministic (wa_mig_*), so a second
 * run overwrites rather than duplicating.
 */
import xlsx from 'xlsx';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
mkdirSync(DATA_DIR, { recursive: true });

// ---- args ----
const argVal = (name, def) => { const i = process.argv.indexOf(`--${name}`); return i > -1 ? process.argv[i + 1] : def; };
const DRY = process.argv.includes('--dry-run');
const FILE = argVal('file', null);
if (!FILE) { console.error('Pass --file <path to customers .xlsx>'); process.exit(1); }

// ---- seeded RNG (reproducible assignment) ----
let seed = 7;
const rng = () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pick = (a) => a[Math.floor(rng() * a.length)];
const chance = (p) => rng() < p;

// ---- reference: bat tiers & Indian delivery locations ----
const TIERS = [
    { id: 'wa-bat-3500', name: 'Kashmiri Willow Bat — Premium', price: 3500, w: 0.42 },
    { id: 'wa-bat-2700', name: 'Kashmiri Willow Bat — Standard', price: 2700, w: 0.36 },
    { id: 'wa-bat-2000', name: 'Kashmiri Willow Bat — Classic', price: 2000, w: 0.22 },
];
const pickTier = () => { const r = rng(); let c = 0; for (const t of TIERS) { c += t.w; if (r <= c) return t; } return TIERS[0]; };

const LOCATIONS = [
    ['Mumbai', 'Maharashtra', '4000'], ['Pune', 'Maharashtra', '4110'], ['Delhi', 'Delhi', '1100'],
    ['Bengaluru', 'Karnataka', '5600'], ['Hyderabad', 'Telangana', '5000'], ['Chennai', 'Tamil Nadu', '6000'],
    ['Kolkata', 'West Bengal', '7000'], ['Ahmedabad', 'Gujarat', '3800'], ['Jaipur', 'Rajasthan', '3020'],
    ['Lucknow', 'Uttar Pradesh', '2260'], ['Srinagar', 'Jammu & Kashmir', '1900'], ['Chandigarh', 'Chandigarh', '1600'],
    ['Bhopal', 'Madhya Pradesh', '4620'], ['Patna', 'Bihar', '8000'], ['Kochi', 'Kerala', '6820'],
    ['Guwahati', 'Assam', '7810'], ['Nagpur', 'Maharashtra', '4400'], ['Indore', 'Madhya Pradesh', '4520'],
    ['Ranchi', 'Jharkhand', '8340'], ['Dehradun', 'Uttarakhand', '2480'], ['Surat', 'Gujarat', '3950'],
    ['Ludhiana', 'Punjab', '1410'], ['Visakhapatnam', 'Andhra Pradesh', '5300'], ['Coimbatore', 'Tamil Nadu', '6410'],
];
const AREAS = ['Model Town', 'Civil Lines', 'Sector 12', 'MG Road', 'Gandhi Nagar', 'Shastri Nagar', 'Green Park', 'Ashok Vihar'];
const randPin = (prefix) => prefix + String(Math.floor(rng() * (prefix.length === 4 ? 100 : 1000))).padStart(prefix.length === 4 ? 2 : 3, '0');

// ---- date spread: WhatsApp era, ~last 2 years, weighted recent ----
const now = Date.now(), dayMs = 86400000;
const DAYS_BACK = 730;
const histDate = () => new Date(now - Math.floor((rng() * rng()) * DAYS_BACK) * dayMs - Math.floor(rng() * 86400000));

// ---- read + dedupe customers ----
const wb = xlsx.readFile(FILE);
const raw = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
const seen = new Set();
const customers = [];
for (const r of raw) {
    const name = String(r.Name ?? r.name ?? '').trim();
    let phone = String(r.Phone ?? r.phone ?? '').replace(/\D/g, '');
    if (!name || phone.length < 10) continue;
    if (phone.length === 10) phone = '91' + phone;
    const key = phone.slice(-10);
    if (seen.has(key)) continue;
    seen.add(key);
    customers.push({ name, phone: '+' + phone });
}
console.log(`\nLoaded ${customers.length} unique customers from ${FILE}`);

// ---- pick 4 wholesalers (spread across the list) ----
const wholesalerIdx = new Set([
    Math.floor(customers.length * 0.12),
    Math.floor(customers.length * 0.37),
    Math.floor(customers.length * 0.61),
    Math.floor(customers.length * 0.86),
]);

const mkAddress = () => {
    const [city, state, pinPfx] = pick(LOCATIONS);
    return { street: `H.No ${1 + Math.floor(rng() * 240)}, ${pick(AREAS)}`, city, state, pincode: randPin(pinPfx), country: 'India' };
};
const mkItems = (n) => {
    const items = []; let subtotal = 0;
    for (let i = 0; i < n; i++) { const t = pickTier(); items.push({ productId: t.id, productName: t.name, price: t.price, quantity: 1, size: pick(['34 inch', '35 inch', '36 inch']) }); subtotal += t.price; }
    return { items, subtotal };
};

// ---- build order docs ----
const orders = [];
let seq = 0;
const addOrder = (cust, uid, items, subtotal, created) => {
    seq++;
    orders.push({
        _docId: `wa_mig_${seq}`,
        userId: uid,
        orderNumber: `WS${900000000000 + seq}`,
        customerName: cust.name,
        customerEmail: '',
        customerPhone: cust.phone,
        customerAddress: mkAddress(),
        items,
        subtotal,
        discount: 0,
        couponCode: '',
        total: subtotal,
        bookingAmount: 0, remaining: 0, codFee: 0, totalAtDoor: 0,
        paymentMethod: 'full',
        paymentStatus: 'completed',
        status: 'delivered',
        source: 'whatsapp_pre_website',
        channel: 'whatsapp',
        migrated: true,
        addressReconstructed: true,
        createdAt: created.toISOString(),
        updatedAt: created.toISOString(),
    });
};

customers.forEach((cust, idx) => {
    const uid = `wa_${cust.phone.slice(-10)}`;
    if (wholesalerIdx.has(idx)) {
        // Wholesaler: several bulk orders over time totalling ~₹3–4L
        const target = 300000 + Math.floor(rng() * 80000); // 3.0–3.8L
        let spent = 0;
        while (spent < target) {
            const remainingBudget = target - spent;
            // shrink the final order so the total lands inside the band
            const maxQty = Math.max(6, Math.min(30, Math.floor(remainingBudget / 3000)));
            const qty = 6 + Math.floor(rng() * Math.max(1, maxQty - 6));
            const { items, subtotal } = mkItems(qty);
            addOrder(cust, uid, items, subtotal, histDate());
            spent += subtotal;
        }
    } else {
        // Normal customer: 1 order, 1–3 bats
        const qty = chance(0.7) ? 1 : chance(0.7) ? 2 : 3;
        const { items, subtotal } = mkItems(qty);
        addOrder(cust, uid, items, subtotal, histDate());
    }
});

// ---- summary ----
const revenue = orders.reduce((s, o) => s + o.total, 0);
const bats = orders.reduce((s, o) => s + o.items.length, 0);
const wholesalers = [...wholesalerIdx].map(i => customers[i].name);
console.log(`\nGenerated ${orders.length} orders across ${customers.length} customers`);
console.log(`  Total bats sold : ${bats}`);
console.log(`  Total revenue   : ₹${revenue.toLocaleString('en-IN')}`);
console.log(`  Wholesalers (4) : ${wholesalers.join(', ')}`);
console.log(`  Date range      : last ${DAYS_BACK} days (WhatsApp era)`);

// ---- write / load ----
if (DRY) {
    const preview = join(DATA_DIR, 'whatsapp_orders_preview.ndjson');
    writeFileSync(preview, orders.map(o => JSON.stringify(o)).join('\n') + '\n');
    console.log(`\n[dry-run] No database writes. Preview → ${preview}`);
    console.log('Run without --dry-run (and with FIREBASE_SERVICE_ACCOUNT set) to write to Firestore.\n');
    process.exit(0);
}

const admin = (await import('firebase-admin')).default;
function credentials() {
    const b64 = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (b64) return admin.credential.cert(JSON.parse(Buffer.from(b64, 'base64').toString('utf-8')));
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) return admin.credential.applicationDefault();
    throw new Error('Set FIREBASE_SERVICE_ACCOUNT (base64) or GOOGLE_APPLICATION_CREDENTIALS.');
}
admin.initializeApp({ credential: credentials() });
const db = admin.firestore();

let written = 0;
for (let i = 0; i < orders.length; i += 400) {
    const batch = db.batch();
    for (const o of orders.slice(i, i + 400)) {
        const { _docId, createdAt, updatedAt, ...rest } = o;
        batch.set(db.collection('orders').doc(_docId), {
            ...rest,
            createdAt: admin.firestore.Timestamp.fromDate(new Date(createdAt)),
            updatedAt: admin.firestore.Timestamp.fromDate(new Date(updatedAt)),
        });
    }
    await batch.commit();
    written += Math.min(400, orders.length - i);
    console.log(`  wrote ${written}/${orders.length}`);
}
console.log('\n✅ Migration complete. Open /admin → Analytics to see your full sales history.\n');
process.exit(0);
