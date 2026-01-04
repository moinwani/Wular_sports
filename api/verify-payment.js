// Vercel Serverless Function - Verify Razorpay Payment
// This verifies payment signatures - SECURE
// Following OWASP best practices for security

const crypto = require('crypto');
const rateLimit = require('../_middleware/rate-limiter');
const { validateSchema } = require('../_middleware/input-validator');
const setSecurityHeaders = require('../_middleware/security-headers');

// Validation schema for payment verification
const verifyPaymentSchema = {
  razorpay_order_id: {
    required: true,
    type: 'string',
    format: 'razorpay_order_id',
    maxLength: 50,
  },
  razorpay_payment_id: {
    required: true,
    type: 'string',
    format: 'razorpay_payment_id',
    maxLength: 50,
  },
  razorpay_signature: {
    required: true,
    type: 'string',
    format: 'razorpay_signature',
    maxLength: 64,
  },
};

module.exports = async function handler(req, res) {
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
    const validation = validateSchema(req.body, verifyPaymentSchema);
    
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors,
      });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = validation.sanitized;

    // Get secret from environment
    const secret = process.env.RAZORPAY_KEY_SECRET;

    // Create signature string
    const signatureString = `${razorpay_order_id}|${razorpay_payment_id}`;

    // Generate expected signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signatureString)
      .digest('hex');

    // Compare signatures
    const isSignatureValid = expectedSignature === razorpay_signature;

    if (!isSignatureValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment signature',
      });
    }

    // Payment verified successfully
    return res.status(200).json({
      success: true,
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      message: 'Payment verified successfully',
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to verify payment',
      message: error.message || 'Internal server error',
    });
  }
};
