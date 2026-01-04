# Environment Variables Setup - Razorpay Live Keys

## ✅ Your Razorpay Live Keys

⚠️ **IMPORTANT:** Replace these with your actual keys from Razorpay Dashboard

- **Key ID (Public):** `rzp_live_xxxxxxxxxxxxx` (Get from Razorpay Dashboard)
- **Key Secret (Private):** `xxxxxxxxxxxxx` ⚠️ KEEP SECRET! (Get from Razorpay Dashboard)

---

## 📝 Step 1: Frontend Environment Variables (Local)

Create a `.env` file in your project root with:

```env
# Razorpay Live Key (Public - Frontend)
# Replace with your actual Key ID from Razorpay Dashboard
VITE_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx

# Backend API URL (Update after Vercel deployment)
VITE_RAZORPAY_BACKEND_URL=https://your-project.vercel.app/api

# Your existing Firebase variables...
VITE_FIREBASE_API_KEY=your-firebase-key
VITE_FIREBASE_AUTH_DOMAIN=your-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Your existing EmailJS variables...
VITE_EMAILJS_SERVICE_ID=your-service-id
VITE_EMAILJS_TEMPLATE_ID=your-template-id
VITE_EMAILJS_PUBLIC_KEY=your-public-key
```

⚠️ **Important:** The `.env` file is gitignored - never commit secrets!

---

## 🌐 Step 2: Backend Environment Variables (Vercel)

Go to your **Vercel Dashboard** → **Project** → **Settings** → **Environment Variables**

Add these variables:

### Production Environment:

```env
# Replace with your actual keys from Razorpay Dashboard
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxx
```

### Preview Environment (Optional - for testing):

```env
# Replace with your actual keys from Razorpay Dashboard
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxx
```

### Development Environment (Optional - for local testing):

```env
# Replace with your actual keys from Razorpay Dashboard
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxx
```

---

## 📋 Step 3: Update Frontend Backend URL

After deploying to Vercel:

1. **Get your Vercel domain** (e.g., `wular-sports.vercel.app`)
2. **Update `.env` file**:
   ```env
   VITE_RAZORPAY_BACKEND_URL=https://wular-sports.vercel.app/api
   ```
3. **Or set it in Vercel** as an environment variable:
   ```env
   VITE_RAZORPAY_BACKEND_URL=https://your-domain.vercel.app/api
   ```

---

## ✅ Step 4: Verify Setup

1. **Check Vercel Environment Variables:**
   - ✅ `RAZORPAY_KEY_ID` is set
   - ✅ `RAZORPAY_KEY_SECRET` is set

2. **Check Local `.env` file:**
   - ✅ `VITE_RAZORPAY_KEY_ID` is set
   - ✅ `VITE_RAZORPAY_BACKEND_URL` is set (after deployment)

3. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```

4. **Test Payment:**
   - Add items to cart
   - Go to checkout
   - Select "Online Payment"
   - Test with a real card (small amount)

---

## 🔒 Security Notes

- ✅ **Key Secret is set in Vercel only** (backend - secure)
- ✅ **Key ID is set in `.env`** (frontend - public)
- ✅ **`.env` file is gitignored** (never committed)
- ✅ **All API calls go through backend** (secure)

---

## 🚀 Ready to Deploy!

Once you've set up the environment variables:
1. Deploy to Vercel
2. Update `VITE_RAZORPAY_BACKEND_URL` with your Vercel domain
3. Test the payment flow

Your Razorpay integration is now ready for production! 🎉

