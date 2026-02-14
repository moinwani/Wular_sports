import { Order } from './orders';

/**
 * Send order notification email to ADMIN via Google Apps Script secure bridge
 */
export const sendAdminOrderNotification = async (order: Order | any) => {
    try {
        const bridgeUrl = import.meta.env.VITE_EMAIL_BRIDGE_URL;

        if (!bridgeUrl) {
            console.warn("Email Bridge URL (VITE_EMAIL_BRIDGE_URL) missing. Skipping notification.");
            return;
        }

        // Format items for email
        const itemsList = order.items.map((item: any) =>
            `${item.productName || item.name} (x${item.quantity}) - ₹${item.price}`
        ).join('\n');

        const payload = {
            to_name: "Admin",
            to_email: "moinwani91@gmail.com",
            from_name: order.customerName,
            customer_email: order.customerEmail,
            customer_phone: order.customerPhone,
            order_id: order.id || order.orderNumber,
            order_total: `₹${order.total}`,
            order_items: itemsList,
            shipping_address: `${order.customerAddress.street}, ${order.customerAddress.city}, ${order.customerAddress.state} - ${order.customerAddress.pincode}`,
            payment_method: (order.paymentMethod || 'N/A').toUpperCase(),
            order_date: new Date().toLocaleString('en-IN')
        };

        // Send to Google Apps Script bridge
        await fetch(bridgeUrl, {
            method: 'POST',
            mode: 'no-cors', // Apps Script requires no-cors for simple triggers
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        console.log('Admin order notification triggered via Bridge.');
        return true;
    } catch (error) {
        console.error('Failed to trigger admin order notification:', error);
        return false;
    }
};
