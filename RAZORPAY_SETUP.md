# Razorpay Payment Integration - Setup Guide

## 🔑 What You Need from Razorpay

You need to provide me with the following from your Razorpay dashboard:

### 1. **Razorpay Key ID** (Public Key)
- Location: Razorpay Dashboard → Settings → API Keys
- This is your **public key** (starts with `rzp_`)
- Used in frontend (React app)
- Example: `rzp_test_xxxxx` or `rzp_live_xxxxx`

### 2. **Razorpay Key Secret** (Private Key - KEEP SECRET!)
- Location: Razorpay Dashboard → Settings → API Keys
- This is your **secret key** (starts with `rzp_`)
- Used ONLY in backend (never expose in frontend!)
- Example: `rzp_test_xxxxx` or `rzp_live_xxxxx`

### 3. **Webhook Secret** (Optional but Recommended)
- Location: Razorpay Dashboard → Settings → Webhooks
- Used to verify webhook signatures
- Generate a webhook secret if you haven't already

---

## 📋 Steps to Get Your Keys

1. **Log in to Razorpay Dashboard**
   - Go to: https://dashboard.razorpay.com/

2. **Navigate to API Keys**
   - Click **Settings** → **API Keys**

3. **Generate/View Keys**
   - If you don't have keys, click **Generate Key**
   - If you have keys, click **View Key** (you may need to regenerate secret)

4. **Copy Your Keys**
   - Copy the **Key ID** (Public Key)
   - Copy the **Key Secret** (Private Key) - **Save this securely!**

---

## 🔐 Environment Variables Needed

You'll need to add these to your environment:

### Frontend (.env file):
```
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
VITE_RAZORPAY_BACKEND_URL=https://your-backend-url.com/api
```

### Backend (.env file):
```
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_key_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

---

## ⚠️ Important Security Notes

1. **Never expose Key Secret in frontend code**
2. **Always use environment variables**
3. **Use test keys for development, live keys for production**
4. **Keep your secret keys secure and never commit them to Git**

---

## 🚀 Next Steps

Once you provide the keys, I will:
1. ✅ Set up secure backend API endpoints
2. ✅ Update frontend to use backend API
3. ✅ Implement proper payment verification
4. ✅ Add webhook support for payment status updates
5. ✅ Test the complete payment flow

---

## 📞 What to Send Me

Please provide:
1. **Razorpay Key ID** (Public Key)
2. **Razorpay Key Secret** (Private Key)
3. **Your preferred backend hosting** (Vercel, Firebase Functions, or custom server)
4. **Production or Test Mode?** (Test keys start with `rzp_test_`, Live keys start with `rzp_live_`)

---

## 🔒 Security Best Practices

- ✅ Orders are created on backend (secure)
- ✅ Payment signatures are verified (secure)
- ✅ Webhook verification (optional but recommended)
- ✅ Key Secret never exposed to frontend
- ✅ HTTPS required for production

