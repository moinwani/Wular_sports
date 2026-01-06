// Input Validation & Sanitization Middleware
// Implements strict schema-based validation following OWASP best practices

/**
 * Sanitize string input - remove potentially dangerous characters
 */
function sanitizeString(input, maxLength = 1000) {
  if (typeof input !== 'string') {
    return '';
  }

  // Trim whitespace
  let sanitized = input.trim();

  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // Remove null bytes and control characters (except newline and tab for addresses)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  return sanitized;
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  if (typeof email !== 'string' || email.length > 254) {
    return false;
  }

  // RFC 5322 compliant email regex (simplified but secure)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (Indian format)
 */
function isValidPhone(phone) {
  if (typeof phone !== 'string') {
    return false;
  }

  // Remove spaces, dashes, parentheses
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');

  // Indian phone: 10 digits, optionally prefixed with +91 or 0
  const phoneRegex = /^(\+91|0)?[6-9]\d{9}$/;
  return phoneRegex.test(cleaned) && cleaned.length >= 10 && cleaned.length <= 13;
}

/**
 * Validate and sanitize phone number
 */
function sanitizePhone(phone) {
  if (typeof phone !== 'string') {
    return '';
  }

  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');

  // Limit length
  if (cleaned.length > 15) {
    return cleaned.substring(0, 15);
  }

  return cleaned;
}

/**
 * Validate ZIP/pincode (Indian format - 6 digits)
 */
function isValidZip(zip) {
  if (typeof zip !== 'string') {
    return false;
  }

  const zipRegex = /^\d{6}$/;
  return zipRegex.test(zip);
}

/**
 * Validate amount (positive number with reasonable limits)
 */
function isValidAmount(amount) {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(num) || !isFinite(num)) {
    return false;
  }

  // Amount must be positive and within reasonable limits
  // Max: 10,00,000 INR (10 lakh)
  return num > 0 && num <= 1000000;
}

/**
 * Validate Razorpay order ID format
 */
function isValidRazorpayOrderId(orderId) {
  if (typeof orderId !== 'string') {
    return false;
  }

  // Razorpay order IDs are typically in format: order_xxxxx
  const orderIdRegex = /^order_[a-zA-Z0-9]{14,}$/;
  return orderIdRegex.test(orderId) && orderId.length <= 50;
}

/**
 * Validate Razorpay payment ID format
 */
function isValidRazorpayPaymentId(paymentId) {
  if (typeof paymentId !== 'string') {
    return false;
  }

  // Razorpay payment IDs are typically in format: pay_xxxxx
  const paymentIdRegex = /^pay_[a-zA-Z0-9]{14,}$/;
  return paymentIdRegex.test(paymentId) && paymentId.length <= 50;
}

/**
 * Validate Razorpay signature format (hex string)
 */
function isValidRazorpaySignature(signature) {
  if (typeof signature !== 'string') {
    return false;
  }

  // Razorpay signatures are hex strings (64 characters for SHA-256)
  const signatureRegex = /^[a-f0-9]{64}$/i;
  return signatureRegex.test(signature);
}

/**
 * Schema-based validator for request body
 */
function validateSchema(data, schema) {
  const errors = [];
  const sanitized = {};

  // Check for unexpected fields
  const allowedFields = Object.keys(schema);
  const providedFields = Object.keys(data);
  const unexpectedFields = providedFields.filter(field => !allowedFields.includes(field));

  if (unexpectedFields.length > 0) {
    errors.push(`Unexpected fields: ${unexpectedFields.join(', ')}`);
    return { valid: false, errors, sanitized: null };
  }

  // Validate each field
  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];

    // Check required fields
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`);
      continue;
    }

    // Skip validation if field is optional and not provided
    if (!rules.required && (value === undefined || value === null || value === '')) {
      continue;
    }

    // Type checking
    if (rules.type && typeof value !== rules.type) {
      errors.push(`${field} must be of type ${rules.type}`);
      continue;
    }

    // Length validation
    if (rules.type === 'string') {
      const sanitizedValue = sanitizeString(value, rules.maxLength || 1000);

      if (rules.minLength && sanitizedValue.length < rules.minLength) {
        errors.push(`${field} must be at least ${rules.minLength} characters`);
        continue;
      }

      if (rules.maxLength && sanitizedValue.length > rules.maxLength) {
        errors.push(`${field} must not exceed ${rules.maxLength} characters`);
        continue;
      }

      // Format validation
      if (rules.format === 'email' && !isValidEmail(sanitizedValue)) {
        errors.push(`${field} must be a valid email address`);
        continue;
      }

      if (rules.format === 'phone' && !isValidPhone(sanitizedValue)) {
        errors.push(`${field} must be a valid phone number`);
        continue;
      }

      if (rules.format === 'zip' && !isValidZip(sanitizedValue)) {
        errors.push(`${field} must be a valid 6-digit pincode`);
        continue;
      }

      if (rules.format === 'razorpay_order_id' && !isValidRazorpayOrderId(sanitizedValue)) {
        errors.push(`${field} must be a valid Razorpay order ID`);
        continue;
      }

      if (rules.format === 'razorpay_payment_id' && !isValidRazorpayPaymentId(sanitizedValue)) {
        errors.push(`${field} must be a valid Razorpay payment ID`);
        continue;
      }

      if (rules.format === 'razorpay_signature' && !isValidRazorpaySignature(sanitizedValue)) {
        errors.push(`${field} must be a valid Razorpay signature`);
        continue;
      }

      // Sanitize phone numbers
      if (rules.format === 'phone') {
        sanitized[field] = sanitizePhone(sanitizedValue);
      } else {
        sanitized[field] = sanitizedValue;
      }
    } else if (rules.type === 'number') {
      if (!isValidAmount(value)) {
        errors.push(`${field} must be a valid positive amount`);
        continue;
      }

      sanitized[field] = typeof value === 'string' ? parseFloat(value) : value;
    } else if (rules.type === 'object') {
      // For objects, validate nested schema if provided
      if (rules.schema) {
        const nestedValidation = validateSchema(value || {}, rules.schema);
        if (!nestedValidation.valid) {
          errors.push(...nestedValidation.errors.map(e => `${field}.${e}`));
          continue;
        }
        sanitized[field] = nestedValidation.sanitized;
      } else {
        sanitized[field] = value;
      }
    } else {
      sanitized[field] = value;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? sanitized : null,
  };
}

export {
  validateSchema,
  sanitizeString,
  sanitizePhone,
  isValidEmail,
  isValidPhone,
  isValidZip,
  isValidAmount,
  isValidRazorpayOrderId,
  isValidRazorpayPaymentId,
  isValidRazorpaySignature,
};

