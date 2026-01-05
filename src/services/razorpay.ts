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
    const API_BASE_URL = import.meta.env.VITE_RAZORPAY_BACKEND_URL || '/api';
    
    console.log('Creating Razorpay order:', {
        url: `${API_BASE_URL}/create-razorpay-order`,
        amount: data.amount,
        backendUrl: API_BASE_URL
    });

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

        console.log('Razorpay order response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('Razorpay order creation failed:', errorData);
            throw new Error(errorData.error || errorData.message || `Failed to create order (${response.status})`);
        }

        const result = await response.json();
        console.log('Razorpay order created successfully:', result);
        return result;
    } catch (error: any) {
        console.error('Error creating Razorpay order:', error);
        
        // Provide more specific error messages
        if (error.message) {
            throw error;
        } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Network error: Cannot reach payment server. Please check your internet connection.');
        } else {
            throw new Error('Failed to create payment order. Please try again.');
        }
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

