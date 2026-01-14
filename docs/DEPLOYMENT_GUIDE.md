# Firebase Security Deployment Guide

## Prerequisites

Before you begin:
- ✅ Node.js installed (v16 or higher)
- ✅ Firebase CLI installed (`npm install -g firebase-tools`)
- ✅ Firebase project created (via Firebase Console)
- ✅ Project linked to Vercel (if using Vercel hosting)

---

## Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

Verify installation:
```bash
firebase --version
```

---

## Step 2: Login to Firebase

```bash
firebase login
```

This will open your browser for authentication.

---

## Step 3: Initialize Firebase Project (First Time Only)

```bash
firebase init
```

Select:
- ✅ Firestore: Configure security rules and indexes
- ✅ Hosting: Configure files for Firebase Hosting (optional)

When prompted:
- **Firestore rules file:** `firestore.rules` (default)
- **Firestore indexes file:** `firestore.indexes.json` (default)
- **Public directory:** `dist` (Vite build output)
- **Rewrite all URLs to index.html:** Yes

---

## Step 4: Link Firebase Project

Create `.firebaserc` in project root:
```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

Get your project ID from Firebase Console → Project Settings → General

---

## Step 5: Deploy Firestore Security Rules

```bash
firebase deploy --only firestore:rules
```

Expected output:
```
✔ Deploy complete!

Firestore Rules:
  - firestore rules released successfully
```

---

## Step 6: Verify Rules Are Active

### Method 1: Firebase Console
1. Go to Firebase Console → Firestore Database
2. Click "Rules" tab
3. Verify you see 225 lines of rules (timestamps show when deployed)

### Method 2: Test from Browser Console
1. Open your website (wularsports.com)
2. Open browser DevTools (F12)
3. Run this in console:
   ```javascript
   import { collection, getDocs } from 'firebase/firestore';
   import { db } from './src/services/firebase';
   
   // This should FAIL with "Missing or insufficient permissions"
   getDocs(collection(db, 'subscribers'))
     .then(() => console.log('❌ SECURITY BREACH - Rules not working!'))
     .catch(err => console.log('✅ Rules working:', err.message));
   ```

Expected result: Error "Missing or insufficient permissions"

---

## Step 7: Set Up Admin Access

### A. Download Service Account Key

1. Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Save as `serviceAccountKey.json` in project root
4. **IMPORTANT:** Add to `.gitignore` (already included)

### B. Install Firebase Admin SDK

```bash
npm install firebase-admin
```

### C. Run Admin Setup Script

```bash
# Set admin claim on your email
node scripts/admin-setup.js your.email@example.com
```

Expected output:
```
✅ Firebase Admin initialized successfully
Looking up user: your.email@example.com...
✅ User found: abc123xyz
🔐 Setting admin custom claim...
✅ Admin claim set successfully!
```

### D. Create Admin User (If Doesn't Exist)

If you don't have a user yet:
1. Go to Firebase Console → Authentication
2. Click "Add user"
3. Enter your email and password
4. **OR** sign up via your website's auth flow
5. Then run admin setup script

---

## Step 8: Enable Firebase Authentication

### A. Enable in Firebase Console
1. Firebase Console → Authentication
2. Click "Get started"
3. Click "Sign-in method" tab
4. Enable "Anonymous" (for checkout)
5. **Optional:** Enable "Email/Password" (for user accounts)

### B. Verify Auth is Working

Open browser console on your site:
```javascript
import { getAuth, signInAnonymously } from 'firebase/auth';
const auth = getAuth();

signInAnonymously(auth)
  .then(user => console.log('✅ Auth working:', user.user.uid))
  .catch(err => console.log('❌ Auth error:', err.message));
```

---

## Step 9: Update Frontend Code

### A. Update Order Creation Flow

File: `src/views/CheckoutView.tsx`

Add auth before order creation:
```typescript
import { ensureAuthenticated } from '../services/auth';

// In handleSubmit, before createOrder:
const userId = await ensureAuthenticated();

const orderData = {
  ...existingOrderData,
  userId: userId  // Add this
};
```

### B. Create Auth Service

File: `src/services/auth.ts` (create this file - see code in next section)

---

## Step 10: Test Security

### Test 1: Public CANNOT Read Subscribers
```javascript
// Should FAIL
getDocs(collection(db, 'subscribers'))
  .catch(err => console.log('✅ PASS:', err.code));
```

### Test 2: Public CAN Create Subscriber
```javascript
// Should SUCCEED
addDoc(collection(db, 'subscribers'), {
  email: 'test@example.com',
  subscribedAt: Timestamp.now(),
  status: 'active'
}).then(() => console.log('✅ PASS: Created'));
```

### Test 3: Authenticated User Can Create Order
```javascript
// First authenticate
const auth = getAuth();
await signInAnonymously(auth);

// Should SUCCEED
await addDoc(collection(db, 'orders'), {
  userId: auth.currentUser.uid,
  orderNumber: 'WS' + Date.now(),
  customerName: 'Test User',
  customerEmail: 'test@example.com',
  // ... rest of required fields
});
console.log('✅ PASS: Order created');
```

### Test 4: User CANNOT Read Other Users' Orders
```javascript
// Should return EMPTY (only your own orders)
const orders = await getDocs(collection(db, 'orders'));
console.log('Orders visible:', orders.size); // Should be = your orders only
```

### Test 5: Admin Can Read All Data
```javascript
// Sign in with admin account first
// Then should see ALL subscribers and ALL orders
const subscribers = await getDocs(collection(db, 'subscribers'));
console.log('✅ PASS: Admin sees', subscribers.size, 'subscribers');
```

---

## Step 11: Migrate Existing Data

### Problem:
Existing orders don't have `userId` field, so they're invisible after deploying rules.

### Solution:
Run migration script:

```javascript
// scripts/migrate-existing-orders.js
const admin = require('firebase-admin');
admin.initializeApp({
  credential: admin.credential.cert(require('../serviceAccountKey.json'))
});

async function migrate() {
  const ordersRef = admin.firestore().collection('orders');
  const snapshot = await ordersRef.get();
  
  let count = 0;
  for (const doc of snapshot.docs) {
    if (!doc.data().userId) {
      await doc.ref.update({ userId: 'LEGACY_ORDER' });
      count++;
    }
  }
  
  console.log(`✅ Migrated ${count} orders`);
}

migrate();
```

Run:
```bash
node scripts/migrate-existing-orders.js
```

---

## Step 12: Production Checklist

Before going live:

- [ ] Firestore rules deployed
- [ ] Rules tested (all 5 tests pass)
- [ ] Admin access configured
- [ ] Firebase Auth enabled
- [ ] Frontend code updated with auth
- [ ] Existing data migrated
- [ ] No console errors on checkout
- [ ] Test order created successfully
- [ ] Test order visible to owner only
- [ ] Admin can see all orders
- [ ] Newsletter signup works
- [ ] Subscriber emails are private
- [ ] No sensitive data in client-side logs
- [ ] Service account key in .gitignore
- [ ] Environment variables set in Vercel

---

## Troubleshooting

### "Missing or insufficient permissions" when creating order
**Problem:** User is not authenticated
**Solution:** Call `ensureAuthenticated()` before `createOrder()`

### "Permission denied" when trying to read subscribers as admin
**Problem:** Admin claim not set or user didn't re-authenticate
**Solution:** 
1. Run `node scripts/admin-setup.js your@email.com`
2. Sign out and sign in again
3. Verify claim: `auth.currentUser.getIdTokenResult().then(r => console.log(r.claims))`

### Rules deployment fails
**Problem:** Syntax error in firestore.rules
**Solution:** Validate rules at https://firebase.google.com/docs/rules/simulator

### Cannot read own orders
**Problem:** Order doesn't have userId or userId doesn't match
**Solution:** Check order in Firebase Console, verify userId field matches auth.currentUser.uid

---

## Security Best Practices

1. ✅ **Never expose service account key**
   - Add `serviceAccountKey.json` to `.gitignore`
   - Don't commit to Git
   - Don't share publicly

2. ✅ **Use environment variables**
   - Store Firebase config in `.env.local`
   - Never hardcode credentials

3. ✅ **Enable Firebase App Check** (recommended)
   - Prevents abuse from unauthorized apps
   - Go to Firebase Console → App Check

4. ✅ **Monitor access logs**
   - Firebase Console → Firestore → Usage
   - Look for unusual patterns

5. ✅ **Regular security audits**
   - Review rules quarterly
   - Test attack scenarios
   - Update dependencies

---

## Emergency Rollback

If critical issues arise:

```bash
# Option 1: Revert to previous rules version
firebase deploy --only firestore:rules

# Option 2: Temporarily disable rules (DANGER - ONLY IN EMERGENCY)
# Edit firestore.rules:
match /{document=**} {
  allow read, write: if true;
}
# Then deploy

# IMPORTANT: Fix issue and redeploy secure rules ASAP
```

---

## Support

If you encounter issues:
1. Check Firebase Console → Firestore → Rules tab for errors
2. Review security rules simulator
3. Check browser console for auth errors
4. Verify environment variables are set
5. Contact Firebase Support (if on paid plan)

---

## Success Confirmation

You'll know everything is working when:
- ✅ Firestore rules show "Rules active" in console
- ✅ Public users CANNOT read subscribers or orders
- ✅ Authenticated users CAN create orders
- ✅ Users CAN read only their own orders
- ✅ Admin CAN read all data
- ✅ Attack simulations all FAIL (as expected)
- ✅ Checkout flow works end-to-end
- ✅ Newsletter signup works

**Congratulations! Your Firebase setup is now production-ready and secure! 🎉**
