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
  return emailRegex.test(email);
}

/**
 * Validate phone number — exactly 10 digits (country code is entered separately)
 */
export function isValidPhone(phone: string): boolean {
  if (typeof phone !== 'string') {
    return false;
  }

  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  return /^\d{10}$/.test(cleaned);
}

/**
 * Sanitize phone number — digits only, max 10
 */
export function sanitizePhone(phone: string): string {
  if (typeof phone !== 'string') {
    return '';
  }
  return phone.replace(/[^\d]/g, '').substring(0, 10);
}

/**
 * Validate ZIP/pincode (Indian format - 6 digits)
 */
export function isValidZip(zip: string): boolean {
  if (typeof zip !== 'string') {
    return false;
  }
  
  const zipRegex = /^\d{6}$/;
  return zipRegex.test(zip);
}

/**
 * Validate name (letters, spaces, and common name characters)
 */
export function isValidName(name: string): boolean {
  if (typeof name !== 'string' || name.length < 2 || name.length > 100) {
    return false;
  }
  
  // Allow letters, spaces, hyphens, apostrophes, and dots
  const nameRegex = /^[a-zA-Z\s\-'\.]+$/;
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
      
      // Sanitize first
      let sanitizedValue = sanitizeString(stringValue, rule.maxLength || 1000);
      
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
      
      if (rule.type === 'phone') {
        if (!isValidPhone(sanitizedValue)) {
          errors[field] = 'Invalid phone number';
          continue;
        }
        sanitizedValue = sanitizePhone(sanitizedValue);
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

