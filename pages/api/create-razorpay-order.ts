import type { NextApiRequest, NextApiResponse } from 'next';
import Razorpay from 'razorpay';
import { products } from '../../src/data/products';
import { getClientIp, checkRateLimit } from '../../src/lib/rateLimit';
import { auth, db, FieldValue } from '../../src/lib/firebaseAdmin';
import { validateFormData } from '../../src/utils/inputValidation';
import { buildCheckoutSchema } from '../../src/utils/checkoutSchema';
import { getCoupon, normalizeCouponCode } from '../../src/data/coupons';

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
    const { allowed, retryAfterMs } = checkRateLimit(ip, 10);
    if (!allowed) {
        res.setHeader('Retry-After', Math.ceil((retryAfterMs || 0) / 1000).toString());
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    let uid: string;
    try {
        ({ uid } = await verifyAuth(req));
    } catch {
        return res.status(401).json({ error: 'Authentication required. Please sign in to continue.' });
    }

    const { items, paymentMethod, receipt, notes, customer, coupon } = req.body;

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
        return res.status(400).json({ error: 'Invalid customer details' });
    }
    const c = validation.sanitized! as Record<string, string>;

    // Compute amount server-side from authoritative product catalog
    let orderTotal = 0;
    let totalBats = 0;
    const orderItems: Array<{ productId: string; productName: string; price: number; quantity: number; size?: string }> = [];

    for (const item of items) {
        const product = products.find(p => p.id === item.id);
        if (!product) {
            return res.status(400).json({ error: `Unknown product: ${item.id}` });
        }
        const qty = Number(item.quantity);
        if (!Number.isInteger(qty) || qty < 1 || qty > 100) {
            return res.status(400).json({ error: 'Invalid quantity' });
        }
        orderTotal += product.price * qty;
        totalBats += qty;
        orderItems.push({
            productId: product.id,
            productName: product.name,
            price: product.price,
            quantity: qty,
            size: typeof item.size === 'string' ? item.size.substring(0, 30) : undefined,
        });
    }

    // Coupon: validated server-side from the authoritative table.
    // An unknown code is rejected so the customer isn't silently overcharged
    // relative to what the checkout UI promised them.
    let discount = 0;
    let couponCode = '';
    if (coupon) {
        const c = getCoupon(String(coupon));
        if (!c) {
            return res.status(400).json({ error: 'Invalid coupon code' });
        }
        couponCode = normalizeCouponCode(String(coupon));
        discount = c.perBat * totalBats;
    }
    const discountedTotal = orderTotal - discount;
    if (discountedTotal < 100) {
        return res.status(400).json({ error: 'Order total too low' });
    }

    const isCOD = paymentMethod === 'cod';
    const bookingAmount = isCOD ? totalBats * COD_BOOKING_PER_BAT : 0;
    const remaining = isCOD ? discountedTotal - bookingAmount : 0;
    const codFee = isCOD ? Math.round(remaining * COD_FEE_PERCENT) : 0;
    const totalAtDoor = isCOD ? remaining + codFee : 0;
    const chargeAmount = isCOD ? bookingAmount : discountedTotal;

    try {
        const order = await getRazorpay().orders.create({
            amount: chargeAmount * 100, // paise
            currency: 'INR',
            receipt: (receipt || `rcpt_${Date.now()}`).toString().substring(0, 40),
            notes: notes || {},
        });

        // Persist the order server-side BEFORE payment. Even if the customer's
        // browser dies mid-payment, the order (with contact details) exists
        // and can be reconciled against the Razorpay dashboard.
        // status stays 'pending' until verify-razorpay-payment confirms it.
        const orderDoc = await db.collection('orders').add({
            userId: uid,
            orderNumber: `WS${Date.now()}${Math.floor(Math.random() * 1000)}`,
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
        return res.status(500).json({ error: 'Failed to create payment order' });
    }
}
