#!/usr/bin/env node
/**
 * Runs the SQL analysis pack against the exported NDJSON using DuckDB
 * (in-process — no server, no cloud). Reads whatever is in analytics/data/,
 * whether that came from the sample generator or a live Firestore export.
 *
 * Usage:
 *   node analytics/etl/generate-sample-data.mjs   # or export-firestore.mjs
 *   node analytics/analyze.mjs                     # pretty report
 *   node analytics/analyze.mjs --json > out.json   # machine-readable
 */
import { DuckDBInstance } from '@duckdb/node-api';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');
const SQL_DIR = join(__dirname, 'sql');
const asJson = process.argv.includes('--json');

const TABLES = ['orders', 'leads', 'reviews', 'subscribers', 'events'];

if (!existsSync(join(DATA_DIR, 'orders.ndjson'))) {
    console.error('No data found. Run:  node analytics/etl/generate-sample-data.mjs');
    process.exit(1);
}

const printTable = (rows) => {
    if (!rows.length) { console.log('   (no rows)'); return; }
    const cols = Object.keys(rows[0]);
    const widths = cols.map(c => Math.max(c.length, ...rows.map(r => String(r[c] ?? '').length)));
    const line = (cells) => '   ' + cells.map((v, i) => String(v ?? '').padEnd(widths[i])).join('  ');
    console.log(line(cols));
    console.log(line(widths.map(w => '─'.repeat(w))));
    rows.forEach(r => console.log(line(cols.map(c => r[c]))));
};

const main = async () => {
    const instance = await DuckDBInstance.create(':memory:');
    const conn = await instance.connect();

    // Register each NDJSON file as a view
    for (const t of TABLES) {
        const path = join(DATA_DIR, `${t}.ndjson`).replace(/\\/g, '/');
        if (existsSync(path)) {
            await conn.run(`CREATE VIEW ${t} AS SELECT * FROM read_json_auto('${path}')`);
        }
    }

    const files = readdirSync(SQL_DIR).filter(f => f.endsWith('.sql')).sort();
    const out = {};

    for (const f of files) {
        const sql = readFileSync(join(SQL_DIR, f), 'utf-8');
        const title = (sql.match(/^--\s*(.+)/)?.[1] || f).trim();
        // strip pure-comment lines so the runner executes one statement
        const reader = await conn.runAndReadAll(sql);
        const rows = reader.getRowObjects().map(r => {
            const o = {};
            for (const [k, v] of Object.entries(r)) o[k] = typeof v === 'bigint' ? Number(v) : v;
            return o;
        });
        out[f] = { title, rows };

        if (!asJson) {
            console.log(`\n\x1b[1m\x1b[33m${title}\x1b[0m`);
            printTable(rows);
        }
    }

    if (asJson) console.log(JSON.stringify(out, null, 2));
    else console.log('\n');
};

main().catch(e => { console.error(e); process.exit(1); });
