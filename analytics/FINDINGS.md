# Analytics Findings — Wular Sports

> **Note on data:** the numbers below are from the **synthetic sample dataset**
> (`generate-sample-data.mjs`, seed=42) so the analysis is reproducible by anyone
> cloning the repo. Running `export-firestore.mjs` against live Firestore and
> re-running `analyze.mjs` reproduces this exact report on real data.
>
> Reproduce: `node analytics/etl/generate-sample-data.mjs && node analytics/analyze.mjs`

---

## Executive summary

- **₹11.16L paid revenue** across **317 paid orders** (AOV **₹3,521**) from **189
  unique customers** — a healthy **1.68 orders/customer**, so repeat business is
  already a meaningful revenue driver.
- **Biggest leak: the cart step.** Only **47%** of product-viewers add to cart,
  and **61 checkouts were abandoned** (16% of all orders started). Recovering
  even a third of those is ~₹70K.
- **WhatsApp is the best channel** — highest visitor→order rate (**13.6%**) *and*
  highest revenue (₹2.72L). This validates leaning into click-to-WhatsApp ads.
- **The coupon is likely discounting existing demand, not creating new demand**
  (see Coupon section) — worth an A/B test before scaling it.

---

## 1. Funnel — where visitors drop off

| Step | Users | % of visitors | Step conversion |
|---|---|---|---|
| Visitors | 2,766 | 100% | — |
| Viewed product | 1,423 | 51.4% | 51.4% |
| Added to cart | 675 | 24.4% | **47.4%** ← biggest drop |
| Began checkout | 539 | 19.5% | 79.9% |
| Purchased | 339 | 12.3% | 62.9% |

**Insight:** checkout-to-purchase (63%) and cart-to-checkout (80%) are healthy.
The weak link is **view→cart (47%)** — a product-page problem (price, trust,
images, or CTA), not a checkout problem. **Action:** this is exactly where the
reviews and trust badges should lift numbers; measure view→cart before/after.

## 2. Retention (cohorts)

Repeat-purchase rate is strong for older cohorts (54–66%) and naturally lower
for the newest cohort (still mid-funnel). Average LTV ₹4.8K–₹10K.
**Action:** a post-delivery flow (review request + "restock/refer" offer) should
push new cohorts toward the older cohorts' repeat rate.

## 3. RFM segments (who to target)

| Segment | Customers | Avg orders | Avg spend | Play |
|---|---|---|---|---|
| Champions | 53 | 2.6 | ₹9,286 | Referral asks, early access |
| At Risk / Lapsed | 48 | 1.3 | ₹4,544 | Win-back WhatsApp + coupon |
| Needs Attention | 47 | 1.6 | ₹5,426 | Reminder nudges |
| Loyal | 29 | 1.1 | ₹3,813 | Upsell accessories |
| New / Promising | 12 | 1.0 | ₹3,357 | Onboard, 2nd-order nudge |

**Action:** the 48 "At Risk" customers are the cheapest revenue to recover —
they already bought once. Target them first.

## 4. Coupon (WELCOME100) impact

| Segment | Orders | AOV | Avg cart (pre-discount) | Discount cost |
|---|---|---|---|---|
| No coupon | 233 (73.5%) | ₹3,550 | ₹3,550 | ₹0 |
| With coupon | 84 (26.5%) | ₹3,441 | ₹3,554 | ₹9,500 |

**Insight:** pre-discount cart sizes are **identical** (₹3,550 vs ₹3,554), so the
coupon isn't making people buy more — it's mostly a margin giveaway on orders
that looked the same anyway. **Recommendation:** run a proper **A/B test**
(coupon vs none) and keep it only if it lifts *conversion rate*, not just margin.

## 5. Channel attribution

| Source | Visitors | Paid orders | Revenue | Visitor→order |
|---|---|---|---|---|
| whatsapp | 558 | 76 | ₹2.72L | **13.6%** |
| facebook_ad | 549 | 64 | ₹2.37L | 11.7% |
| organic | 584 | 64 | ₹2.32L | 11.0% |
| instagram_ad | 552 | 59 | ₹2.04L | 10.7% |
| direct | 550 | 54 | ₹1.70L | 9.8% |

**Action:** WhatsApp converts best — shift more budget to click-to-WhatsApp ads
and keep the Ref-code attribution running to confirm it holds on live data.

## 6. Lead capture + WhatsApp pipeline

- 320 leads captured, **39.7% converted**, **193 reachable open leads** still to
  follow up, representing **₹6.9L of open pipeline value**.
- 118 leads tapped WhatsApp (avg 2.9 taps when engaged) — high intent to chat.

**Action:** working the open-lead list daily is the single highest-ROI operational
habit; the pipeline value dwarfs the ad budget.

## 7. Product performance

Legacy Edition 2.0 leads on revenue (₹3.71L) despite Legacy 1.0 having the best
rating (4.8). Bahubali has the weakest rating (4.17) — investigate before
promoting it.

---

## What I'd do next (analyst roadmap)

1. **Instrument true CPA** by joining ad-platform spend to the `source` column.
2. **A/B test** the coupon and exit-popup with a two-proportion z-test.
3. **Predictive:** a simple churn/repeat-purchase model on the RFM features.
4. **Automate:** schedule the ETL (cron/Cloud Function) → BigQuery → Looker Studio
   so this refreshes daily instead of on demand.
