import emailjs from '@emailjs/browser';
import { Order } from './orders';
import { CartItem } from '../types';

/**
 * Send order confirmation email to customer
 */
export const sendOrderConfirmation = async (order: Order | any) => {
    try {
        const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || "your-service-id";
        const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "your-template-id";
        const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "your-public-key";

        if (!serviceId || !templateId || !publicKey) {
            console.warn("EmailJS credentials missing. Skipping email.");
            return;
        }

        // Format items for email
        const itemsList = order.items.map((item: CartItem) =>
            `${item.name} (x${item.quantity}) - ₹${item.price}`
        ).join('\n');

        const templateParams = {
            to_name: order.customerName,
            to_email: order.customerEmail,
            order_id: order.id || order.orderNumber, // Use generated ID if available
            order_total: `₹${order.total}`,
            order_items: itemsList,
            shipping_address: `${order.customerAddress.street}, ${order.customerAddress.city}, ${order.customerAddress.pincode}`,
            customer_phone: order.customerPhone,
            payment_method: order.paymentMethod.toUpperCase()
        };

        const response = await emailjs.send(serviceId, templateId, templateParams, publicKey);
        console.log('Order confirmation email sent!', response.status, response.text);
        return true;
    } catch (error) {
        console.error('Failed to send order confirmation email:', error);
        return false;
    }
};
