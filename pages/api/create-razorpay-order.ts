import type { NextApiRequest, NextApiResponse } from 'next';
import Razorpay from 'razorpay';
import { getCatalog } from '../../src/lib/catalogServer';
import { productSizes } from '../../src/lib/catalog';
import { getClientIp, checkRateLimit } from '../../src/lib/rateLimit';
import { auth, db, FieldValue } from '../../src/lib/firebaseAdmin';
import { validateFormData } from '../../src/utils/inputValidation';
import { buildCheckoutSchema } from '../../src/utils/checkoutSchema';
import { normalizeCouponCode } from '../../src/data/coupons';
import { resolveCoupon } from '../../src/lib/coupons';
import { couponDiscount, sanitizeAttribution } from '../../src/lib/marketing';

const COD_BOOKING_PER_BAT = 500;
const COD_FEE_PERCENT = 0.05;

function getRazorpay(): Razorpay {
    const key_id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_id || !key_secret) {
        throw new Error('Razorpay credentials not configured');
    }
    return new Razorpay({ key_id, key_secret });
}

const FIELD_LABELS: Record<string, string> = {
    firstName: 'first name', lastName: 'last name', email: 'email', phone: 'phone number',
    address: 'address', city: 'city', state: 'state', zip: 'PIN code', country: 'country',
};
const fieldLabel = (f: string) => FIELD_LABELS[f] || 'details';

async function verifyAuth(req: NextApiRequest): Promise<{ uid: string }> {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Missing authorization header');
    }
    const token = authHeader.split('Bearer ')[1];
    const decoded = await auth.verifyIdToken(token);
    return { uid: decoded.uid };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const ip = getClientIp(req);
    // Own counter (it used to share one with the payment check, so verifying a
    // payment could use up the buyer's attempts to start one)
    const { allowed, retryAfterMs } = checkRateLimit(`create-order:${ip}`, 10);
    if (!allowed) {
        res.setHeader('Retry-After', Math.ceil((retryAfterMs || 0) / 1000).toString());
        return res.status(429).json({ error: 'Too many attempts. Please wait a few minutes and try again, or order on WhatsApp.' });
    }

    let uid: string;
    try {
        ({ uid } = await verifyAuth(req));
    } catch {
        return res.status(401).json({ error: 'Authentication required. Please sign in to continue.' });
    }

    const { items, paymentMethod, customer, coupon } = req.body;
    // Where this buyer came from (ad tags, Meta click ids, visitor Ref)
    const attribution = sanitizeAttribution(req.body.attribution);

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Invalid items' });
    }

    if (paymentMethod !== 'full' && paymentMethod !== 'cod') {
        return res.status(400).json({ error: 'Invalid payment method' });
    }

    // Validate shipping details server-side with the same schema as the form
    if (!customer || typeof customer !== 'object') {
        return res.status(400).json({ error: 'Missing customer details' });
    }
    const isIndianPhone = customer.countryCode === '+91';
    const isIndiaOrder = customer.country === 'India';
    const validation = validateFormData(
        { ...customer, paymentMethod },
        buildCheckoutSchema(isIndianPhone, isIndiaOrder)
    );
    if (!validation.valid) {
        const first = Object.entries(validation.errors)[0];
        return res.status(400).json({ error: first ? `Please check your ${fieldLabel(first[0])}: ${first[1]}` : 'Please check your details' });
    }
    const c = validation.sanitized! as Record<string, string>;
    if (paymentMethod === 'cod' && (c.country || 'India') !== 'India') {
        return res.status(400).json({ error: 'Cash on delivery is only available in India. Please choose Full Payment.' });
    }

    // Compute amount server-side from the live catalog (prices set in the admin panel)
    const catalog = await getCatalog({ fresh: true });
    if (catalog.failed) {
        return res.status(503).json({ error: 'Could not load prices right now. Please try again in a minute.' });
    }
    const products = catalog.products.filter(p => !p.hidden);
    let orderTotal = 0;
    let totalBats = 0;
    const orderItems: Array<{ productId: string; productName: string; price: number; quantity: number; size?: string }> = [];

    for (const item of items) {
        const product = products.find(p => p.id === item.id);
        if (!product) {
            return res.status(400).json({ error: 'One of the bats in your cart is no longer available. Please remove it and try again.' });
        }
        const qty = Number(item.quantity);
        if (!Number.isInteger(qty) || qty < 1 || qty > 100) {
            return res.status(400).json({ error: 'Please check the quantity in your cart (1–100 per bat).' });
        }
        // The size must be one this bat actually comes in (an old saved cart can
        // carry an empty or outdated one, leaving the owner to chase the buyer)
        const sizes = productSizes(product);
        let size = typeof item.size === 'string' ? item.size.trim().substring(0, 30) : '';
        if (sizes.length === 1) size = sizes[0];
        else if (sizes.length > 1 && !sizes.includes(size)) {
            return res.status(400).json({ error: `Please choose a size for ${product.name} (remove it from your cart and add it again with a size).` });
        } else if (sizes.length === 0) size = '';
        orderTotal += product.price * qty;
        totalBats += qty;
        orderItems.push({
            productId: product.id,
            productName: product.name,
            price: product.price,
            quantity: qty,
            size,
        });
    }

    // Coupon: validated server-side (admin-managed coupons + built-ins).
    // An unknown code is rejected so the customer isn't silently overcharged
    // relative to what the checkout UI promised them.
    let discount = 0;
    let couponCode = '';
    if (coupon) {
        let c;
        try {
            c = await resolveCoupon(coupon);
        } catch {
            return res.status(503).json({ error: 'Could not check the coupon. Please try again.' });
        }
        if (!c) {
            return res.status(400).json({ error: 'Invalid or expired coupon code' });
        }
        couponCode = normalizeCouponCode(c.code);
        discount = couponDiscount(c, orderTotal, totalBats);
    }
    const discountedTotal = orderTotal - discount;
    if (discountedTotal < 100) {
        return res.status(400).json({ error: 'Order total too low' });
    }

    const isCOD = paymentMethod === 'cod';
    const bookingAmount = isCOD ? totalBats * COD_BOOKING_PER_BAT : 0;
    if (isCOD && discountedTotal < bookingAmount) {
        // e.g. a big coupon: the booking alone would be more than the order
        return res.status(400).json({ error: 'Cash on delivery isn\'t available for this order. Please choose Full Payment.' });
    }
    const remaining = isCOD ? discountedTotal - bookingAmount : 0;
    const codFee = isCOD ? Math.round(remaining * COD_FEE_PERCENT) : 0;
    const totalAtDoor = isCOD ? remaining + codFee : 0;
    const chargeAmount = isCOD ? bookingAmount : discountedTotal;

    try {
        // Our reference for this checkout (made here — the browser used to make
        // it with crypto.randomUUID, which older phones don't have)
        const receipt = `ORD-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 1296).toString(36).toUpperCase()}`;
        const order = await getRazorpay().orders.create({
            amount: chargeAmount * 100, // paise
            currency: 'INR',
            receipt,
            // Capture automatically: a payment that's only "authorised" is refunded
            // by Razorpay after a few days, even though the order looks paid
            payment_capture: true,
            // Built here from checked details (never passed through from the browser)
            notes: { orderId: receipt, customerPhone: `${c.countryCode || '+91'}${c.phone}` },
        });

        // Persist the order server-side BEFORE payment. Even if the customer's
        // browser dies mid-payment, the order (with contact details) exists
        // and can be reconciled against the Razorpay dashboard.
        // status stays 'pending' until verify-razorpay-payment confirms it.
        const orderDoc = await db.collection('orders').add({
            userId: uid,
            orderNumber: `WS${Date.now()}${Math.floor(Math.random() * 1000)}`,
            receipt,
            customerName: `${c.firstName} ${c.lastName || ''}`.trim(),
            customerEmail: c.email,
            customerPhone: `${c.countryCode || '+91'}${c.phone}`,
            customerAddress: {
                street: c.address,
                city: c.city,
                state: c.state,
                pincode: c.zip,
                country: c.country || 'India',
            },
            items: orderItems.map(i => (i.size === undefined ? { ...i, size: '' } : i)),
            total: discountedTotal,
            subtotal: orderTotal,
            discount,
            couponCode,
            codFee,
            bookingAmount,
            remaining,
            totalAtDoor,
            razorpayOrderId: order.id,
            status: 'pending',
            paymentStatus: 'pending',
            paymentMethod,
            channel: 'website',
            ...(attribution ? { attribution } : {}),
            // Lets the server report the purchase to Meta after payment,
            // even if this browser never comes back from the UPI app
            client: {
                ip: getClientIp(req),
                userAgent: String(req.headers['user-agent'] || '').slice(0, 400),
                pageUrl: String(req.headers.referer || 'https://wularsports.com/checkout').slice(0, 300),
            },
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });

        return res.status(200).json({
            orderId: order.id,
            amount: order.amount,
            orderTotal: discountedTotal,
            discount,
            chargeAmount,
            firestoreOrderId: orderDoc.id,
        });
    } catch (err: any) {
        console.error('Razorpay order creation failed:', err);
        return res.status(500).json({ error: 'We couldn\'t start the payment just now. Please try again in a minute, or order on WhatsApp.' });
    }
}
