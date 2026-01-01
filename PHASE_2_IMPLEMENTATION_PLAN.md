# Phase 2: Core E-commerce Implementation Plan
**Date:** January 1, 2026  
**Status:** 🚧 In Progress

## Overview
Phase 2 focuses on implementing essential e-commerce functionality to make the website fully operational for processing real orders.

---

## 🎯 Phase 2 Features (Priority Order)

### 1. Search Functionality ⭐ HIGH PRIORITY
**Goal:** Allow users to quickly find specific products

**Implementation:**
- [ ] Create `SearchBar` component with autocomplete
- [ ] Add search input to Header (desktop & mobile)
- [ ] Implement fuzzy search algorithm (product name, description, category)
- [ ] Add search results page/view
- [ ] Highlight search terms in results
- [ ] Add "No results" state with suggestions

**Files to Create:**
- `src/components/common/SearchBar.tsx`
- `src/views/SearchResultsView.tsx`
- `src/utils/search.ts`

**Estimated Time:** 2-3 hours

---

### 2. Product Filtering & Sorting ⭐ HIGH PRIORITY
**Goal:** Help users browse products by category, price, etc.

**Implementation:**
- [ ] Create `FilterPanel` component
- [ ] Add filters:
  - Category (Hard Tennis, Soft Tennis, Leather Ball)
  - Price range (slider)
  - Availability (In Stock)
- [ ] Add sorting options:
  - Price: Low to High
  - Price: High to Low
  - Newest First
  - Best Selling
- [ ] Update `CollectionView` to support filters
- [ ] Add "Clear Filters" button
- [ ] Show active filter count

**Files to Create:**
- `src/components/product/FilterPanel.tsx`
- `src/components/product/SortDropdown.tsx`
- `src/utils/filtering.ts`

**Files to Modify:**
- `src/views/CollectionView.tsx`

**Estimated Time:** 3-4 hours

---

### 3. Payment Integration (Razorpay) ⭐⭐ CRITICAL
**Goal:** Enable actual payment processing

**Implementation:**
- [ ] Set up Razorpay account
- [ ] Install Razorpay SDK: `npm install razorpay`
- [ ] Create payment gateway integration
- [ ] Update `CheckoutView` to use Razorpay
- [ ] Add payment success/failure handling
- [ ] Implement order confirmation flow
- [ ] Add payment method selection (UPI, Card, Net Banking)
- [ ] Test with Razorpay test mode

**Environment Variables:**
```
VITE_RAZORPAY_KEY_ID=your_key_id
VITE_RAZORPAY_KEY_SECRET=your_key_secret
```

**Files to Create:**
- `src/services/payment.ts`
- `src/hooks/useRazorpay.ts`

**Files to Modify:**
- `src/views/CheckoutView.tsx`
- `.env.local`

**Estimated Time:** 4-5 hours

---

### 4. Backend Setup (Firebase/Supabase) ⭐⭐ CRITICAL
**Goal:** Store orders, manage inventory, customer data

**Option A: Firebase (Recommended for quick setup)**
- [ ] Create Firebase project
- [ ] Install Firebase: `npm install firebase`
- [ ] Set up Firestore database
- [ ] Create collections:
  - `orders` - Order details
  - `products` - Product inventory
  - `customers` - Customer information
- [ ] Implement CRUD operations
- [ ] Add real-time listeners for inventory

**Option B: Supabase (Better for SQL needs)**
- [ ] Create Supabase project
- [ ] Install Supabase: `npm install @supabase/supabase-js`
- [ ] Set up PostgreSQL tables
- [ ] Create API endpoints
- [ ] Implement authentication

**Files to Create:**
- `src/services/firebase.ts` or `src/services/supabase.ts`
- `src/services/orders.ts`
- `src/services/inventory.ts`
- `src/hooks/useOrders.ts`

**Estimated Time:** 5-6 hours

---

### 5. Email Notifications ⭐ MEDIUM PRIORITY
**Goal:** Send order confirmations and updates

**Implementation:**
- [ ] Set up email service (EmailJS, SendGrid, or Firebase Functions)
- [ ] Create email templates:
  - Order Confirmation
  - Order Shipped
  - Delivery Confirmation
- [ ] Trigger emails on order events
- [ ] Add customer email to checkout form
- [ ] Send admin notification on new order

**Service Options:**
- **EmailJS** (Free tier, easy setup)
- **SendGrid** (Professional, scalable)
- **Firebase Cloud Functions** (Integrated with Firebase)

**Files to Create:**
- `src/services/email.ts`
- `src/templates/orderConfirmation.ts`

**Estimated Time:** 2-3 hours

---

## 📋 Implementation Order (Recommended)

### Session 1: Search & Filtering (5-7 hours)
1. ✅ Search Functionality
2. ✅ Product Filtering & Sorting

### Session 2: Payment & Backend (9-11 hours)
3. ✅ Backend Setup (Firebase/Supabase)
4. ✅ Payment Integration (Razorpay)
5. ✅ Email Notifications

---

## 🔧 Technical Stack Additions

### New Dependencies:
```json
{
  "firebase": "^10.7.1",           // Backend & Auth
  "razorpay": "^2.9.2",            // Payment Gateway
  "@emailjs/browser": "^3.11.0"    // Email Service (optional)
}
```

### Environment Variables (.env.local):
```env
# Razorpay
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxx
VITE_RAZORPAY_KEY_SECRET=xxxxx

# Firebase
VITE_FIREBASE_API_KEY=xxxxx
VITE_FIREBASE_AUTH_DOMAIN=xxxxx
VITE_FIREBASE_PROJECT_ID=xxxxx
VITE_FIREBASE_STORAGE_BUCKET=xxxxx
VITE_FIREBASE_MESSAGING_SENDER_ID=xxxxx
VITE_FIREBASE_APP_ID=xxxxx

# EmailJS (if using)
VITE_EMAILJS_SERVICE_ID=xxxxx
VITE_EMAILJS_TEMPLATE_ID=xxxxx
VITE_EMAILJS_PUBLIC_KEY=xxxxx
```

---

## 🎨 UI/UX Enhancements

### Search Bar Design:
- Magnifying glass icon
- Autocomplete dropdown
- Recent searches
- Popular searches
- Keyboard shortcuts (Ctrl+K)

### Filter Panel Design:
- Collapsible sections
- Checkbox groups
- Price range slider
- Active filter badges
- Mobile-friendly drawer

### Payment UI:
- Razorpay modal integration
- Payment method icons
- Secure badge
- Order summary
- Loading states

---

## 🧪 Testing Checklist

### Search:
- [ ] Search by product name
- [ ] Search by category
- [ ] Autocomplete works
- [ ] No results state
- [ ] Clear search

### Filtering:
- [ ] Filter by category
- [ ] Filter by price range
- [ ] Multiple filters work together
- [ ] Clear filters
- [ ] Filter count updates

### Payment:
- [ ] Razorpay modal opens
- [ ] Test payment succeeds
- [ ] Payment failure handled
- [ ] Order created in database
- [ ] Confirmation email sent

### Backend:
- [ ] Orders saved to database
- [ ] Inventory updates
- [ ] Customer data stored
- [ ] Real-time updates work

---

## 🚀 Deployment Considerations

1. **Environment Variables:** Ensure all keys are set in production
2. **Razorpay:** Switch from test mode to live mode
3. **Firebase:** Set up production security rules
4. **Email:** Configure production email templates
5. **Testing:** Test full checkout flow in production

---

## 📊 Success Metrics

After Phase 2 completion:
- ✅ Users can search for products
- ✅ Users can filter/sort products
- ✅ Users can complete payment via Razorpay
- ✅ Orders are stored in database
- ✅ Customers receive email confirmations
- ✅ Admin can view orders
- ✅ Inventory is tracked

---

## 🎯 Phase 3 Preview

After Phase 2, we'll tackle:
1. User Authentication & Accounts
2. Customer Reviews System
3. Google Analytics Integration
4. Wishlist Functionality
5. Order Tracking Portal
6. Admin Dashboard

---

**Ready to Start?** Let's begin with Search Functionality!
