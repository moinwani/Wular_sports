/**
 * Checks that an order document is one our checkout would have written and
 * that the money Razorpay took matches it — so a forged or tampered order
 * can never be marked paid. Pure code, used by the verify endpoint and the
 * Razorpay webhook.
 */

const COD_BOOKING_PER_BAT = 500;

/** What the customer pays online for this order (₹) */
export const onlineCharge = (o: any): number =>
    o?.paymentMethod === 'cod' ? Number(o.bookingAmount) || 0 : Number(o.total) || 0;

/**
 * Returns a plain-English problem, or null when the order is consistent.
 * `paidPaise` is the amount Razorpay says was charged for this order.
 */
export function orderProblem(o: any, paidPaise?: number | null): string | null {
    const items: any[] = Array.isArray(o?.items) ? o.items : [];
    if (!items.length) return 'order has no items';
    let subtotal = 0;
    let bats = 0;
    for (const it of items) {
        const price = Number(it?.price);
        const qty = Number(it?.quantity);
        if (!(price > 0) || !Number.isInteger(qty) || qty < 1) return 'an item has an invalid price or quantity';
        subtotal += price * qty;
        bats += qty;
    }
    const discount = Number(o.discount) || 0;
    if (discount < 0 || discount > subtotal) return 'discount is invalid';
    if (Math.round(Number(o.total)) !== Math.round(subtotal - discount)) return 'items and total don’t add up';
    if (o.paymentMethod === 'cod' && Number(o.bookingAmount) !== bats * COD_BOOKING_PER_BAT) return 'COD booking amount is wrong';
    if (paidPaise != null && Math.round(paidPaise) !== Math.round(onlineCharge(o) * 100)) {
        return `Razorpay charged ₹${(paidPaise / 100).toLocaleString('en-IN')} but the order needs ₹${onlineCharge(o).toLocaleString('en-IN')}`;
    }
    return null;
}
