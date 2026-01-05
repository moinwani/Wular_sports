# 🔍 Razorpay Payment Debugging Guide

## Issue: Payment Gateway Not Opening

If the Razorpay checkout modal is not opening when you click "Place Order", follow these steps:

---

## ✅ Step 1: Check Browser Console

1. **Open Browser DevTools** (F12 or Right-click → Inspect)
2. **Go to Console tab**
3. **Try placing an order**
4. **Look for error messages** - You should see logs like:
   - `✅ Razorpay ready for payments`
   - `Creating Razorpay order for amount: [amount]`
   - `Razorpay order created: [order details]`
   - `Opening Razorpay checkout with order ID: [order_id]`
   - `Attempting to open Razorpay checkout modal...`

### Common Error Messages:

#### ❌ "Razorpay Key ID not configured"
**Solution:** Check your `.env` file and Vercel environment variables
- Make sure `VITE_RAZORPAY_KEY_ID` is set
- In Vercel: Go to Settings → Environment Variables
- Verify the key starts with `rzp_live_` or `rzp_test_`

#### ❌ "Payment gateway failed to load"
**Solution:** 
- Check your internet connection
- Verify you can access `https://checkout.razorpay.com`
- Try refreshing the page

#### ❌ "Failed to create payment order"
**Solution:**
- Check if backend API is working
- Verify `VITE_RAZORPAY_BACKEND_URL` is set correctly
- Check Vercel logs for API errors

---

## ✅ Step 2: Check Network Tab

1. **Open Browser DevTools** → **Network tab**
2. **Try placing an order**
3. **Look for these requests:**
   - `POST /api/create-razorpay-order` - Should return 200 with order details
   - `GET https://checkout.razorpay.com/v1/checkout.js` - Should return 200

### If `/api/create-razorpay-order` fails:
- Check if the backend environment variables are set in Vercel:
  - `RAZORPAY_KEY_ID`
  - `RAZORPAY_KEY_SECRET`
- Check Vercel function logs for errors

---

## ✅ Step 3: Verify Environment Variables

### Local Development (`.env` file):
```env
VITE_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
VITE_RAZORPAY_BACKEND_URL=http://localhost:5173/api
```

### Production (Vercel):
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify these variables are set:
   - `VITE_RAZORPAY_KEY_ID` (for frontend)
   - `RAZORPAY_KEY_ID` (for backend)
   - `RAZORPAY_KEY_SECRET` (for backend)
   - `VITE_RAZORPAY_BACKEND_URL` (should be your Vercel URL + `/api`)

---

## ✅ Step 4: Test Backend API Directly

1. **Open Browser Console**
2. **Run this test:**

```javascript
fetch('/api/create-razorpay-order', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: 100,
    currency: 'INR',
    receipt: 'test_receipt_123'
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

**Expected Response:**
```json
{
  "id": "order_xxxxx",
  "amount": 10000,
  "currency": "INR",
  "status": "created"
}
```

**If this fails:**
- Backend API is not working
- Check Vercel function logs
- Verify environment variables in Vercel

---

## ✅ Step 5: Check Razorpay Dashboard

1. **Go to:** https://dashboard.razorpay.com
2. **Check:** Settings → API Keys
3. **Verify:** Your Key ID matches the one in environment variables
4. **Check:** Orders section - See if orders are being created

---

## ✅ Step 6: Common Fixes

### Fix 1: Clear Browser Cache
- Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Or clear browser cache completely

### Fix 2: Check Ad Blockers
- Disable ad blockers (they might block Razorpay scripts)
- Try in incognito/private mode

### Fix 3: Check Browser Console for Errors
- Look for JavaScript errors
- Look for CORS errors
- Look for network errors

### Fix 4: Verify Payment Method Selection
- Make sure "Online Payment" is selected (not COD)
- Check if the payment method radio button is working

---

## 🐛 Debugging Checklist

- [ ] Browser console shows "✅ Razorpay ready for payments"
- [ ] Network tab shows `checkout.js` loaded successfully
- [ ] Network tab shows `/api/create-razorpay-order` returns 200
- [ ] Environment variables are set correctly
- [ ] No JavaScript errors in console
- [ ] No CORS errors
- [ ] Ad blockers are disabled
- [ ] "Online Payment" is selected
- [ ] Form validation passes

---

## 📞 Still Not Working?

If the issue persists after checking all above:

1. **Share these details:**
   - Browser console errors (screenshot)
   - Network tab errors (screenshot)
   - What happens when you click "Place Order"?
   - Does the form submit?
   - Does the "Processing..." state show?

2. **Check Vercel Logs:**
   - Go to Vercel Dashboard → Your Project → Functions
   - Check logs for `/api/create-razorpay-order`
   - Look for any errors

3. **Test with a test key:**
   - Try using Razorpay test keys to see if it's a key issue
   - Test keys: Get from Razorpay Dashboard → Settings → API Keys → Test Mode

---

## ✅ Expected Flow

1. User fills checkout form
2. User selects "Online Payment"
3. User clicks "Place Order"
4. Form validates
5. Order created in Firebase
6. Backend creates Razorpay order
7. Razorpay checkout modal opens
8. User completes payment
9. Payment verified on backend
10. Order status updated
11. Success page shown

If step 7 (Razorpay modal opening) is failing, check steps 1-6 first!

---

**Last Updated:** 2024

