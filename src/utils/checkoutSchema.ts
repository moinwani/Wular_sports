import { ValidationSchema } from './inputValidation';

// Shared between the checkout form (client) and the order APIs (server) so
// both sides validate shipping details identically.
// Phone and ZIP rules adapt to the selected country so international
// customers aren't blocked by India-only formats.
export const buildCheckoutSchema = (isIndianPhone: boolean, isIndiaOrder: boolean): ValidationSchema => ({
    firstName: { required: true, type: 'name', minLength: 2, maxLength: 50 },
    lastName: { required: false, type: 'name', minLength: 1, maxLength: 50 },
    email: { required: true, type: 'email', maxLength: 254 },
    phone: isIndianPhone
        ? { required: true, type: 'phone', minLength: 10, maxLength: 10 }
        : { required: true, type: 'string', minLength: 6, maxLength: 15, pattern: /^\d{6,15}$/ },
    countryCode: { required: false, type: 'string', minLength: 1, maxLength: 7 },
    address: { required: true, type: 'address', minLength: 10, maxLength: 500 },
    city: { required: true, type: 'string', minLength: 2, maxLength: 100 },
    state: { required: true, type: 'string', minLength: 2, maxLength: 100 },
    zip: isIndiaOrder
        ? { required: true, type: 'zip', maxLength: 6 }
        : { required: true, type: 'string', minLength: 3, maxLength: 10, pattern: /^[A-Za-z0-9][A-Za-z0-9\s\-]{2,9}$/ },
    country: { required: true, type: 'string', minLength: 2, maxLength: 100 },
    paymentMethod: { required: true, type: 'string' },
});
