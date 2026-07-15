#!/usr/bin/env node
/**
 * ETL — Extract: pull live collections from Firestore and write NDJSON that the
 * analysis pack (analytics/analyze.mjs) and the BigQuery loader both consume.
 *
 * Auth: needs a service-account key. Set ONE of:
 *   FIREBASE_SERVICE_ACCOUNT        (base64-encoded JSON)   — same var the app uses
 *   GOOGLE_APPLICATION_CREDENTIALS  (path to key file)
 *
 * Usage:  node analytics/etl/export-firestore.mjs
 *
 * Note: Firestore has no `source` field on orders (that's inferred from GA4/UTM
 * in a real warehouse). The export leaves it null; the sample generator adds it
 * so channel attribution can be demonstrated.
 */
import admin from 'firebase-admin';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
mkdirSync(DATA_DIR, { recursive: true });

const COLLECTIONS = ['orders', 'leads', 'reviews', 'subscribers'];

function credentials() {
    const b64 = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (b64) return admin.credential.cert(JSON.parse(Buffer.from(b64, 'base64').toString('utf-8')));
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) return admin.credential.applicationDefault();
    throw new Error('Set FIREBASE_SERVICE_ACCOUNT (base64) or GOOGLE_APPLICATION_CREDENTIALS (path).');
}

// Recursively convert Firestore Timestamps to ISO strings so DuckDB/BigQuery
// can parse them as TIMESTAMP.
const normalize = (v) => {
    if (v && typeof v.toDate === 'function') return v.toDate().toISOString();
    if (Array.isArray(v)) return v.map(normalize);
    if (v && typeof v === 'object') {
        const o = {};
        for (const [k, val] of Object.entries(v)) o[k] = normalize(val);
        return o;
    }
    return v;
};

const main = async () => {
    admin.initializeApp({ credential: credentials() });
    const db = admin.firestore();

    for (const name of COLLECTIONS) {
        const snap = await db.collection(name).get();
        const rows = snap.docs.map(d => normalize({ id: d.id, ...d.data() }));
        const path = join(DATA_DIR, `${name}.ndjson`);
        writeFileSync(path, rows.map(r => JSON.stringify(r)).join('\n') + (rows.length ? '\n' : ''));
        console.log(`  ${name.padEnd(12)} ${String(rows.length).padStart(6)} docs → ${path}`);
    }
    console.log('\nExtract complete. Next:  node analytics/analyze.mjs');
    process.exit(0);
};

main().catch(e => { console.error('Export failed:', e.message); process.exit(1); });
