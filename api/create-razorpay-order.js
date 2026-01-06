// Vercel Serverless Function - Create Razorpay Order
// This runs on your backend (Vercel serverless) - SECURE
// Following OWASP best practices for security

import Razorpay from 'razorpay';
import rateLimit from '../_middleware/rate-limiter.js';
import { validateSchema } from '../_middleware/input-validator.js';
import setSecurityHeaders from '../_middleware/security-headers.js';

// Validation schema for create order request
const createOrderSchema = {
  amount: {
    required: true,
    type: 'number',
  },
  currency: {
    required: false,
    type: 'string',
    maxLength: 3,
  },
  receipt: {
    required: false,
    type: 'string',
    maxLength: 100,
  },
  notes: {
    required: false,
    type: 'object',
    schema: {
      order_id: { required: false, type: 'string', maxLength: 100 },
      customer_name: { required: false, type: 'string', maxLength: 200 },
      customer_email: { required: false, type: 'string', maxLength: 254, format: 'email' },
      customer_phone: { required: false, type: 'string', maxLength: 15, format: 'phone' },
      address: { required: false, type: 'string', maxLength: 500 },
    },
  },
};

export default async function handler(req, res) {
  // Set security headers (OWASP best practices)
  setSecurityHeaders(res);

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Apply rate limiting
  const rateLimitResult = rateLimit(req, res);
  if (!rateLimitResult.allowed) {
    return; // Response already sent by rate limiter
  }

  try {
    // Strict input validation & sanitization
    const validation = validateSchema(req.body, createOrderSchema);

    if (!validation.valid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors,
      });
    }

    const { amount, currency = 'INR', receipt, notes } = validation.sanitized;

    // Additional amount validation (must be positive and within limits)
    if (amount <= 0 || amount > 1000000) {
      return res.status(400).json({
        error: 'Invalid amount',
        message: 'Amount must be between 1 and 10,00,000 INR'
      });
    }

    // Validate currency (only allow INR for now)
    if (currency !== 'INR') {
      return res.status(400).json({
        error: 'Invalid currency',
        message: 'Only INR currency is supported'
      });
    }

    // Initialize Razorpay with credentials from environment
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Create Razorpay order
    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes: notes || {},
    };

    const order = await razorpay.orders.create(options);

    // Return order details (without sensitive info)
    return res.status(200).json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status,
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return res.status(500).json({
      error: 'Failed to create order',
      message: error.message || 'Internal server error',
    });
  }
};
