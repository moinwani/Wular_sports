# ⚠️ CRITICAL: Razorpay Backend Configuration Missing

## Problem Found

Your backend API is failing because it's missing the **server-side** Razorpay environment variables in Vercel.

The backend code (line 85-86 in `api/create-razorpay-order.js`) needs:
```javascript
process.env.RAZORPAY_KEY_ID
process.env.RAZORPAY_KEY_SECRET
```

These are **different** from the frontend variables (`VITE_RAZORPAY_KEY_ID`).

---

## Required Environment Variables in Vercel

You need to add **BOTH frontend and backend** environment variables to Vercel:

### Backend Variables (Server-side - NO VITE_ prefix):
```
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_SECRET_KEY
```

### Frontend Variables (Client-side - WITH VITE_ prefix):
```
VITE_RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID
VITE_RAZORPAY_BACKEND_URL=https://wularsports.com/api
```

### Other Frontend Variables:
```
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```

---

## How to Add in Vercel

### Step 1: Go to Vercel Dashboard
https://vercel.com/moinwani91-gmailcoms-projects/wular-sports/settings/environment-variables

### Step 2: Add Each Variable

For each variable above:
1. Click **"Add New"**
2. Enter the **Name** (e.g., `RAZORPAY_KEY_ID`)
3. Enter the **Value** (your actual key)
4. Select **all environments**: Production, Preview, Development
5. Click **"Save"**

### Step 3: Redeploy

After adding all variables:
1. Go to **Deployments** tab
2. Click the **"..."** menu on the latest deployment
3. Click **"Redeploy"**

---

## Local Development (.env.local)

For local development, add to your `.env.local` file:

```bash
# Frontend variables (VITE_ prefix)
VITE_RAZORPAY_KEY_ID=rzp_test_YOUR_KEY
VITE_RAZORPAY_BACKEND_URL=https://wularsports.com/api
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key

# Backend variables (NO VITE_ prefix - for local API testing)
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY
RAZORPAY_KEY_SECRET=YOUR_SECRET_KEY
```

---

## Security Note ⚠️

- **NEVER** commit `.env.local` to git
- **NEVER** share `RAZORPAY_KEY_SECRET` publicly
- The `VITE_` variables are safe to expose in frontend (they're public)
- The non-`VITE_` variables are server-side only (must stay secret)

---

## Test After Setup

After adding the variables and redeploying, test the payment:
1. Go to your site
2. Add items to cart
3. Checkout
4. Select "Online Payment"
5. Click "Place Order"

✅ Razorpay payment modal should now open!
