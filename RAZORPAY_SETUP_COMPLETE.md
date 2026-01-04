# ✅ Razorpay Integration - Setup Complete!

## 🎉 Status: READY FOR CONFIGURATION

Your Razorpay backend integration is complete! Now you just need to configure environment variables.

---

## 🔑 Your Razorpay Live Keys

✅ **Key ID:** `rzp_live_RzoBAX8SQwb6SQ`  
✅ **Key Secret:** `Y0dlH8YzGdxqlpZXLQPVbzME` ⚠️ KEEP SECRET!

---

## 📋 Next Steps: Set Up Environment Variables

### Step 1: Set Environment Variables in Vercel

1. **Go to Vercel Dashboard**
   - https://vercel.com/dashboard
   - Select your project: **Wular_sports**

2. **Navigate to Settings**
   - Click **Settings** tab
   - Click **Environment Variables** (left sidebar)

3. **Add These Variables:**

   #### Backend Variables (For API Functions):
   - **`RAZORPAY_KEY_ID`** = `rzp_live_RzoBAX8SQwb6SQ`
   - **`RAZORPAY_KEY_SECRET`** = `Y0dlH8YzGdxqlpZXLQPVbzME`
   
   **Environment:** Select all (Production, Preview, Development)

   #### Frontend Variables:
   - **`VITE_RAZORPAY_KEY_ID`** = `rzp_live_RzoBAX8SQwb6SQ`
   - **`VITE_RAZORPAY_BACKEND_URL`** = `https://your-project.vercel.app/api`
     *(Update this with your actual Vercel domain after deployment)*
   
   **Environment:** Select all (Production, Preview, Development)

4. **Save All Variables**
   - Click **Save** for each variable
   - Make sure they're enabled for the right environments

---

### Step 2: Deploy to Vercel

1. **Deploy your project:**
   ```bash
   vercel --prod
   ```
   
   OR use Vercel Dashboard:
   - Go to **Deployments** tab
   - Click **Deploy** (if needed)

2. **Get Your Vercel Domain:**
   - After deployment, copy your domain (e.g., `wular-sports.vercel.app`)
   - Update `VITE_RAZORPAY_BACKEND_URL` in Vercel:
     - Go back to **Settings** → **Environment Variables**
     - Edit `VITE_RAZORPAY_BACKEND_URL`
     - Set to: `https://your-domain.vercel.app/api`
     - Save and redeploy

---

### Step 3: Local Development Setup (Optional)

Create a `.env` file in your project root:

```env
# Razorpay Live Key (Public - Frontend)
VITE_RAZORPAY_KEY_ID=rzp_live_RzoBAX8SQwb6SQ

# Backend API URL (Update with your Vercel domain)
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

⚠️ **Note:** The `.env` file is already in `.gitignore` - never commit it!

---

## ✅ What's Already Done

### Backend API (Vercel Serverless Functions):
- ✅ `api/create-razorpay-order.js` - Creates orders on backend
- ✅ `api/verify-payment.js` - Verifies payment signatures
- ✅ `api/razorpay-webhook.js` - Handles payment status updates

### Frontend Integration:
- ✅ `src/services/razorpay.ts` - API service for backend calls
- ✅ `src/views/CheckoutView.tsx` - Updated with secure payment flow

### Configuration:
- ✅ `vercel.json` - Updated for API routes
- ✅ `package.json` - Added Razorpay dependency
- ✅ `.gitignore` - Updated to ignore `.env` files

### Security:
- ✅ Order creation on backend (secure)
- ✅ Payment signature verification (secure)
- ✅ Key Secret never exposed to frontend
- ✅ Webhook signature verification (secure)

---

## 🧪 Testing the Payment Flow

1. **Deploy to Vercel** (if not already deployed)

2. **Test Payment:**
   - Add items to cart
   - Go to checkout
   - Fill in shipping information
   - Select **"Online Payment (Razorpay)"**
   - Click **"PLACE ORDER"**
   - Complete payment in Razorpay modal

3. **Verify:**
   - Payment should complete successfully
   - Order should be created in Firebase
   - Email confirmation should be sent
   - Redirect to success page

---

## 🔍 Troubleshooting

### Issue: "Failed to create order"
- ✅ Check if `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are set in Vercel
- ✅ Verify keys are correct (no extra spaces)
- ✅ Check Vercel function logs: **Deployments** → **Function Logs**

### Issue: "Payment verification failed"
- ✅ Check if backend API is accessible
- ✅ Verify `VITE_RAZORPAY_BACKEND_URL` is correct in Vercel
- ✅ Check browser console for API errors

### Issue: "API endpoint not found"
- ✅ Verify `vercel.json` includes API routes configuration
- ✅ Check if API functions are in `api/` directory
- ✅ Ensure Vercel deployment includes API folder

---

## 📞 Support

If you encounter issues:
1. Check Vercel function logs: **Deployments** → **Function Logs**
2. Check browser console for errors
3. Verify all environment variables are set correctly
4. Test with Razorpay test mode first (if needed)

---

## ✅ Checklist

Before going live:
- [ ] Environment variables set in Vercel (Key ID, Key Secret, Backend URL)
- [ ] Project deployed to Vercel
- [ ] Backend URL updated with your Vercel domain
- [ ] Payment flow tested successfully
- [ ] Order creation verified in Firebase
- [ ] Email confirmation working
- [ ] Webhook configured (optional but recommended)

---

## 🎉 You're Ready!

Once you've set up the environment variables in Vercel and deployed, your Razorpay integration will be fully functional!

**Next:** Deploy to Vercel and test the payment flow! 🚀

