import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

const PIXEL_ID = '988733203744597';
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN || '';

function sha256(value: string): string {
    return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!ACCESS_TOKEN) {
        console.warn('Meta CAPI: META_CAPI_ACCESS_TOKEN not set');
        return res.status(200).json({ status: 'skipped', reason: 'no_token' });
    }

    try {
        const { event_id, email, phone, orderId, total, items } = req.body;

        if (!event_id || !orderId) {
            return res.status(400).json({ error: 'Missing event_id or orderId' });
        }

        const userData: Record<string, string> = {};
        if (email) userData.em = sha256(email);
        if (phone) userData.ph = sha256(phone.replace(/\D/g, ''));

        const payload = {
            data: [{
                event_name: 'Purchase',
                event_time: Math.floor(Date.now() / 1000),
                event_id,
                event_source_url: req.headers.referer || 'https://wularsports.com',
                action_source: 'website',
                user_data: {
                    ...userData,
                    client_ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '',
                    client_user_agent: req.headers['user-agent'] || '',
                },
                custom_data: {
                    currency: 'INR',
                    value: total || 0,
                    content_ids: (items || []).map((i: any) => i.id),
                    content_name: (items || []).map((i: any) => i.name).join(', ').substring(0, 100),
                    contents: (items || []).map((i: any) => ({
                        id: i.id,
                        quantity: i.quantity || 1,
                        item_price: i.price || 0,
                    })),
                    num_items: (items || []).reduce((sum: number, i: any) => sum + (i.quantity || 1), 0),
                },
            }],
            test_event_code: process.env.META_CAPI_TEST_CODE || undefined,
        };

        const response = await fetch(
            `https://graph.facebook.com/v18.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            }
        );

        const result = await response.json();
        if (!response.ok) {
            console.error('Meta CAPI error:', result);
            return res.status(200).json({ status: 'error', meta: result });
        }

        return res.status(200).json({ status: 'success', meta: result });
    } catch (error: any) {
        console.error('Meta CAPI handler error:', error);
        return res.status(200).json({ status: 'error', error: error.message });
    }
}
