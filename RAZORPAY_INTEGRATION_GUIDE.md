# Razorpay Backend Integration - Complete Setup Guide

## 🎯 Overview

This guide will help you set up a secure Razorpay payment integration with backend verification. The integration includes:

- ✅ Secure order creation on backend
- ✅ Payment signature verification
- ✅ Webhook support for payment status updates
- ✅ Proper error handling

---

## 📋 What You Need from Razorpay

### 1. **Razorpay Key ID** (Public Key)
- **Location:** Razorpay Dashboard → Settings → API Keys
- **Starts with:** `rzp_test_` (Test) or `rzp_live_` (Production)
- **Used in:** Frontend (.env file)
- **Example:** `rzp_test_1234567890abcdef`

### 2. **Razorpay Key Secret** (Private Key - KEEP SECRET!)
- **Location:** Razorpay Dashboard → Settings → API Keys
- **Starts with:** `rzp_test_` (Test) or `rzp_live_` (Production)
- **Used in:** Backend ONLY (Vercel Environment Variables)
- **Example:** `rzp_test_abcdef1234567890`

### 3. **Webhook Secret** (Optional but Recommended)
- **Location:** Razorpay Dashboard → Settings → Webhooks
- **Used in:** Backend for webhook signature verification
- **Generate one if you haven't already**

---

## 🚀 Setup Steps

### Step 1: Get Your Razorpay Keys

1. **Log in to Razorpay Dashboard**
   - Go to: https://dashboard.razorpay.com/

2. **Navigate to API Keys**
   - Click **Settings** → **API Keys**

3. **Get Your Keys**
   - If you don't have keys: Click **Generate Key**
   - If you have keys: View them (you may need to regenerate secret)

4. **Copy Your Keys**
   - Copy **Key ID** (Public Key)
   - Copy **Key Secret** (Private Key) - **Save securely!**

---

### Step 2: Install Dependencies

```bash
npm install razorpay
```

The `razorpay` package is already added to `package.json` for backend use.

---

### Step 3: Set Up Environment Variables

#### Frontend Environment Variables (`.env` file)

Create a `.env` file in your project root:

```env
# Razorpay Public Key (Frontend)
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx

# Backend API URL (Change to your Vercel domain after deployment)
VITE_RAZORPAY_BACKEND_URL=https://your-domain.vercel.app/api

# Other environment variables...
```

#### Backend Environment Variables (Vercel Dashboard)

1. Go to your **Vercel Project Dashboard**
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=rzp_test_abcdef1234567890
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here (optional)
```

**Important:**
- ✅ Use **Test keys** for development (`rzp_test_...`)
- ✅ Use **Live keys** for production (`rzp_live_...`)
- ✅ Never commit secrets to Git!

---

### Step 4: Deploy to Vercel

1. **Install Vercel CLI** (if not already installed)
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

3. **Set Environment Variables in Vercel Dashboard**
   - Go to your project → Settings → Environment Variables
   - Add the backend environment variables from Step 3

4. **Update Frontend `.env`**
   - After deployment, update `VITE_RAZORPAY_BACKEND_URL` with your Vercel domain:
   ```env
   VITE_RAZORPAY_BACKEND_URL=https://your-project.vercel.app/api
   ```

---

### Step 5: Set Up Webhook (Optional but Recommended)

1. **In Razorpay Dashboard:**
   - Go to **Settings** → **Webhooks**
   - Click **Add New Webhook**

2. **Webhook URL:**
   ```
   https://your-domain.vercel.app/api/razorpay-webhook
   ```

3. **Select Events:**
   - ✅ `payment.captured`
   - ✅ `payment.failed`
   - ✅ `order.paid`

4. **Copy Webhook Secret:**
   - Copy the webhook secret
   - Add it to Vercel environment variables as `RAZORPAY_WEBHOOK_SECRET`

---

## 📁 Files Created

### Backend API (Serverless Functions)

1. **`api/create-razorpay-order.js`**
   - Creates Razorpay orders on backend
   - Returns order ID for frontend

2. **`api/verify-payment.js`**
   - Verifies payment signatures
   - Ensures payments are authentic

3. **`api/razorpay-webhook.js`**
   - Handles payment status updates from Razorpay
   - Updates your database automatically

### Frontend Services

4. **`src/services/razorpay.ts`**
   - API service for communicating with backend
   - Handles order creation and payment verification

### Updated Files

5. **`src/views/CheckoutView.tsx`**
   - Updated to use secure backend API
   - Proper payment flow with verification

---

## 🔒 Security Features

- ✅ **Order Creation on Backend:** Orders are created server-side (secure)
- ✅ **Signature Verification:** Payments are verified before marking as complete
- ✅ **Secret Key Protection:** Key Secret never exposed to frontend
- ✅ **Webhook Verification:** Webhook signatures are verified

---

## 🧪 Testing

### Test Mode

1. **Use Test Keys**
   - Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` with test keys

2. **Test Cards:**
   - Success: `4111 1111 1111 1111`
   - Failure: `4000 0000 0000 0002`

3. **Test the Flow:**
   - Add items to cart
   - Go to checkout
   - Select "Online Payment"
   - Use test card details
   - Verify payment processes correctly

### Production Mode

1. **Switch to Live Keys**
   - Update environment variables with live keys
   - Ensure webhook is configured
   - Test with small amount first

---

## 🐛 Troubleshooting

### Issue: "Failed to create order"
- ✅ Check if `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are set in Vercel
- ✅ Verify keys are correct (no extra spaces)
- ✅ Check Vercel function logs

### Issue: "Payment verification failed"
- ✅ Check if backend API is accessible
- ✅ Verify `VITE_RAZORPAY_BACKEND_URL` is correct
- ✅ Check network tab for API errors

### Issue: "Webhook not receiving events"
- ✅ Verify webhook URL is correct
- ✅ Check if `RAZORPAY_WEBHOOK_SECRET` is set
- ✅ Verify webhook events are enabled in Razorpay dashboard

---

## 📞 Support

If you need help:
1. Check Vercel function logs
2. Check browser console for errors
3. Verify all environment variables are set
4. Test with Razorpay test mode first

---

## ✅ Checklist

- [ ] Razorpay account created
- [ ] API Keys generated (Test and Live)
- [ ] Frontend `.env` file created with `VITE_RAZORPAY_KEY_ID`
- [ ] Vercel environment variables set (Key ID, Key Secret, Webhook Secret)
- [ ] Dependencies installed (`npm install`)
- [ ] Backend API deployed to Vercel
- [ ] Webhook configured (optional)
- [ ] Test payment successful
- [ ] Production keys configured (when ready)

---

## 🎉 You're All Set!

Your Razorpay integration is now secure and ready for production!

