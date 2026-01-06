# Fix: Add Backend URL to Environment Variables

## Your Configuration

Based on your Vercel deployment, your backend API URL is:

```
https://wularsports.com/api
```

---

## Step 1: Update `.env.local`

Open your `.env.local` file and add this line:

```bash
VITE_RAZORPAY_BACKEND_URL=https://wularsports.com/api
```

**Complete `.env.local` example:**
```bash
# Firebase (your existing values)
VITE_FIREBASE_API_KEY=your-actual-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-bucket.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id

# Razorpay
VITE_RAZORPAY_KEY_ID=rzp_test_YOUR_KEY
VITE_RAZORPAY_BACKEND_URL=https://wularsports.com/api

# EmailJS (your existing values)
VITE_EMAILJS_SERVICE_ID=service_YOUR_ID
VITE_EMAILJS_TEMPLATE_ID=template_YOUR_ID
VITE_EMAILJS_PUBLIC_KEY=YOUR_KEY
```

---

## Step 2: Restart Dev Server

1. Stop your current dev server (Ctrl+C in terminal)
2. Restart it:
   ```bash
   npm run dev
   ```

---

## Step 3: Add to Vercel Environment Variables

Go to: https://vercel.com/moinwani91-gmailcoms-projects/wular-sports/settings/environment-variables

Add:
- **Key:** `VITE_RAZORPAY_BACKEND_URL`
- **Value:** `https://wularsports.com/api`
- **Environment:** Production, Preview, Development (select all)

Then redeploy your app.

---

## Step 4: Test

After completing steps 1-2:
1. Go to your local site
2. Add items to cart
3. Go to checkout
4. Fill the form
5. Select "Online Payment"
6. Click "Place Order"

✅ You should now see Razorpay loading and the payment modal opening!
