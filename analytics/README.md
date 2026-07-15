# Wular Sports — Analytics Pipeline

A small but complete **ETL → warehouse → SQL analysis → insights** pipeline over
the store's real data (orders, leads, reviews, subscribers, funnel events).
Demonstrates data-engineering and analytics-engineering skills end-to-end.

It runs two ways:
- **Locally with DuckDB** (zero setup, no cloud) — great for review/portfolio.
- **On BigQuery** — the same SQL at warehouse scale, feeding a Looker Studio dashboard.

```
analytics/
├── etl/
│   ├── export-firestore.mjs     # EXTRACT: live Firestore → data/*.ndjson
│   ├── generate-sample-data.mjs # reproducible synthetic data (seed=42)
│   └── load-bigquery.mjs        # LOAD: data/*.ndjson → BigQuery
├── sql/                         # 8 analyses (funnel, cohort, RFM, coupon, …)
├── analyze.mjs                  # runs the SQL pack in DuckDB, prints a report
├── FINDINGS.md                  # written-up insights (the "so what")
└── data/                        # generated NDJSON (git-ignored)
```

## Quick start (no credentials needed)

```bash
npm install @duckdb/node-api          # one dependency for local analysis
node analytics/etl/generate-sample-data.mjs
node analytics/analyze.mjs            # pretty report
node analytics/analyze.mjs --json     # machine-readable
```

## Run it on live data

```bash
# 1) Extract — needs the same service-account key the app uses
export FIREBASE_SERVICE_ACCOUNT="<base64 service-account json>"
node analytics/etl/export-firestore.mjs

# 2) Analyse locally
node analytics/analyze.mjs

# 3) …or load to BigQuery for scale + dashboards
npm install @google-cloud/bigquery
export GOOGLE_APPLICATION_CREDENTIALS=/path/key.json
node analytics/etl/load-bigquery.mjs
```

## The analyses (`sql/`)

| File | Question it answers |
|---|---|
| `01_revenue_kpis` | Real paid revenue, AOV, discount cost (excludes abandoned) |
| `02_funnel` | Where do visitors drop off, view → cart → checkout → purchase |
| `03_cohort_retention` | Do customers come back? Repeat rate & LTV by cohort |
| `04_rfm_segmentation` | Who are my Champions / At-Risk customers to target |
| `05_coupon_lift` | Is WELCOME100 creating demand or just discounting it |
| `06_channel_attribution` | Which acquisition source drives revenue |
| `07_leads_and_whatsapp` | Open follow-up pipeline & WhatsApp intent |
| `08_product_performance` | Units, revenue, and rating per product |

Findings from the sample dataset are written up in **[FINDINGS.md](./FINDINGS.md)**.

## DuckDB vs BigQuery dialect notes

The SQL targets DuckDB. For BigQuery, the handful of differences:
- `read_json_auto('file')` → a loaded table (the loader does this).
- `date_diff('day', a, b)` → `DATE_DIFF(b, a, DAY)`.
- `strftime(ts, '%Y-%m')` → `FORMAT_TIMESTAMP('%Y-%m', ts)`.
- `UNNEST(items) AS t(it)` → `UNNEST(items) AS it` (BigQuery implicit alias).
- `ANY_VALUE`, `NTILE`, `FILTER (WHERE …)` are supported in both.

## Design notes

- **NDJSON as the interchange format** — both DuckDB and BigQuery load it
  natively, and it preserves the nested `items` / `customerAddress` structures.
- **Timestamps normalized to ISO** at extract time so both engines parse them.
- **`WRITE_TRUNCATE`** for a simple full refresh; a production build would switch
  to incremental `MERGE` on document id.
- Revenue always **excludes `pending`** orders (abandoned checkouts) — treating
  them as revenue is the most common e-commerce analytics error.
