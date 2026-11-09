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
    /** Names of bats taken out of the cart because they're no longer for sale */
    unavailable: string[];
    dismissUnavailable: () => void;
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
    const { products, loaded, live } = useCatalog();
    const [unavailable, setUnavailable] = useState<string[]>([]);
    useEffect(() => {
        // Wait for real catalog data — the built-in starting list could put old
        // prices into the cart for a moment (or for good, if the API failed)
        if (!loaded) return;
        let changed = false;
        const gone: string[] = [];
        const next: CartItem[] = [];
        for (const item of cart) {
            const p = products.find(x => x.id === item.id);
            if (!p) {
                // Only a just-fetched copy of the catalog is trusted to say a bat is
                // gone (a page's built-in list may simply not know a newer bat)
                if (live) { changed = true; gone.push(item.name); continue; }
                next.push(item);
                continue;
            }
            if (p.price === item.price && p.originalPrice === item.originalPrice && p.name === item.name && JSON.stringify(p.image) === JSON.stringify(item.image)) {
                next.push(item);
                continue;
            }
            changed = true;
            next.push({ ...item, price: p.price, originalPrice: p.originalPrice, name: p.name, image: p.image });
        }
        if (changed) setCart(next);
        if (gone.length) setUnavailable(prev => [...new Set([...prev, ...gone])]);
    }, [products, loaded, live, cart]);

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
            cartTotal,
            unavailable,
            dismissUnavailable: () => setUnavailable([]),
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
