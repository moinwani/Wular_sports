// Input Validation & Sanitization Utilities for Frontend
// Implements strict validation following OWASP best practices

/**
 * Sanitize string input - remove potentially dangerous characters
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
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
export function isValidEmail(email: string): boolean {
  if (typeof email !== 'string' || email.length > 254) {
    return false;
  }
  
  // RFC 5322 compliant email regex (simplified but secure)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  // …and the domain must end in a real ending (.com, .in, …) — "name@gmail"
  // would pass the pattern above, but the confirmation email could never arrive
  return emailRegex.test(email) && /\.[a-zA-Z]{2,}$/.test(email);
}

/**
 * An Indian mobile number as the 10 digits after +91, from however it was
 * typed, pasted or autofilled: "98765 43210", "+91 98765 43210",
 * "09876543210", "919876543210" all become "9876543210". Anything that isn't
 * one of those shapes is returned as its digits (and then fails validation)
 * — never cut down to 10 digits, which used to turn "09876543210" into the
 * wrong number "0987654321".
 */
export function normalizeIndianPhone(phone: string): string {
  const d = String(phone ?? '').replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('0')) return d.slice(1);
  if (d.length === 12 && d.startsWith('91')) return d.slice(2);
  if (d.length === 13 && d.startsWith('091')) return d.slice(3);
  if (d.length === 14 && d.startsWith('0091')) return d.slice(4);
  return d;
}

/**
 * Validate an Indian mobile number (country code is entered separately):
 * 10 digits starting 6–9, in any of the shapes normalizeIndianPhone accepts
 */
export function isValidPhone(phone: string): boolean {
  if (typeof phone !== 'string') {
    return false;
  }
  return /^[6-9]\d{9}$/.test(normalizeIndianPhone(phone));
}

/**
 * Sanitize phone number — the 10-digit form
 */
export function sanitizePhone(phone: string): string {
  if (typeof phone !== 'string') {
    return '';
  }
  return normalizeIndianPhone(phone);
}

/**
 * Validate ZIP/pincode (Indian format - 6 digits)
 */
export function isValidZip(zip: string): boolean {
  if (typeof zip !== 'string') {
    return false;
  }
  
  // 6 digits, never starting with 0 (no Indian PIN code does)
  const zipRegex = /^[1-9]\d{5}$/;
  return zipRegex.test(zip);
}

/**
 * Validate name (letters, spaces, and common name characters)
 */
export function isValidName(name: string): boolean {
  // Length limits come from the form's schema (a last name like "K" is fine)
  if (typeof name !== 'string' || name.length < 1 || name.length > 100) {
    return false;
  }
  
  // Letters in any script (so "राहुल" works too), spaces, hyphens, apostrophes and dots
  const nameRegex = /^[\p{L}\p{M}\s\-'\.]+$/u;
  return nameRegex.test(name);
}

/**
 * Validate address (alphanumeric with common address characters)
 */
export function isValidAddress(address: string): boolean {
  if (typeof address !== 'string' || address.length < 10 || address.length > 500) {
    return false;
  }
  
  // Allow alphanumeric, spaces, and common address characters
  // Sanitize for safety
  const sanitized = sanitizeString(address, 500);
  return sanitized.length >= 10;
}

/**
 * Validation schema interface
 */
export interface ValidationRule {
  required?: boolean;
  type: 'string' | 'number' | 'email' | 'phone' | 'zip' | 'name' | 'address';
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

/**
 * Validate data against schema
 */
export function validateFormData(data: Record<string, any>, schema: ValidationSchema): {
  valid: boolean;
  errors: Record<string, string>;
  sanitized: Record<string, any> | null;
} {
  const errors: Record<string, string> = {};
  const sanitized: Record<string, any> = {};
  
  // Check for unexpected fields
  const allowedFields = Object.keys(schema);
  const providedFields = Object.keys(data);
  const unexpectedFields = providedFields.filter(field => !allowedFields.includes(field));
  
  if (unexpectedFields.length > 0) {
    return {
      valid: false,
      errors: { _general: `Unexpected fields: ${unexpectedFields.join(', ')}` },
      sanitized: null,
    };
  }
  
  // Validate each field
  for (const [field, rule] of Object.entries(schema)) {
    const value = data[field];
    
    // Check required fields
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors[field] = `${field} is required`;
      continue;
    }
    
    // Skip validation if field is optional and not provided
    if (!rule.required && (value === undefined || value === null || value === '')) {
      continue;
    }
    
    // Type validation
    if (rule.type === 'string' || rule.type === 'email' || rule.type === 'phone' || 
        rule.type === 'zip' || rule.type === 'name' || rule.type === 'address') {
      const stringValue = typeof value === 'string' ? value : String(value);
      
      // Sanitize first — without cutting it short: something too long is
      // rejected below rather than quietly chopped (which could drop the end
      // of an address or the last digit of a phone number)
      let sanitizedValue = sanitizeString(stringValue, 100000);

      // Phone numbers: read the 10 digits out of "+91 98765 43210" etc. before
      // checking the length
      if (rule.type === 'phone') {
        sanitizedValue = normalizeIndianPhone(sanitizedValue);
      }
      
      // Length validation
      if (rule.minLength && sanitizedValue.length < rule.minLength) {
        errors[field] = `Must be at least ${rule.minLength} characters`;
        continue;
      }
      
      if (rule.maxLength && sanitizedValue.length > rule.maxLength) {
        errors[field] = `Must not exceed ${rule.maxLength} characters`;
        continue;
      }
      
      // Format validation
      if (rule.type === 'email' && !isValidEmail(sanitizedValue)) {
        errors[field] = 'Invalid email address';
        continue;
      }
      
      if (rule.type === 'phone' && !isValidPhone(sanitizedValue)) {
        errors[field] = 'Enter a 10-digit mobile number';
        continue;
      }
      
      if (rule.type === 'zip' && !isValidZip(sanitizedValue)) {
        errors[field] = 'Invalid 6-digit pincode';
        continue;
      }
      
      if (rule.type === 'name' && !isValidName(sanitizedValue)) {
        errors[field] = 'Invalid name format';
        continue;
      }
      
      if (rule.type === 'address' && !isValidAddress(sanitizedValue)) {
        errors[field] = 'Invalid address format';
        continue;
      }
      
      // Pattern validation if provided
      if (rule.pattern && !rule.pattern.test(sanitizedValue)) {
        errors[field] = 'Invalid format';
        continue;
      }
      
      // Custom validation if provided
      if (rule.custom && !rule.custom(sanitizedValue)) {
        errors[field] = 'Invalid value';
        continue;
      }
      
      sanitized[field] = sanitizedValue;
    } else if (rule.type === 'number') {
      const numValue = typeof value === 'number' ? value : parseFloat(String(value));
      
      if (isNaN(numValue) || !isFinite(numValue)) {
        errors[field] = 'Must be a valid number';
        continue;
      }
      
      sanitized[field] = numValue;
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors,
    sanitized: Object.keys(errors).length === 0 ? sanitized : null,
  };
}

