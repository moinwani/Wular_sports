import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../src/lib/firebaseAdmin';
import { isAdminRequest } from '../../../src/lib/adminAuth';
import { ADMIN_EMAIL } from '../../../src/data/constants';
import { confirmPaidOrder, sendOrderEmails } from '../../../src/lib/orderNotifications';

/**
 * Admin-only email tools:
 *  - { action: 'test' }                → send a sample admin + customer email to the owner
 *  - { action: 'confirm', orderId }    → mark a paid-but-stuck order confirmed + send unsent emails
 *  - { action: 'resend', orderId }     → re-send both emails for an order
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    if (!(await isAdminRequest(req))) {
        return res.status(403).json({ error: 'Admin access required' });
    }

    const { action, orderId } = req.body || {};

    if (action === 'test') {
        const sample = {
            customerName: 'Test Customer',
            customerEmail: ADMIN_EMAIL,
            customerPhone: '+910000000000',
            customerAddress: { street: 'TEST — 1 Sample Street', city: 'Srinagar', state: 'Jammu & Kashmir', pincode: '190001', country: 'India' },
            items: [{ productName: 'TEST EMAIL — no real order', price: 0, quantity: 1 }],
            total: 0, discount: 0, paymentMethod: 'full',
        };
        const emails = await sendOrderEmails('TEST-EMAIL', sample);
        return res.status(200).json({ emails });
    }

    if (typeof orderId !== 'string' || !orderId) {
        return res.status(400).json({ error: 'orderId is required' });
    }
    const ref = db.collection('orders').doc(orderId);

    if (action === 'confirm') {
        const result = await confirmPaidOrder(ref);
        if (!result.found) return res.status(404).json({ error: 'Order not found' });
        return res.status(200).json({ emails: result.emails });
    }

    if (action === 'resend') {
        const snap = await ref.get();
        if (!snap.exists) return res.status(404).json({ error: 'Order not found' });
        const emails = await sendOrderEmails(ref.id, snap.data());
        await ref.update({ emailStatus: emails });
        return res.status(200).json({ emails });
    }

    return res.status(400).json({ error: 'Unknown action' });
}
