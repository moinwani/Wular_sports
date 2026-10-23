import type { CouponDef } from '../lib/marketing';

/**
 * Coupons that work even before anything is set up in the admin panel.
 * Creating a coupon with the same code in Admin → Marketing → Coupons
 * overrides it (e.g. to switch WELCOME100 off). The server always
 * recomputes the discount; the browser copy is only for instant feedback.
 */
export const BUILT_IN_COUPONS: CouponDef[] = [
    { code: 'WELCOME100', type: 'per_bat', value: 100, active: true, builtIn: true, note: 'Welcome offer (exit popup)' },
];

export const normalizeCouponCode = (code: string): string => code.trim().toUpperCase();
