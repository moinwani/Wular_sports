import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { HomeView } from './views/HomeView';
import { ProductDetailsView } from './views/ProductDetailsView';
import { CollectionView } from './views/CollectionView';
import { PrivacyPolicyView, ReturnPolicyView, TermsAndConditionsView } from './views/PolicyViews';
import { products } from './data/products';
import { CartSidebar } from './components/checkout/CartSidebar';
import { Toast } from './components/common/Toast';
import { FloatingButtons, FloatingCallButton } from './components/common/FloatingButtons';
import { ProductFull, CartItem, View } from './types';


// Wrapper to handle scroll to top on route change
const ScrollToTop = () => {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);
    return null;
};

const AppContent: React.FC = () => {
    const navigate = useNavigate();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const navigateTo = (view: View) => {
        if (view === 'home') navigate('/');
        else if (view === 'collection') navigate('/collection');
        else if (view === 'privacy') navigate('/privacy-policy');
        else if (view === 'return') navigate('/return-policy');
        else if (view === 'terms') navigate('/terms-conditions');
        else {
            navigate('/');
            showToast(`Navigating to ${view}... (Coming Soon)`, 'info');
        }
    };

    const addToCart = (product: ProductFull, size: string | null) => {
        setCart(prev => {
            const sizeKey = size || 'default';
            const existing = prev.find(item => item.id === product.id && (item.size || 'default') === sizeKey);

            if (existing) {
                return prev.map(item =>
                    (item.id === product.id && (item.size || 'default') === sizeKey)
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { ...product, size: size || undefined, quantity: 1 }];
        });
        setIsCartOpen(true);
        showToast(`${product.name} added to cart!`);
    };

    const removeFromCart = (id: string, size?: string) => {
        const sizeKey = size || 'default';
        setCart(prev => prev.filter(item => !(item.id === id && (item.size || 'default') === sizeKey)));
    };

    const updateQuantity = (id: string, quantity: number, size?: string) => {
        const sizeKey = size || 'default';
        setCart(prev => prev.map(item => {
            if (item.id === id && (item.size || 'default') === sizeKey) {
                return { ...item, quantity: Math.max(1, quantity) };
            }
            return item;
        }));
    };

    return (
        <div className="app">
            <ScrollToTop />
            <Header
                cartItemCount={cart.reduce((acc, item) => acc + item.quantity, 0)}
                onCartClick={() => setIsCartOpen(true)}
                onNavigate={navigateTo}
            />

            <main>
                <Routes>
                    <Route path="/" element={<HomeView
                        onShopCollectionClick={() => navigateTo('collection')}
                        onAddToCart={addToCart}
                        onImageClick={() => { }} // Placeholder
                        onWatchVideo={() => { }} // Placeholder
                    />} />
                    <Route path="/collection" element={<CollectionView
                        products={products}
                        onAddToCart={addToCart}
                        onImageClick={() => { }}
                        onWatchVideo={() => { }}
                    />} />
                    <Route path="/product/:id" element={<ProductDetailsView onAddToCart={(p, s) => addToCart(p, s)} />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicyView />} />
                    <Route path="/return-policy" element={<ReturnPolicyView />} />
                    <Route path="/terms-conditions" element={<TermsAndConditionsView />} />
                </Routes>
            </main>

            <Footer onNavigate={navigateTo} />

            <CartSidebar
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                cart={cart}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={removeFromCart}
                onCheckout={() => showToast('Checkout functionality coming soon!', 'info')}
                total={cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)}
            />

            <Toast
                message={toast?.message || ''}
                isVisible={!!toast}
                type={toast?.type}
                onClose={() => setToast(null)}
            />
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
