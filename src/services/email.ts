import { Order } from './orders';

export const sendOrderConfirmation = async (order: Order | any) => {
    if (!order.customerEmail) return;

    try {
        const bridgeUrl = process.env.NEXT_PUBLIC_EMAIL_BRIDGE_URL;
        if (!bridgeUrl) return;

        const itemsList = order.items.map((item: any) =>
            `${item.productName || item.name} (x${item.quantity}) — ₹${(item.price * item.quantity).toLocaleString('en-IN')}`
        ).join('\n');

        const isCOD = order.paymentMethod === 'cod';
        const codBreakdown = isCOD
            ? `\nBooking paid via Razorpay: ₹${order.bookingAmount?.toLocaleString('en-IN') || 0}\nRemaining at delivery: ₹${order.remaining?.toLocaleString('en-IN') || 0}\nCOD convenience fee (5%): ₹${order.codFee?.toLocaleString('en-IN') || 0}\nAmount due at delivery: ₹${order.totalAtDoor?.toLocaleString('en-IN') || 0}`
            : '';

        const payload = {
            type: 'customer_confirmation',
            to_name: order.customerName,
            to_email: order.customerEmail,
            from_name: 'Wular Sports',
            order_id: order.id || order.orderNumber,
            order_total: `₹${order.total?.toLocaleString('en-IN')}`,
            order_items: itemsList,
            shipping_address: `${order.customerAddress.street}, ${order.customerAddress.city}, ${order.customerAddress.state} - ${order.customerAddress.pincode}, ${order.customerAddress.country || 'India'}`,
            payment_method: isCOD ? 'Cash on Delivery (COD)' : 'Full Payment (Razorpay)',
            cod_breakdown: codBreakdown,
            razorpay_payment_id: order.razorpayPaymentId || '',
            order_date: new Date().toLocaleString('en-IN')
        };

        await fetch(bridgeUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        console.log('Customer order confirmation triggered.');
        return true;
    } catch (error) {
        console.error('Failed to send customer order confirmation:', error);
        return false;
    }
};

export const sendAdminOrderNotification = async (order: Order | any) => {
    try {
        const bridgeUrl = process.env.NEXT_PUBLIC_EMAIL_BRIDGE_URL;
        if (!bridgeUrl) {
            console.warn('NEXT_PUBLIC_EMAIL_BRIDGE_URL missing — skipping admin notification.');
            return;
        }

        const itemsList = order.items.map((item: any) =>
            `${item.productName || item.name} (x${item.quantity}) — ₹${(item.price * item.quantity).toLocaleString('en-IN')}`
        ).join('\n');

        const isCOD = order.paymentMethod === 'cod';
        const codBreakdown = isCOD
            ? `Booking paid via Razorpay: ₹${order.bookingAmount?.toLocaleString('en-IN') || 0} | Remaining: ₹${order.remaining?.toLocaleString('en-IN') || 0} | COD fee (5%): ₹${order.codFee?.toLocaleString('en-IN') || 0} | Due at door: ₹${order.totalAtDoor?.toLocaleString('en-IN') || 0}`
            : 'Full payment — no COD charges';

        const payload = {
            type: 'admin_notification',
            to_name: 'Admin',
            to_email: process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'moinwani91@gmail.com',
            from_name: order.customerName,
            customer_email: order.customerEmail || 'Not provided',
            customer_phone: order.customerPhone,
            order_id: order.id || order.orderNumber,
            order_total: `₹${order.total?.toLocaleString('en-IN')}`,
            order_items: itemsList,
            shipping_address: `${order.customerAddress.street}, ${order.customerAddress.city}, ${order.customerAddress.state} - ${order.customerAddress.pincode}, ${order.customerAddress.country || 'India'}`,
            payment_method: isCOD ? 'Cash on Delivery (COD)' : 'Full Payment (Razorpay)',
            cod_breakdown: codBreakdown,
            razorpay_payment_id: order.razorpayPaymentId || '',
            order_date: new Date().toLocaleString('en-IN')
        };

        await fetch(bridgeUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        console.log('Admin order notification triggered.');
        return true;
    } catch (error) {
        console.error('Failed to trigger admin order notification:', error);
        return false;
    }
};
