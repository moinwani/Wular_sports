/**
 * Coupon definitions — shared by the checkout UI and the payment API.
 * The server ALWAYS recomputes the discount from this table; the client
 * copy is only for instant feedback in the UI.
 */

export interface Coupon {
    /** Flat discount in ₹ applied per bat in the cart */
    perBat: number;
    label: string;
}

export const COUPONS: Record<string, Coupon> = {
    WELCOME100: { perBat: 100, label: '₹100 off per bat' },
};

export const getCoupon = (code: string | null | undefined): Coupon | null => {
    if (!code || typeof code !== 'string') return null;
    return COUPONS[code.trim().toUpperCase()] || null;
};

export const normalizeCouponCode = (code: string): string => code.trim().toUpperCase();
