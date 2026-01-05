import { useState, useCallback } from 'react';

const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

export const useRazorpay = () => {
    const [isLoaded, setIsLoaded] = useState(false);

    const loadRazorpay = useCallback(() => {
        return new Promise((resolve) => {
            // Check if Razorpay is already loaded
            if (isLoaded && window.Razorpay) {
                console.log('Razorpay already loaded');
                resolve(true);
                return;
            }

            // Check if script is already in DOM
            const existingScript = document.querySelector(`script[src="${RAZORPAY_SCRIPT_URL}"]`);
            if (existingScript) {
                // Script exists, wait for it to load
                existingScript.addEventListener('load', () => {
                    if (window.Razorpay) {
                        setIsLoaded(true);
                        console.log('Razorpay loaded from existing script');
                        resolve(true);
                    } else {
                        console.error('Script loaded but Razorpay not available');
                        resolve(false);
                    }
                });
                return;
            }

            // Create and load new script
            console.log('Loading Razorpay script...');
            const script = document.createElement('script');
            script.src = RAZORPAY_SCRIPT_URL;
            script.async = true;
            
            script.onload = () => {
                // Verify Razorpay is available
                if (window.Razorpay) {
                    setIsLoaded(true);
                    console.log('Razorpay script loaded successfully');
                    resolve(true);
                } else {
                    console.error('Razorpay script loaded but not available on window');
                    resolve(false);
                }
            };
            
            script.onerror = (error) => {
                console.error('Failed to load Razorpay script:', error);
                resolve(false);
            };
            
            document.body.appendChild(script);
        });
    }, [isLoaded]);

    return { isLoaded, loadRazorpay };
};
