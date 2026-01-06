# 🔧 Payment Troubleshooting - Step by Step

## Issue: Payment Stuck on "PROCESSING..."

If your payment is stuck on "PROCESSING..." and Razorpay modal doesn't open, follow these steps:

---

## ✅ Step 1: Check Browser Console

1. **Open your website** in browser
2. **Press F12** (or Right-click → Inspect)
3. **Go to Console tab**
4. **Try to place an order** with Online Payment
5. **Look for error messages** in red

### What to Look For:

#### ✅ Good Signs (Should See):
```
✅ Razorpay ready for payments
🚀 Creating Razorpay order: {...}
📡 Razorpay order response status: 200
✅ Razorpay order created successfully: {...}
Attempting to open Razorpay checkout modal...
✅ Razorpay checkout modal opened successfully
```

#### ❌ Bad Signs (Errors):
```
❌ Razorpay Key ID not configured
❌ Network error: Cannot reach payment server
❌ Failed to create order (404)
❌ Failed to create order (500)
❌ Request timeout
```

---

## ✅ Step 2: Test Backend API Directly

1. **Open a new browser tab**
2. **Go to:** `https://wularsports.com/api/create-razorpay-order`
   - Should show an error (POST required), NOT 404
   - If 404: Backend URL is wrong

3. **Or test with curl** (in terminal):
```bash
curl -X POST https://wularsports.com/api/create-razorpay-order \
  -H "Content-Type: application/json" \
  -d '{"amount":100,"currency":"INR"}'
```

**Expected:** Should return JSON (either success or error), NOT 404

---

## ✅ Step 3: Check Environment Variables

### In Browser Console (on your website):
```javascript
console.log('Backend URL:', import.meta.env.VITE_RAZORPAY_BACKEND_URL);
console.log('Key ID:', import.meta.env.VITE_RAZORPAY_KEY_ID);
```

**Expected:**
- Backend URL: `https://wularsports.com/api` (NOT `undefined`)
- Key ID: `rzp_live_...` (NOT `undefined`)

**If undefined:**
- Variables not set in Vercel
- Or not redeployed after setting

---

## ✅ Step 4: Check Vercel Function Logs

1. **Go to Vercel Dashboard**
2. **Your Project → Functions tab**
3. **Click on `/api/create-razorpay-order`**
4. **Check logs** for errors

### Common Errors:

#### Error: "RAZORPAY_KEY_ID is not defined"
**Fix:** Set `RAZORPAY_KEY_ID` in Vercel environment variables

#### Error: "RAZORPAY_KEY_SECRET is not defined"
**Fix:** Set `RAZORPAY_KEY_SECRET` in Vercel environment variables

#### Error: "Invalid credentials"
**Fix:** Check if keys are correct in Razorpay dashboard

---

## ✅ Step 5: Verify Razorpay Keys

1. **Go to:** https://dashboard.razorpay.com
2. **Settings → API Keys**
3. **Verify:**
   - Key ID matches `VITE_RAZORPAY_KEY_ID` in Vercel
   - Key Secret matches `RAZORPAY_KEY_SECRET` in Vercel
   - Keys are **Live** (not Test)

---

## ✅ Step 6: Quick Fixes

### Fix 1: Clear Browser Cache
- Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Or clear browser cache completely

### Fix 2: Disable Ad Blockers
- Ad blockers might block Razorpay scripts
- Try in incognito/private mode

### Fix 3: Check Network Tab
1. **F12 → Network tab**
2. **Try payment**
3. **Look for:**
   - `create-razorpay-order` request
   - Status: Should be 200 (not 404, 500, or failed)
   - Response: Should have order data

---

## 🐛 Common Issues & Solutions

### Issue 1: "Backend URL is undefined"
**Solution:**
1. Go to Vercel → Settings → Environment Variables
2. Set `VITE_RAZORPAY_BACKEND_URL` = `https://wularsports.com/api`
3. Select all environments (Production, Preview, Development)
4. Redeploy

### Issue 2: "404 Not Found" on API call
**Solution:**
1. Check if backend URL is correct
2. Try: `https://www.wularsports.com/api` (with www)
3. Or: `https://wular-sports.vercel.app/api` (Vercel URL)

### Issue 3: "Network error" or "Cannot reach payment server"
**Solution:**
1. Check internet connection
2. Test API directly in browser
3. Check Vercel function is deployed
4. Check Vercel function logs for errors

### Issue 4: "Payment gateway not configured"
**Solution:**
1. Set `VITE_RAZORPAY_KEY_ID` in Vercel
2. Redeploy after setting

### Issue 5: "Request timeout"
**Solution:**
1. Backend API is slow or not responding
2. Check Vercel function logs
3. Check if environment variables are set
4. Try again after a few seconds

---

## 📞 Still Not Working?

**Share these details:**

1. **Browser Console Errors** (screenshot)
2. **Network Tab** - `create-razorpay-order` request (screenshot)
3. **Vercel Function Logs** (screenshot)
4. **Environment Variables Check:**
   ```javascript
   console.log('Backend URL:', import.meta.env.VITE_RAZORPAY_BACKEND_URL);
   console.log('Key ID:', import.meta.env.VITE_RAZORPAY_KEY_ID);
   ```

---

## ✅ Expected Flow

1. User clicks "Place Order" with Online Payment
2. Form validates ✅
3. Order created in Firebase ✅
4. Backend creates Razorpay order ✅
5. **Razorpay checkout modal opens** ← This is where it's failing
6. User completes payment
7. Payment verified
8. Order confirmed

**If step 5 fails, check steps 1-4 first!**

---

**Last Updated:** 2024

