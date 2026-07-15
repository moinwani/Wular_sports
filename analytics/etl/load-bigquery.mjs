#!/usr/bin/env node
/**
 * ETL — Load: push the exported NDJSON into BigQuery so the same SQL runs at
 * warehouse scale and can back a Looker Studio dashboard.
 *
 * Auth:  GOOGLE_APPLICATION_CREDENTIALS = path to a service-account key with
 *        BigQuery Data Editor + Job User roles.
 * Env:   BQ_DATASET (default: wular_analytics)
 *
 * Usage: node analytics/etl/load-bigquery.mjs
 *
 * (Requires `npm i @google-cloud/bigquery`. Kept out of the main app deps —
 *  this is an analyst-side tool, not part of the storefront bundle.)
 */
import { BigQuery } from '@google-cloud/bigquery';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const DATASET = process.env.BQ_DATASET || 'wular_analytics';
const TABLES = ['orders', 'leads', 'reviews', 'subscribers', 'events'];

const main = async () => {
    const bq = new BigQuery();
    const [dataset] = await bq.dataset(DATASET).get({ autoCreate: true });

    for (const t of TABLES) {
        const file = join(DATA_DIR, `${t}.ndjson`);
        if (!existsSync(file)) { console.log(`  skip ${t} (no file)`); continue; }
        await dataset.table(t).load(file, {
            sourceFormat: 'NEWLINE_DELIMITED_JSON',
            autodetect: true,
            writeDisposition: 'WRITE_TRUNCATE', // full refresh; swap for MERGE in prod
        });
        console.log(`  loaded ${DATASET}.${t}`);
    }
    console.log('\nLoad complete. The analytics/sql/*.sql queries run in BigQuery with minor dialect tweaks (see README).');
};

main().catch(e => { console.error('Load failed:', e.message); process.exit(1); });
