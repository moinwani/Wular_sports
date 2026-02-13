import emailjs from '@emailjs/browser';

/**
 * Send order notification email to ADMIN
 */
export const sendAdminOrderNotification = async (order: any) => {
    try {
        const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
        const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
        const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

        if (!serviceId || !templateId || !publicKey) {
            console.warn("EmailJS credentials missing. Skipping admin notification.");
            return;
        }

        // Format items for email
        const itemsList = order.items.map((item: any) =>
            `${item.productName || item.name} (x${item.quantity}) - ₹${item.price}`
        ).join('\n');

        const templateParams = {
            to_name: "Admin",
            to_email: "wularsports@gmail.com", // Your admin email
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

        const response = await emailjs.send(serviceId, templateId, templateParams, publicKey);
        console.log('Admin order notification sent!', response.status, response.text);
        return true;
    } catch (error) {
        console.error('Failed to send admin order notification:', error);
        return false;
    }
};
