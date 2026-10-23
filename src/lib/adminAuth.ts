import type { NextApiRequest } from 'next';
import { auth } from './firebaseAdmin';
import { ADMIN_EMAIL } from '../data/constants';

/** True when the request carries a Firebase token for the store owner (or an admin claim). */
export async function isAdminRequest(req: NextApiRequest): Promise<boolean> {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return false;
    try {
        const t = await auth.verifyIdToken(header.split('Bearer ')[1]);
        return t.admin === true ||
            (t.email_verified === true && t.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase());
    } catch {
        return false;
    }
}
