# Wular Sports — End-to-End E-Commerce Build & Growth Case Study

> A production e-commerce store for handcrafted Kashmiri willow cricket bats,
> built, deployed, and marketed end-to-end by a single person: product
> development, payments, security, data instrumentation, and paid acquisition.

**Live:** https://wularsports.com &nbsp;·&nbsp; **Role:** Solo founder / full-stack engineer / growth
&nbsp;·&nbsp; **Status:** Live, taking real orders

---

## 1. What this project is (the one-line version)

I designed, built, secured, deployed, and marketed a real revenue-generating
e-commerce business by myself — from the React/Next.js storefront and the
Razorpay payment backend to the Meta/GA4 conversion tracking and the paid
Instagram/Facebook ad campaigns that drive traffic to it.

This document is written for hiring managers. It explains **what I built, why
I made each decision, and what I learned** — with an honest account of trade-offs.

---

## 2. Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (React 19, TypeScript), CSS |
| Backend | Next.js API routes (Node) |
| Database | Firebase Firestore (NoSQL) |
| Auth | Firebase Auth — anonymous (guest), Google Sign-In, email/password |
| Payments | Razorpay (orders + server-side signature verification) |
| Hosting/CI | Vercel (Git-push deploys) |
| Analytics | Google Analytics 4, Google Tag Manager, Microsoft Clarity |
| Ad tracking | Meta Pixel + Conversions API (server-side, deduplicated) |
| Email | Google Apps Script bridge behind an authenticated server relay |

Project size: ~73 TypeScript/React files, 4 server API endpoints, 12 service modules.

---

## 3. Architecture (data & money flow)

```
                 ┌─────────────────────────── Browser (Next.js SPA) ───────────────────────────┐
                 │  Product pages · Cart · Checkout · Admin panel · Reviews · Exit-intent popup  │
                 └───────┬───────────────────────┬──────────────────────────┬──────────────────┘
                         │ writes (rules-guarded) │ payment                  │ events
                         ▼                        ▼                          ▼
                  ┌─────────────┐        ┌──────────────────┐        ┌───────────────┐
                  │  Firestore  │        │  Next.js API      │        │  GTM → GA4     │
                  │  orders     │◄───────┤  create-order     │        │  Meta Pixel   │
                  │  leads      │  admin │  verify-payment   │───────►│  Clarity      │
                  │  reviews    │  SDK   │  capi (CAPI)      │  server │               │
                  │  subscribers│        │  send-order-email │  events └───────────────┘
                  └─────────────┘        └────────┬─────────┘
                         ▲                         │
                         │ security rules          ▼
                  ┌─────────────┐          ┌──────────────┐
                  │ Firebase    │          │  Razorpay     │
                  │ Auth        │          │  (payments)   │
                  └─────────────┘          └──────────────┘
```

**Key principle: the client is never trusted with money or authorization.**
Order totals, coupon discounts, and payment verification all happen server-side
with the Firebase Admin SDK; the browser only *requests*.

---

## 4. Engineering decisions worth discussing in an interview

### 4.1 Payment integrity — "a paid order can never be lost"
- **Amount computed server-side** from an authoritative product catalog, so a
  tampered client can't change the price.
- **Razorpay signature verified with HMAC-SHA256** on the server before an order
  is trusted.
- **Order persisted server-side *before* the payment modal opens**, then marked
  `confirmed` by the verification endpoint. This eliminates the classic failure
  where the customer pays but a browser crash loses the order. *(This was a real
  bug I found and fixed — see the git history.)*

### 4.2 Security (Firestore rules as the real perimeter)
- ~300 lines of declarative security rules: per-collection field validation,
  type/length checks, timestamp freshness (anti-backdating), owner-only reads,
  admin-only writes, and query-limit caps to prevent mass scraping.
- Admin access gated by a verified owner email **and** enforced identically in
  both the UI and the database rules (defense in depth).
- API routes are authenticated (Firebase ID token) and rate-limited.

### 4.3 Frictionless, conversion-first checkout
- **Guest checkout by default** (silent anonymous auth) with *optional* account
  creation — after data showed forced Google sign-in was blocking buyers.
- International-aware validation (phone/postal formats switch by country).
- Server-validated coupon engine (discount recomputed on the server).

### 4.4 Conversion tracking done properly
- Meta **Pixel + Conversions API** fire the same `Purchase` event with a shared
  `event_id`, so Meta **deduplicates** browser and server events — the current
  best practice for accuracy under ad-blockers/iOS restrictions.
- Full funnel instrumented: `view_item → add_to_cart → begin_checkout → purchase`,
  plus custom events (WhatsApp clicks with reference codes, lead capture).

### 4.5 Growth features I designed and shipped
- Abandoned-checkout **lead capture** (saves partial forms as the user types).
- **WhatsApp attribution** — every pre-filled message carries a reference code,
  so off-site chat sales can be tied back to on-site behavior.
- **Reviews system** with moderation + schema.org markup for star ratings in
  Google results.
- **Exit-intent email capture** with a server-validated discount code.

---

## 5. The growth / marketing side (the rare part)

I didn't just build the store — I ran the acquisition:

- **Paid social:** Instagram/Facebook ad campaigns (₹500/day budget), managed in
  Meta Ads Manager.
- **Instrumentation for decisions:** GA4 + GTM + Clarity session recordings +
  Meta funnel. I can read a funnel and diagnose where drop-off happens.
- **A real diagnosis I made:** conversion tracking showed 16 checkouts but ~0
  purchases while the site required forced login — I identified the friction,
  removed it (guest checkout), and can measure the before/after. *This is the
  kind of instrumented decision-making the data/growth roles are actually about.*

---

## 6. What I learned / what I'd do next (honesty section)

Interviewers respect candidates who know their own gaps. Current limitations and
my roadmap:

- **Testing:** the project lacks an automated test suite. Next: add unit tests
  for the coupon/validation logic and an integration test for the payment flow.
- **Analytics → analysis:** I instrument data well but the next step is a proper
  analysis layer — export GA4/Firestore to **BigQuery**, build funnel + cohort +
  RFM analysis in SQL, and a Looker Studio dashboard.
- **Experimentation:** move from "ship and eyeball" to **A/B tests with
  statistical significance** (e.g. exit-popup lift).
- **Rate limiting** is in-memory (per-instance); production scale needs a shared
  store (Redis/Upstash).

---

## 7. Skills this project demonstrates (map to the JD)

- **Full-stack / SDE:** TypeScript, React/Next.js, REST API design, NoSQL data
  modeling, third-party payment integration, auth, security, CI/CD.
- **Growth / Analytics Engineering:** GTM, GA4, Meta Pixel + CAPI, event
  taxonomy design, funnel analysis, attribution, paid-ads operation.
- **Product / ownership:** shipped a real product end-to-end, made data-informed
  trade-offs, operated it with live customers.

---

## 8. How to navigate the code

- `pages/api/` — server endpoints (payments, CAPI, email relay)
- `src/services/` — data-access + integration layer (orders, auth, reviews, leads)
- `src/views/` + `src/components/` — UI
- `firestore.rules` — the security model (worth reading in a review)
- Git history — each feature and bug-fix is a descriptive commit
