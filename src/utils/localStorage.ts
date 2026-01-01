import { CartItem } from '../types';

const CART_STORAGE_KEY = 'wular_sports_cart';

export const cartStorage = {
    save: (cart: CartItem[]): void => {
        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        } catch (error) {
            console.error('Failed to save cart to localStorage:', error);
        }
    },

    load: (): CartItem[] => {
        try {
            const stored = localStorage.getItem(CART_STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Failed to load cart from localStorage:', error);
            return [];
        }
    },

    clear: (): void => {
        try {
            localStorage.removeItem(CART_STORAGE_KEY);
        } catch (error) {
            console.error('Failed to clear cart from localStorage:', error);
        }
    }
};
