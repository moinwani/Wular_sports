import type { DocumentReference } from 'firebase-admin/firestore';
import { db, FieldValue, Timestamp } from './firebaseAdmin';
import { ADMIN_EMAIL } from '../data/constants';

/**
 * Server-side order emails (admin notification + customer confirmation),
 * sent through the Google Apps Script bridge.
 *
 * Emails are sent from the server — never from the customer's browser — so
 * they go out even if the customer never returns from their UPI app. Both the
 * browser verify call and the Razorpay webhook call confirmPaidOrder(); a
 * per-order lock plus per-recipient status make it safe for both to fire:
 * each email is sent exactly once, and a failed one is retried on the next call.
 */

export type EmailResult = 'sent' | 'skipped' | string; // anything else = failure reason

export interface EmailStatus {
    admin?: EmailResult;
    customer?: EmailResult;
}

const BRIDGE_URL = process.env.EMAIL_BRIDGE_URL || process.env.NEXT_PUBLIC_EMAIL_BRIDGE_URL;
const LOCK_MS = 60_000;

const inr = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const formatDate = (v: any): string => {
    const d = v && typeof v.toDate === 'function' ? v.toDate() : v ? new Date(v) : new Date();
    return d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
};

const itemsList = (order: any): string =>
    (order.items || []).map((item: any) =>
        `${item.productName || item.name}${item.size ? ` (${item.size})` : ''} (x${item.quantity}) — ${inr(item.price * item.quantity)}`
    ).join('\n') + (order.discount > 0 ? `\nCoupon ${order.couponCode}: −${inr(order.discount)}` : '');

const shippingAddress = (order: any): string => {
    const a = order.customerAddress || {};
    return `${a.street}, ${a.city}, ${a.state} - ${a.pincode}, ${a.country || 'India'}`;
};

export async function postToBridge(payload: Record<string, any>): Promise<EmailResult> {
    if (!BRIDGE_URL) return 'failed: email bridge URL is not configured on the server';
    try {
        const res = await fetch(BRIDGE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, secret: process.env.EMAIL_BRIDGE_SECRET || '' }),
        });
        const text = await res.text();
        let result = '';
        try { result = JSON.parse(text)?.result || ''; } catch { /* non-JSON reply */ }
        if (res.ok && result === 'success') return 'sent';
        const reason = result || `HTTP ${res.status}: ${text.slice(0, 120)}`;
        console.error('Email bridge rejected email:', payload.type, reason);
        return `failed: ${reason}`;
    } catch (err: any) {
        console.error('Email bridge unreachable:', err?.message);
        return `failed: ${err?.message || 'network error'}`;
    }
}

export function buildAdminPayload(orderId: string, order: any) {
    const isCOD = order.paymentMethod === 'cod';
    return {
        type: 'admin_notification',
        to_name: 'Admin',
        to_email: ADMIN_EMAIL,
        from_name: order.customerName,
        customer_email: order.customerEmail || 'Not provided',
        customer_phone: order.customerPhone,
        order_id: orderId,
        order_total: inr(order.total),
        order_items: itemsList(order),
        shipping_address: shippingAddress(order),
        payment_method: isCOD ? 'Cash on Delivery (COD)' : 'Full Payment (Razorpay)',
        cod_breakdown: isCOD
            ? `Booking paid via Razorpay: ${inr(order.bookingAmount)} | Remaining: ${inr(order.remaining)} | COD fee (5%): ${inr(order.codFee)} | Due at door: ${inr(order.totalAtDoor)}`
            : 'Full payment — no COD charges',
        razorpay_payment_id: order.razorpayPaymentId || order.paymentId || '',
        order_date: formatDate(order.createdAt),
    };
}

export function buildCustomerPayload(orderId: string, order: any) {
    const isCOD = order.paymentMethod === 'cod';
    return {
        type: 'customer_confirmation',
        to_name: order.customerName,
        to_email: order.customerEmail,
        from_name: 'Wular Sports',
        order_id: orderId,
        order_total: inr(order.total),
        order_items: itemsList(order),
        shipping_address: shippingAddress(order),
        payment_method: isCOD ? 'Cash on Delivery (COD)' : 'Full Payment (Razorpay)',
        cod_breakdown: isCOD
            ? `\nBooking paid via Razorpay: ${inr(order.bookingAmount)}\nRemaining at delivery: ${inr(order.remaining)}\nCOD convenience fee (5%): ${inr(order.codFee)}\nAmount due at delivery: ${inr(order.totalAtDoor)}`
            : '',
        razorpay_payment_id: order.razorpayPaymentId || order.paymentId || '',
        order_date: formatDate(order.createdAt),
    };
}

/** Send whichever of the two emails `want` asks for; returns per-recipient results. */
export async function sendOrderEmails(
    orderId: string,
    order: any,
    want: { admin: boolean; customer: boolean } = { admin: true, customer: true }
): Promise<EmailStatus> {
    const [admin, customer] = await Promise.all([
        want.admin ? postToBridge(buildAdminPayload(orderId, order)) : Promise.resolve(undefined),
        want.customer
            ? (order.customerEmail ? postToBridge(buildCustomerPayload(orderId, order)) : Promise.resolve('skipped' as EmailResult))
            : Promise.resolve(undefined),
    ]);
    const status: EmailStatus = {};
    if (admin !== undefined) status.admin = admin;
    if (customer !== undefined) status.customer = customer;
    return status;
}

export interface ConfirmResult {
    found: boolean;
    emails?: EmailStatus;
    /** true when an email that should have gone out failed — caller may retry */
    emailFailed: boolean;
}

/**
 * Mark a paid order confirmed and send any order emails not yet sent.
 * Idempotent: safe to call from the verify endpoint, the webhook, and the
 * admin panel, in any order and any number of times.
 */
export async function confirmPaidOrder(
    ref: DocumentReference,
    paymentId?: string
): Promise<ConfirmResult> {
    const claim = await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists) return null;
        const o = snap.data()!;
        const update: Record<string, any> = { updatedAt: FieldValue.serverTimestamp() };

        if (o.status === 'pending') {
            update.status = 'confirmed';
            // COD keeps paymentStatus 'pending' (balance due at the door)
            update.paymentStatus = o.paymentMethod === 'full' ? 'completed' : 'pending';
        }
        if (paymentId && !o.paymentId) {
            update.paymentId = paymentId;
            update.razorpayPaymentId = paymentId;
        }

        const prev: EmailStatus = o.emailStatus || {};
        const want = {
            admin: prev.admin !== 'sent',
            customer: !!o.customerEmail && prev.customer !== 'sent',
        };
        const locked = o.emailLockUntil && o.emailLockUntil.toMillis() > Date.now();
        const shouldSend = (want.admin || want.customer) && !locked;
        if (shouldSend) update.emailLockUntil = Timestamp.fromMillis(Date.now() + LOCK_MS);

        tx.update(ref, update);
        const order: Record<string, any> = { ...o };
        if (update.paymentId) {
            order.paymentId = paymentId;
            order.razorpayPaymentId = paymentId;
        }
        return {
            order,
            want: shouldSend ? want : null,
            prev,
        };
    });

    if (!claim) return { found: false, emailFailed: false };
    if (!claim.want) return { found: true, emails: claim.prev, emailFailed: false };

    const sent = await sendOrderEmails(ref.id, claim.order, claim.want);
    const merged: EmailStatus = { ...claim.prev, ...sent };
    await ref.update({
        emailStatus: merged,
        emailLockUntil: FieldValue.delete(),
        ...(merged.admin === 'sent' && !claim.order.notifiedAt ? { notifiedAt: FieldValue.serverTimestamp() } : {}),
    });

    const failed = (r?: EmailResult) => !!r && r !== 'sent' && r !== 'skipped';
    return { found: true, emails: merged, emailFailed: failed(merged.admin) || failed(merged.customer) };
}

/** Look up our order by the Razorpay order id stored at checkout. */
export async function findOrderByRazorpayOrderId(rzpOrderId: string): Promise<DocumentReference | null> {
    const snap = await db.collection('orders').where('razorpayOrderId', '==', rzpOrderId).limit(1).get();
    return snap.empty ? null : snap.docs[0].ref;
}
