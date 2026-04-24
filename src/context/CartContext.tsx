import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, ProductFull } from '../types';
import { cartStorage } from '../utils/localStorage';

interface CartContextType {
    cart: CartItem[];
    cartItemCount: number;
    isCartOpen: boolean;
    openCart: () => void;
    closeCart: () => void;
    addToCart: (product: ProductFull, size: string | null, quantity?: number) => void;
    removeFromCart: (id: string, size?: string) => void;
    updateQuantity: (id: string, quantity: number, size?: string) => void;
    cartTotal: number;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    useEffect(() => {
        const saved = cartStorage.load();
        if (saved.length > 0) setCart(saved);
    }, []);

    useEffect(() => {
        cartStorage.save(cart);
    }, [cart]);

    const addToCart = (product: ProductFull, size: string | null, quantity = 1) => {
        setCart(prev => {
            const sizeKey = size || 'default';
            const existing = prev.find(item => item.id === product.id && (item.size || 'default') === sizeKey);
            if (existing) {
                return prev.map(item =>
                    item.id === product.id && (item.size || 'default') === sizeKey
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }
            return [...prev, { ...product, size: size || undefined, quantity }];
        });
        setIsCartOpen(true);
    };

    const removeFromCart = (id: string, size?: string) => {
        const sizeKey = size || 'default';
        setCart(prev => prev.filter(item => !(item.id === id && (item.size || 'default') === sizeKey)));
    };

    const updateQuantity = (id: string, quantity: number, size?: string) => {
        const sizeKey = size || 'default';
        setCart(prev => prev.map(item =>
            item.id === id && (item.size || 'default') === sizeKey
                ? { ...item, quantity: Math.max(1, quantity) }
                : item
        ));
    };

    const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
    const cartTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

    return (
        <CartContext.Provider value={{
            cart, cartItemCount, isCartOpen,
            openCart: () => setIsCartOpen(true),
            closeCart: () => setIsCartOpen(false),
            addToCart, removeFromCart, updateQuantity, cartTotal
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error('useCart must be inside CartProvider');
    return ctx;
}
