# 🔍 Why Do We Need 4 Environment Variables? - Explained

## 📊 Architecture Overview

Your application has **TWO parts** that work together:

1. **Frontend (React App)** - Runs in the user's browser
2. **Backend (Serverless Functions)** - Runs on Vercel's servers

Each part needs different information, which is why we need 4 variables.

---

## 🔐 Variable 1 & 2: Backend Variables (Server-Side)

### Variable 1: `RAZORPAY_KEY_ID`
### Variable 2: `RAZORPAY_KEY_SECRET`

**Used by:** Backend API functions (`api/create-razorpay-order.js`, `api/verify-payment.js`)

**Why:** 
- Your backend serverless functions need these to communicate with Razorpay's API
- The backend uses these to:
  - ✅ Create payment orders
  - ✅ Verify payment signatures
  - ✅ Secure operations (secret never exposed to frontend)

**Where:** Only accessible in your Vercel serverless functions (backend)

---

## 🌐 Variable 3: Frontend Key (Client-Side)

### Variable 3: `VITE_RAZORPAY_KEY_ID`

**Used by:** React app in the browser (`src/views/CheckoutView.tsx`)

**Why:**
- The Razorpay checkout modal needs the **public Key ID** to open
- When user clicks "Pay Now", your React code needs to know which Razorpay account to use
- This is **safe to expose** - it's a public key (like a username)

**Where:** Accessible in your React app (frontend/browser)

**Why separate from Variable 1?**
- Backend uses: `RAZORPAY_KEY_ID` (server-side)
- Frontend uses: `VITE_RAZORPAY_KEY_ID` (client-side)
- React can only access variables starting with `VITE_`
- Same value, but different access points

---

## 🔗 Variable 4: Backend API URL (Client-Side)

### Variable 4: `VITE_RAZORPAY_BACKEND_URL`

**Used by:** React app in the browser (`src/services/razorpay.ts`)

**Why:**
- Your React app needs to know **where to send API requests**
- When creating a payment order, the frontend calls: `VITE_RAZORPAY_BACKEND_URL/create-razorpay-order`
- This tells your app: "Send payment requests to this URL"

**Value for your site:**
Based on your screenshot, use:
```
https://wularsports.com/api
```
OR
```
https://www.wularsports.com/api
```

**Why not hardcode it?**
- Works across different environments (development, staging, production)
- Easy to change without code changes
- Can use different URLs for testing

---

## 📊 Visual Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    USER'S BROWSER                            │
│                                                               │
│  React App (Frontend)                                        │
│  ├─ Uses: VITE_RAZORPAY_KEY_ID                              │
│  │   └─ Opens Razorpay checkout modal                       │
│  │                                                            │
│  └─ Uses: VITE_RAZORPAY_BACKEND_URL                         │
│      └─ Sends request to: /api/create-razorpay-order ──┐   │
│                                                          │   │
└──────────────────────────────────────────────────────────┼───┘
                                                           │
                                                           ▼
┌─────────────────────────────────────────────────────────────┐
│              VERCEL SERVERS (Backend)                        │
│                                                               │
│  API Function: /api/create-razorpay-order                    │
│  ├─ Uses: RAZORPAY_KEY_ID                                   │
│  └─ Uses: RAZORPAY_KEY_SECRET                               │
│      └─ Creates order with Razorpay API ────► Razorpay     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Summary: Why Each Variable?

| Variable | Used By | Purpose | Safe to Expose? |
|----------|---------|---------|-----------------|
| `RAZORPAY_KEY_ID` | Backend | Create orders on Razorpay | ✅ Yes (but server-only) |
| `RAZORPAY_KEY_SECRET` | Backend | Verify payments securely | ❌ **NO** (server-only) |
| `VITE_RAZORPAY_KEY_ID` | Frontend | Open Razorpay checkout | ✅ Yes (public key) |
| `VITE_RAZORPAY_BACKEND_URL` | Frontend | Know where to send API requests | ✅ Yes (public URL) |

---

## 🔒 Security Logic

### Why Backend Variables (1 & 2)?
- **Secret is NEVER sent to browser** ✅
- All sensitive operations happen on server
- User can't see or steal your secret key

### Why Frontend Variables (3 & 4)?
- **Public information only** ✅
- Key ID is like a username (safe to show)
- Backend URL is public anyway
- No secrets exposed to browser

---

## 📝 For Your Specific Site

Based on your screenshot:

**Variable 4 Value:**
```
https://wularsports.com/api
```

This tells your React app: "When I need to create a payment, send the request to `https://wularsports.com/api/create-razorpay-order`"

---

## ❓ Common Questions

### Q: Can I use the same Key ID for both Variable 1 and 3?
**A:** Yes! They have the **same value**, but different names because:
- Variable 1: Backend uses it (server-side)
- Variable 3: Frontend uses it (client-side)
- React can only access variables starting with `VITE_`

### Q: Why not hardcode the backend URL?
**A:** Because:
- Development: `http://localhost:5173/api`
- Production: `https://wularsports.com/api`
- Environment variable makes it work everywhere

### Q: Is Variable 4 the same as my website URL?
**A:** Almost! It's your website URL + `/api`
- Website: `https://wularsports.com`
- Backend API: `https://wularsports.com/api`

---

## ✅ Quick Answer

- **Variable 1 & 2:** Backend needs these to talk to Razorpay (server-side secrets)
- **Variable 3:** Frontend needs the Key ID to open Razorpay checkout (public key)
- **Variable 4:** Frontend needs to know where your API is located (your website + `/api`)

All 4 are necessary for the payment flow to work! 🚀

---

**Last Updated:** 2024

