#!/usr/bin/env node
/**
 * Generates realistic synthetic data matching the live Firestore schema, so the
 * entire analytics pipeline (SQL, dashboards) runs and demonstrates without
 * needing production credentials. Deterministic (seeded) → reproducible numbers.
 *
 * Output: analytics/data/*.ndjson  (orders, leads, reviews, subscribers, events)
 *
 * Usage:  node analytics/etl/generate-sample-data.mjs [--orders 400] [--days 90]
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
mkdirSync(DATA_DIR, { recursive: true });

// ---- CLI args ----
const arg = (name, def) => {
    const i = process.argv.indexOf(`--${name}`);
    return i > -1 ? Number(process.argv[i + 1]) : def;
};
const N_ORDERS = arg('orders', 400);
const DAYS = arg('days', 90);

// ---- Seeded RNG (mulberry32) for reproducibility ----
let seed = 42;
const rng = () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
const chance = (p) => rng() < p;
const intBetween = (a, b) => a + Math.floor(rng() * (b - a + 1));

// ---- Reference data (mirrors the real catalog) ----
const PRODUCTS = [
    { id: 'legacy-edition-2.0', name: 'Legacy Edition 2.0', price: 3499 },
    { id: 'legacy-edition', name: 'Legacy Edition 1.0', price: 2799 },
    { id: 'bahubali-edition', name: 'Bahubali Edition', price: 3199 },
    { id: 'ak-47-honeycomb', name: 'AK-47 Honeycomb', price: 2999 },
];
const CITIES = [
    ['Mumbai', 'Maharashtra'], ['Delhi', 'Delhi'], ['Bengaluru', 'Karnataka'],
    ['Hyderabad', 'Telangana'], ['Srinagar', 'J&K'], ['Pune', 'Maharashtra'],
    ['Chennai', 'Tamil Nadu'], ['Kolkata', 'West Bengal'], ['Jaipur', 'Rajasthan'],
];
const SOURCES = ['instagram_ad', 'facebook_ad', 'organic', 'whatsapp', 'direct'];
const FIRST = ['Rahul', 'Amit', 'Sara', 'Vikram', 'Neha', 'Arjun', 'Priya', 'Imran', 'Zoya', 'Karan'];
const LAST = ['Sharma', 'Khan', 'Patel', 'Shah', 'Reddy', 'Nair', 'Das', 'Gupta'];

const now = Date.now();
const dayMs = 86400000;
const isoDaysAgo = (d, jitterH = 0) =>
    new Date(now - d * dayMs - jitterH * 3600000).toISOString();

// Simulate a growth curve: more orders in recent weeks
const orderDay = () => {
    // bias toward recent days (quadratic)
    const r = rng() * rng();
    return Math.floor(r * DAYS);
};

// ---- Generate orders ----
const orders = [];
const events = [];
let orderSeq = 0;

for (let i = 0; i < N_ORDERS; i++) {
    const day = orderDay();
    const created = isoDaysAgo(day, intBetween(0, 23));
    const nItems = chance(0.15) ? 2 : 1;
    const items = [];
    let subtotal = 0;
    for (let k = 0; k < nItems; k++) {
        const p = pick(PRODUCTS);
        const qty = 1;
        items.push({ productId: p.id, productName: p.name, price: p.price, quantity: qty, size: pick(['34 inch', '35 inch', '36 inch']) });
        subtotal += p.price * qty;
    }
    const bats = items.reduce((s, it) => s + it.quantity, 0);
    const usedCoupon = chance(0.22);
    const discount = usedCoupon ? 100 * bats : 0;
    const total = subtotal - discount;
    const isCOD = chance(0.55);

    // Status distribution: most confirmed/delivered, some pending (abandoned), few cancelled
    const roll = rng();
    let status, paymentStatus;
    if (roll < 0.18) { status = 'pending'; paymentStatus = 'pending'; }       // abandoned checkout
    else if (roll < 0.30) { status = 'confirmed'; paymentStatus = isCOD ? 'pending' : 'completed'; }
    else if (roll < 0.45) { status = 'processing'; paymentStatus = isCOD ? 'pending' : 'completed'; }
    else if (roll < 0.65) { status = 'shipped'; paymentStatus = isCOD ? 'pending' : 'completed'; }
    else if (roll < 0.94) { status = 'delivered'; paymentStatus = 'completed'; }
    else { status = 'cancelled'; paymentStatus = 'failed'; }

    const [city, state] = pick(CITIES);
    const source = pick(SOURCES);
    const userId = `u_${1000 + Math.floor(rng() * 260)}`; // ~260 unique buyers → repeat customers
    orderSeq++;

    orders.push({
        userId,
        orderNumber: `WS${170000000000 + orderSeq}`,
        customerName: `${pick(FIRST)} ${pick(LAST)}`,
        customerEmail: `cust${intBetween(1, 9999)}@example.com`,
        customerPhone: `+91${intBetween(6000000000, 9999999999)}`,
        customerAddress: { street: `${intBetween(1, 200)} Main Rd`, city, state, pincode: `${intBetween(100000, 899999)}`, country: 'India' },
        items,
        subtotal,
        discount,
        couponCode: usedCoupon ? 'WELCOME100' : '',
        total,
        paymentMethod: isCOD ? 'cod' : 'full',
        status,
        paymentStatus,
        source,
        createdAt: created,
        updatedAt: created,
    });

    // Funnel events for this converting/abandoning visitor
    const vid = `v_${intBetween(1, 99999)}`;
    events.push({ event_name: 'page_view', event_time: created, user_pseudo_id: vid, source });
    events.push({ event_name: 'view_item', event_time: created, user_pseudo_id: vid, item_id: items[0].productId, value: subtotal, source });
    events.push({ event_name: 'add_to_cart', event_time: created, user_pseudo_id: vid, item_id: items[0].productId, value: subtotal, source });
    events.push({ event_name: 'begin_checkout', event_time: created, user_pseudo_id: vid, value: total, source });
    if (status !== 'pending') {
        events.push({ event_name: 'purchase', event_time: created, user_pseudo_id: vid, value: total, source });
    }
}

// Extra top-of-funnel visitors who never bought (to make the funnel realistic)
const EXTRA_VISITORS = N_ORDERS * 6;
for (let i = 0; i < EXTRA_VISITORS; i++) {
    const day = Math.floor(rng() * DAYS);
    const t = isoDaysAgo(day, intBetween(0, 23));
    const vid = `v_${intBetween(1, 99999)}`;
    const source = pick(SOURCES);
    events.push({ event_name: 'page_view', event_time: t, user_pseudo_id: vid, source });
    if (chance(0.45)) events.push({ event_name: 'view_item', event_time: t, user_pseudo_id: vid, item_id: pick(PRODUCTS).id, source });
    if (chance(0.12)) events.push({ event_name: 'add_to_cart', event_time: t, user_pseudo_id: vid, item_id: pick(PRODUCTS).id, source });
    if (chance(0.05)) events.push({ event_name: 'begin_checkout', event_time: t, user_pseudo_id: vid, source });
}

// ---- Leads (checkout lead capture) ----
const leads = [];
const N_LEADS = Math.floor(N_ORDERS * 0.8);
for (let i = 0; i < N_LEADS; i++) {
    const day = orderDay();
    const [city, state] = pick(CITIES);
    const converted = chance(0.35);
    const bats = chance(0.15) ? 2 : 1;
    const wa = chance(0.4) ? intBetween(1, 5) : 0;
    leads.push({
        firstName: pick(FIRST),
        lastName: chance(0.6) ? pick(LAST) : '',
        email: chance(0.5) ? `lead${intBetween(1, 9999)}@example.com` : '',
        phone: `${intBetween(6000000000, 9999999999)}`,
        countryCode: '+91',
        city, state, country: 'India',
        cartSummary: `${pick(PRODUCTS).name} x${bats}`,
        cartTotal: bats * pick(PRODUCTS).price,
        status: converted ? 'converted' : 'browsing',
        whatsappClicks: wa,
        lastWhatsAppSource: wa ? pick(['product_order', 'floating_button', 'footer', 'delivery_inquiry']) : '',
        visitorRef: `WS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        updatedAt: isoDaysAgo(day, intBetween(0, 23)),
    });
}

// ---- Reviews ----
const reviews = [];
const N_REVIEWS = Math.floor(N_ORDERS * 0.12);
for (let i = 0; i < N_REVIEWS; i++) {
    const p = pick(PRODUCTS);
    const [city] = pick(CITIES);
    // ratings skew high but not perfect
    const rating = chance(0.7) ? 5 : chance(0.7) ? 4 : intBetween(1, 3);
    reviews.push({
        productId: p.id,
        rating,
        text: pick(['Superb pickup and power.', 'Great willow, well knocked.', 'Value for money.', 'Middle is amazing.', 'Good but handle could be better.']),
        name: `${pick(FIRST)} ${pick(LAST)[0]}.`,
        city,
        status: chance(0.8) ? 'approved' : 'pending',
        userId: `u_${intBetween(1000, 1260)}`,
        createdAt: isoDaysAgo(Math.floor(rng() * DAYS)),
    });
}

// ---- Subscribers ----
const subscribers = [];
const N_SUBS = Math.floor(N_ORDERS * 1.5);
for (let i = 0; i < N_SUBS; i++) {
    subscribers.push({
        email: `sub${i}@example.com`,
        status: chance(0.95) ? 'active' : 'unsubscribed',
        subscribedAt: isoDaysAgo(Math.floor(rng() * DAYS)),
    });
}

// ---- Write NDJSON ----
const writeNdjson = (name, rows) => {
    const path = join(DATA_DIR, `${name}.ndjson`);
    writeFileSync(path, rows.map(r => JSON.stringify(r)).join('\n') + '\n');
    console.log(`  ${name.padEnd(12)} ${rows.length.toString().padStart(6)} rows → ${path}`);
};

console.log(`\nGenerating synthetic dataset (seed=42, ${N_ORDERS} orders, ${DAYS} days):`);
writeNdjson('orders', orders);
writeNdjson('leads', leads);
writeNdjson('reviews', reviews);
writeNdjson('subscribers', subscribers);
writeNdjson('events', events);
console.log('\nDone. Run:  node analytics/analyze.mjs\n');
