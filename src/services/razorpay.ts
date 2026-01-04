// Razorpay API Service
// Handles communication with backend API for Razorpay payments

const API_BASE_URL = import.meta.env.VITE_RAZORPAY_BACKEND_URL || '/api';

export interface CreateOrderRequest {
    amount: number;
    currency?: string;
    receipt?: string;
    notes?: Record<string, string>;
}

export interface CreateOrderResponse {
    id: string;
    amount: number;
    currency: string;
    receipt: string;
    status: string;
}

export interface VerifyPaymentRequest {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

export interface VerifyPaymentResponse {
    success: boolean;
    order_id?: string;
    payment_id?: string;
    message?: string;
    error?: string;
}

/**
 * Create Razorpay order on backend
 */
export const createRazorpayOrder = async (data: CreateOrderRequest): Promise<CreateOrderResponse> => {
    try {
        const response = await fetch(`${API_BASE_URL}/create-razorpay-order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: data.amount,
                currency: data.currency || 'INR',
                receipt: data.receipt,
                notes: data.notes || {},
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create order');
        }

        return await response.json();
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        throw error;
    }
};

/**
 * Verify payment signature on backend
 */
export const verifyPayment = async (data: VerifyPaymentRequest): Promise<VerifyPaymentResponse> => {
    try {
        const response = await fetch(`${API_BASE_URL}/verify-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                razorpay_order_id: data.razorpay_order_id,
                razorpay_payment_id: data.razorpay_payment_id,
                razorpay_signature: data.razorpay_signature,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to verify payment');
        }

        return await response.json();
    } catch (error) {
        console.error('Error verifying payment:', error);
        throw error;
    }
};

