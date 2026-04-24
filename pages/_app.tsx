import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { CartProvider, useCart } from '../src/context/CartContext';
import { ToastProvider, useToast } from '../src/context/ToastContext';
import { Header } from '../src/components/common/Header';
import { Footer } from '../src/components/common/Footer';
import { CartSidebar } from '../src/components/checkout/CartSidebar';
import { Toast } from '../src/components/common/Toast';
import { FloatingButtons, FloatingCallButton } from '../src/components/common/FloatingButtons';
import { initializeAssetCache } from '../src/services/githubService';
import { initializeGoogleOneTap, signInWithGoogle } from '../src/services/auth';
import { subscribeToNewsletter } from '../src/services/newsletter';
import '../index.css';

function AppShell({ Component, pageProps }: AppProps) {
    const { cart, cartTotal, isCartOpen, openCart, closeCart, addToCart, removeFromCart, updateQuantity } = useCart();
    const { toast, showToast, clearToast } = useToast();

    useEffect(() => {
        initializeAssetCache();

        const handleGoogleResponse = async (response: { credential: string }) => {
            try {
                const user = await signInWithGoogle(response.credential);
                if (user.email) await subscribeToNewsletter(user.email);
                showToast(`Welcome back, ${user.displayName || 'Friend'}!`, 'success');
            } catch { /* silent */ }
        };

        initializeGoogleOneTap(handleGoogleResponse);
    }, []);

    return (
        <div className="app">
            <Header />
            <main>
                <Component {...pageProps} />
            </main>
            <Footer />

            <CartSidebar
                isOpen={isCartOpen}
                onClose={closeCart}
                cart={cart}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={removeFromCart}
                onCheckout={() => {
                    closeCart();
                    window.location.href = '/checkout';
                }}
                total={cartTotal}
            />

            <Toast
                message={toast?.message || ''}
                isVisible={!!toast}
                type={toast?.type}
                onClose={clearToast}
            />
            <FloatingButtons />
            <FloatingCallButton />
        </div>
    );
}

export default function App(props: AppProps) {
    return (
        <CartProvider>
            <ToastProvider>
                <AppShell {...props} />
            </ToastProvider>
        </CartProvider>
    );
}
