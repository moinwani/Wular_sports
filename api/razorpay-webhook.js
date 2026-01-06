// Vercel Serverless Function - Razorpay Webhook Handler
// Handles payment status updates from Razorpay
// Following OWASP best practices for security

import crypto from 'crypto';
import setSecurityHeaders from '../_middleware/security-headers.js';

export default async function handler(req, res) {
  // Set security headers (OWASP best practices)
  setSecurityHeaders(res);

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate webhook payload structure
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    if (!webhookSecret) {
      // If webhook secret not configured, log but don't fail
      console.warn('Webhook secret not configured');
    }

    // Verify webhook signature if secret is available
    if (webhookSecret && signature) {
      const body = JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');

      if (expectedSignature !== signature) {
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }
    }

    const event = req.body.event;
    const payload = req.body.payload;

    // Handle different payment events
    switch (event) {
      case 'payment.captured':
        // Payment successful
        console.log('Payment captured:', payload.payment.entity);
        // Update your database here
        // You can call Firebase Admin SDK or your database service
        break;

      case 'payment.failed':
        // Payment failed
        console.log('Payment failed:', payload.payment.entity);
        // Update your database here
        break;

      case 'order.paid':
        // Order paid
        console.log('Order paid:', payload.order.entity);
        // Update your database here
        break;

      default:
        console.log('Unhandled webhook event:', event);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({
      error: 'Failed to process webhook',
      message: error.message || 'Internal server error',
    });
  }
};
