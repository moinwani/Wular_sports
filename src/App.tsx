import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { HomeView } from './views/HomeView';
import { ProductDetailsView } from './views/ProductDetailsView';
import { CartSidebar } from './components/checkout/CartSidebar';
import { Toast } from './components/common/Toast';
import { FloatingButtons, FloatingCallButton } from './components/common/FloatingButtons';
import { ProductFull, CartItem } from './types';
import { products } from './data/products';

// Wrapper to handle scroll to top on route change
const ScrollToTop = () => {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);
    return null;
};

const AppContent: React.FC = () => {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const addToCart = (product: ProductFull, size: string) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id && item.size === size);
            if (existing) {
                return prev.map(item =>
                    (item.id === product.id && item.size === size)
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { ...product, size, quantity: 1 }];
        });
        setIsCartOpen(true);
        showToast(`${product.name} added to cart!`);
    };

    const removeFromCart = (id: string, size: string) => {
        setCart(prev => prev.filter(item => !(item.id === id && item.size === size)));
    };

    const updateQuantity = (id: string, size: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id && item.size === size) {
                return { ...item, quantity: Math.max(1, item.quantity + delta) };
            }
            return item;
        }));
    };

    return (
        <div className="app">
            <ScrollToTop />
            <Header cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)} onCartClick={() => setIsCartOpen(true)} />

            <main>
                <Routes>
                    <Route path="/" element={<HomeView onAddToCart={addToCart} />} />
                    <Route path="/product/:id" element={<ProductDetailsView onAddToCart={addToCart} />} />
                </Routes>
            </main>

            <Footer />

            <CartSidebar
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                cart={cart}
                onUpdateQuantity={updateQuantity}
                onRemove={removeFromCart}
            />

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <FloatingButtons />
            <FloatingCallButton />
        </div>
    );
};

export const App: React.FC = () => {
    return (
        <Router>
            <AppContent />
        </Router>
    );
};
