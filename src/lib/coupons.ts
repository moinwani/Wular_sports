import { db } from './firebaseAdmin';
import { BUILT_IN_COUPONS } from '../data/coupons';
import { CouponDef, couponLive, normalizeCode } from './marketing';

/**
 * Server-side coupon lookup: a coupon saved in the admin panel
 * (coupons/{CODE}) wins over a built-in one with the same code.
 * Returns null when the code doesn't exist, is switched off, or has expired.
 */
export async function resolveCoupon(raw: unknown): Promise<CouponDef | null> {
    const code = normalizeCode(raw);
    if (!code) return null;
    const builtIn = BUILT_IN_COUPONS.find(c => c.code === code);
    let def: CouponDef | undefined;
    try {
        const snap = await db.collection('coupons').doc(code).get();
        def = snap.exists ? ({ ...(snap.data() as CouponDef), code }) : builtIn;
    } catch (err) {
        // Firestore unreachable: built-in coupons keep working, others can't be checked
        if (!builtIn) throw err;
        def = builtIn;
    }
    if (!def || !couponLive(def)) return null;
    if (def.type !== 'per_bat' && def.type !== 'percent') return null;
    if (!(Number(def.value) > 0)) return null;
    return { ...def, value: Number(def.value) };
}
