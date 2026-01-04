# 🚀 Vercel Environment Variables Setup - Razorpay

## ✅ Your Razorpay Live Keys

- **Key ID:** `rzp_live_RzoBAX8SQwb6SQ`
- **Key Secret:** `Y0dlH8YzGdxqlpZXLQPVbzME` ⚠️ KEEP SECRET!

---

## 📝 Step-by-Step: Set Up Environment Variables in Vercel

### Step 1: Go to Vercel Dashboard

1. Open: https://vercel.com/dashboard
2. Select your project: **Wular_sports** (or your project name)
3. Click **Settings** (top navigation)
4. Click **Environment Variables** (left sidebar)

### Step 2: Add Backend Variables

Click **Add New** and add these variables:

#### 1. RAZORPAY_KEY_ID
- **Key:** `RAZORPAY_KEY_ID`
- **Value:** `rzp_live_RzoBAX8SQwb6SQ`
- **Environment:** Select all (Production, Preview, Development)

#### 2. RAZORPAY_KEY_SECRET
- **Key:** `RAZORPAY_KEY_SECRET`
- **Value:** `Y0dlH8YzGdxqlpZXLQPVbzME`
- **Environment:** Select all (Production, Preview, Development)

#### 3. VITE_RAZORPAY_KEY_ID (Frontend)
- **Key:** `VITE_RAZORPAY_KEY_ID`
- **Value:** `rzp_live_RzoBAX8SQwb6SQ`
- **Environment:** Select all (Production, Preview, Development)

#### 4. VITE_RAZORPAY_BACKEND_URL (Frontend - Update after deployment)
- **Key:** `VITE_RAZORPAY_BACKEND_URL`
- **Value:** `https://your-project.vercel.app/api` (Update with your actual Vercel domain)
- **Environment:** Select all (Production, Preview, Development)

### Step 3: Save and Redeploy

1. **Click Save** for each variable
2. **Redeploy** your application:
   - Go to **Deployments** tab
   - Click **⋯** (three dots) on latest deployment
   - Click **Redeploy**

---

## 🔍 After Deployment

### Update Backend URL:

1. **Get your Vercel domain:**
   - Go to **Deployments** tab
   - Copy your domain (e.g., `wular-sports.vercel.app`)

2. **Update `VITE_RAZORPAY_BACKEND_URL`:**
   - Go back to **Settings** → **Environment Variables**
   - Edit `VITE_RAZORPAY_BACKEND_URL`
   - Set value to: `https://your-domain.vercel.app/api`
   - Save and redeploy

---

## ✅ Verify Setup

Check that these variables are set in Vercel:

- [ ] `RAZORPAY_KEY_ID` = `rzp_live_RzoBAX8SQwb6SQ`
- [ ] `RAZORPAY_KEY_SECRET` = `Y0dlH8YzGdxqlpZXLQPVbzME`
- [ ] `VITE_RAZORPAY_KEY_ID` = `rzp_live_RzoBAX8SQwb6SQ`
- [ ] `VITE_RAZORPAY_BACKEND_URL` = `https://your-domain.vercel.app/api`

---

## 🧪 Test Payment

1. **Deploy to Vercel**
2. **Test the flow:**
   - Add items to cart
   - Go to checkout
   - Fill in shipping details
   - Select "Online Payment (Razorpay)"
   - Complete payment

---

## 📞 Need Help?

If you have any issues:
1. Check Vercel function logs: **Deployments** → **Function Logs**
2. Check browser console for errors
3. Verify all environment variables are set correctly

---

## ✅ You're All Set!

Your Razorpay integration is now configured for production! 🎉

