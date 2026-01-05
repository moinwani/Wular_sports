# 🔧 How to Set Environment Variables in Vercel - Step by Step Guide

## 📋 Overview

You need to set environment variables in Vercel for your Razorpay integration to work. This guide will walk you through it.

---

## ✅ Step 1: Log in to Vercel

1. **Go to:** https://vercel.com
2. **Log in** with your account (GitHub, GitLab, or email)

---

## ✅ Step 2: Select Your Project

1. **Click on your project:** "Wular_sports" (or your project name)
   - You should see it in your dashboard
   - If you don't see it, make sure your GitHub repository is connected

---

## ✅ Step 3: Go to Settings

1. **Click on the "Settings" tab** at the top of your project page
   - It's next to "Deployments", "Analytics", etc.

---

## ✅ Step 4: Go to Environment Variables

1. **In the left sidebar**, scroll down and click on **"Environment Variables"**
   - It's under the "General" section

---

## ✅ Step 5: Add Environment Variables

You need to add these variables **one by one**. For each variable:

### Variable 1: RAZORPAY_KEY_ID (Backend)

1. **Click the "Add New" button** (usually at the top right)
2. **Fill in the form:**
   - **Key:** `RAZORPAY_KEY_ID`
   - **Value:** `rzp_live_RzoBAX8SQwb6SQ` (your actual key ID)
   - **Environment:** Select **all three** (Production, Preview, Development)
   - ✅ Check: Production
   - ✅ Check: Preview  
   - ✅ Check: Development
3. **Click "Save"**

### Variable 2: RAZORPAY_KEY_SECRET (Backend)

1. **Click "Add New" again**
2. **Fill in the form:**
   - **Key:** `RAZORPAY_KEY_SECRET`
   - **Value:** `Y0dlH8YzGdxqlpZXLQPVbzME` (your actual key secret)
   - **Environment:** Select **all three** (Production, Preview, Development)
   - ✅ Check: Production
   - ✅ Check: Preview
   - ✅ Check: Development
3. **Click "Save"**

⚠️ **IMPORTANT:** Keep this secret safe! Never share it publicly.

### Variable 3: VITE_RAZORPAY_KEY_ID (Frontend)

1. **Click "Add New" again**
2. **Fill in the form:**
   - **Key:** `VITE_RAZORPAY_KEY_ID`
   - **Value:** `rzp_live_RzoBAX8SQwb6SQ` (same as RAZORPAY_KEY_ID)
   - **Environment:** Select **all three** (Production, Preview, Development)
   - ✅ Check: Production
   - ✅ Check: Preview
   - ✅ Check: Development
3. **Click "Save"**

### Variable 4: VITE_RAZORPAY_BACKEND_URL (Frontend)

**Why this variable?** This tells your React app where to send API requests for payment processing.

1. **Click "Add New" again**
2. **Find your website URL:**
   - From your screenshot, I can see your custom domains: `wularsports.com` and `www.wularsports.com`
   - Use your main custom domain (recommended): `wularsports.com`
   - OR use your Vercel deployment URL if you prefer
3. **Fill in the form:**
   - **Key:** `VITE_RAZORPAY_BACKEND_URL`
   - **Value:** `https://wularsports.com/api`
     - ⚠️ **Important:** Use your actual custom domain + `/api`
     - This is where your React app will send payment requests
   - **Environment:** Select **all three** (Production, Preview, Development)
   - ✅ Check: Production
   - ✅ Check: Preview
   - ✅ Check: Development
4. **Click "Save"**

**Note:** This URL tells your frontend: "When creating a payment, send the request to `https://wularsports.com/api/create-razorpay-order`"

---

## ✅ Step 6: Verify Your Variables

After adding all variables, you should see them listed:

```
✅ RAZORPAY_KEY_ID              [Production, Preview, Development]
✅ RAZORPAY_KEY_SECRET          [Production, Preview, Development]
✅ VITE_RAZORPAY_KEY_ID         [Production, Preview, Development]
✅ VITE_RAZORPAY_BACKEND_URL    [Production, Preview, Development]
```

---

## ✅ Step 7: Redeploy Your Application

**IMPORTANT:** After adding environment variables, you need to redeploy!

### Option 1: Automatic Redeploy (Recommended)

1. **Go to the "Deployments" tab**
2. **Find your latest deployment**
3. **Click the "..." (three dots) menu**
4. **Click "Redeploy"**
5. **Select "Use existing Build Cache"** (optional, but faster)
6. **Click "Redeploy"**

### Option 2: Trigger New Deployment

1. **Make a small change** to any file in your repository
2. **Commit and push** to GitHub
3. Vercel will **automatically deploy** with the new environment variables

---

## ✅ Step 8: Verify Environment Variables Are Active

After redeploying:

1. **Go to your deployment** (click on it)
2. **Go to "Functions" tab** (if available)
3. **Or check the build logs** - environment variables are loaded during build

---

## 🔍 How to Check if Variables Are Set

### Method 1: Check Vercel Dashboard

1. Go to **Settings → Environment Variables**
2. You should see all 4 variables listed

### Method 2: Test in Browser Console

After deployment, open your website and in browser console, run:

```javascript
console.log('Razorpay Key:', import.meta.env.VITE_RAZORPAY_KEY_ID);
console.log('Backend URL:', import.meta.env.VITE_RAZORPAY_BACKEND_URL);
```

**Expected Output:**
- Should show your Razorpay Key ID (not `undefined`)
- Should show your backend URL

### Method 3: Test API Endpoint

Try this in browser console:

```javascript
fetch('/api/create-razorpay-order', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ amount: 100, currency: 'INR', receipt: 'test' })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

If it works, you'll see an order object. If not, check Vercel function logs.

---

## ⚠️ Important Notes

### 1. Environment Variable Naming

- **Backend variables** (used in API functions): `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
- **Frontend variables** (used in React): Must start with `VITE_` → `VITE_RAZORPAY_KEY_ID`

### 2. Secrets Security

- ✅ `RAZORPAY_KEY_SECRET` is NEVER exposed to frontend
- ✅ Only `VITE_RAZORPAY_KEY_ID` (public key) is exposed to frontend
- ✅ All sensitive operations happen on backend

### 3. Environment Selection

- **Production:** Used when deployed to production URL
- **Preview:** Used for preview deployments (PR branches)
- **Development:** Used for local development (if using Vercel CLI)

**Best Practice:** Enable all three for consistency.

### 4. Changes Take Effect After Redeploy

- Environment variables are loaded **at build time**
- You **must redeploy** after adding/changing variables
- Changes don't apply to existing deployments automatically

---

## 🐛 Troubleshooting

### Issue: "Variable not found" in logs

**Solution:**
1. Check spelling of variable name
2. Make sure you selected the right environment (Production/Preview/Development)
3. Redeploy after adding variables

### Issue: "Razorpay Key ID not configured"

**Solution:**
1. Verify `VITE_RAZORPAY_KEY_ID` is set in Vercel
2. Make sure it starts with `VITE_`
3. Redeploy your application

### Issue: "Failed to create order"

**Solution:**
1. Check Vercel function logs
2. Verify `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are set
3. Make sure they're the correct live keys (not test keys)

### Issue: "Backend URL not working"

**Solution:**
1. Verify `VITE_RAZORPAY_BACKEND_URL` is correct
2. Format: `https://your-project.vercel.app/api`
3. Test the URL in browser: `https://your-project.vercel.app/api/create-razorpay-order`
   - Should return error (POST required), not 404

---

## 📸 Visual Guide (What to Look For)

### In Vercel Dashboard:

```
Settings
├── General
│   ├── Project Name
│   ├── Framework Preset
│   └── Environment Variables  ← Click here!
│       ├── [Add New Button]
│       └── List of variables
```

### Environment Variables Form:

```
Key: [RAZORPAY_KEY_ID                    ]
Value: [rzp_live_xxxxxxxxxxxxx            ]
Environment:
  ☐ Production
  ☐ Preview
  ☐ Development
[Save] [Cancel]
```

---

## ✅ Quick Checklist

Before testing your payment:

- [ ] All 4 environment variables added
- [ ] All environments selected (Production, Preview, Development)
- [ ] Variables saved successfully
- [ ] Application redeployed
- [ ] Tested in browser console
- [ ] No errors in Vercel function logs

---

## 🎯 Summary

1. **Log in to Vercel** → Select your project
2. **Settings** → **Environment Variables**
3. **Add 4 variables:**
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
   - `VITE_RAZORPAY_KEY_ID`
   - `VITE_RAZORPAY_BACKEND_URL`
4. **Select all environments** for each variable
5. **Save** each variable
6. **Redeploy** your application
7. **Test** the payment flow

---

**That's it!** Your Razorpay integration should now work. 🚀

If you still face issues after following these steps, check the browser console for specific error messages and share them.

---

**Last Updated:** 2024

