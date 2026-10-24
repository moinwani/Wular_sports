import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, ProductFull } from '../types';
import { cartStorage } from '../utils/localStorage';
import { useCatalog } from './CatalogContext';

interface CartContextType {
    cart: CartItem[];
    cartItemCount: number;
    isCartOpen: boolean;
    openCart: () => void;
    closeCart: () => void;
    addToCart: (product: ProductFull, size: string | null, quantity?: number) => void;
    removeFromCart: (id: string, size?: string) => void;
    updateQuantity: (id: string, quantity: number, size?: string) => void;
    clearCart: () => void;
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

    // Keep prices, names and photos in the cart up to date with the live
    // catalog (e.g. after a price change in the admin panel). The server
    // always charges the live price; this makes the cart show it too.
    const { products } = useCatalog();
    useEffect(() => {
        setCart(prev => {
            let changed = false;
            const next = prev.map(item => {
                const p = products.find(x => x.id === item.id);
                if (!p || (p.price === item.price && p.originalPrice === item.originalPrice && p.name === item.name && JSON.stringify(p.image) === JSON.stringify(item.image))) return item;
                changed = true;
                return { ...item, price: p.price, originalPrice: p.originalPrice, name: p.name, image: p.image };
            });
            return changed ? next : prev;
        });
    }, [products]);

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
            addToCart, removeFromCart, updateQuantity,
            clearCart: () => setCart([]),
            cartTotal
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
