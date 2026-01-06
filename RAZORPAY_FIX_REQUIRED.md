# RAZORPAY PAYMENT FIX - Action Required

## Problem
The payment is getting stuck on "PROCESSING..." because the backend API URL is not configured.

## Solution

### Step 1: Add Backend URL to `.env.local`

You need to add the following line to your `.env.local` file:

```bash
VITE_RAZORPAY_BACKEND_URL=https://wular-sports.vercel.app/api
```

**Note:** Replace `wular-sports` with your actual Vercel app name if different.

### Step 2: Verify Your `.env.local` File

Your `.env.local` file should look something like this:

```bash
# Firebase
VITE_FIREBASE_API_KEY=your-actual-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef

# Razorpay
VITE_RAZORPAY_KEY_ID=rzp_test_YOUR_ACTUAL_KEY
VITE_RAZORPAY_BACKEND_URL=https://wular-sports.vercel.app/api

# EmailJS
VITE_EMAILJS_SERVICE_ID=service_YOUR_ID
VITE_EMAILJS_TEMPLATE_ID=template_YOUR_ID
VITE_EMAILJS_PUBLIC_KEY=YOUR_PUBLIC_KEY
```

### Step 3: Restart Dev Server

After adding the backend URL:
1. Stop your dev server (`Ctrl+C` in the terminal)
2. Start it again: `npm run dev`

### Step 4: Test the Payment

1. Add items to cart
2. Go to checkout
3. Fill in the form
4. Select "Online Payment (Razorpay)"
5. Click "Place Order"

**You should now see:**
- Console logs about Razorpay loading
- The Razorpay payment modal opening

## Alternative: For Local Development Only

If you want to test locally without the backend, you can temporarily disable online payments or use Cash on Delivery (COD) which doesn't require the backend API.

## Vercel Deployment

Don't forget to also add `VITE_RAZORPAY_BACKEND_URL` to your Vercel environment variables:

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add: `VITE_RAZORPAY_BACKEND_URL` = `https://wular-sports.vercel.app/api`
5. Redeploy your app

---

**What's your Vercel app URL?** I need it to give you the exact configuration.
