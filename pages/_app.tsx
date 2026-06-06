import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { CartProvider, useCart } from '../src/context/CartContext';
import { ToastProvider, useToast } from '../src/context/ToastContext';
import { Header } from '../src/components/common/Header';
import { Footer } from '../src/components/common/Footer';
import { Toast } from '../src/components/common/Toast';
import '../index.css';

const CartSidebar = dynamic(() => import('../src/components/checkout/CartSidebar').then(m => ({ default: m.CartSidebar })), { ssr: false });
const FloatingButtons = dynamic(() => import('../src/components/common/FloatingButtons').then(m => ({ default: m.FloatingButtons })), { ssr: false });
const FloatingCallButton = dynamic(() => import('../src/components/common/FloatingButtons').then(m => ({ default: m.FloatingCallButton })), { ssr: false });

function AppShell({ Component, pageProps }: AppProps) {
    const router = useRouter();
    const { cart, cartTotal, isCartOpen, openCart, closeCart, addToCart, removeFromCart, updateQuantity } = useCart();
    const { toast, showToast, clearToast } = useToast();

    useEffect(() => {
        const schedule = typeof requestIdleCallback !== 'undefined' ? requestIdleCallback : setTimeout;

        const initId = schedule(async () => {
            const { initializeAssetCache } = await import('../src/services/githubService');
            initializeAssetCache();
        });

        const handleGoogleResponse = async (response: { credential: string }) => {
            try {
                const { signInWithGoogle } = await import('../src/services/auth');
                const { subscribeToNewsletter } = await import('../src/services/newsletter');
                const user = await signInWithGoogle(response.credential);
                if (user.email) await subscribeToNewsletter(user.email);
                showToast(`Welcome back, ${user.displayName || 'Friend'}!`, 'success');
            } catch { /* silent */ }
        };

        const googleId = schedule(async () => {
            const { initializeGoogleOneTap } = await import('../src/services/auth');
            initializeGoogleOneTap(handleGoogleResponse);
        });

        return () => {
            if (typeof cancelIdleCallback !== 'undefined') {
                cancelIdleCallback(initId as number);
                cancelIdleCallback(googleId as number);
            } else {
                clearTimeout(initId as ReturnType<typeof setTimeout>);
                clearTimeout(googleId as ReturnType<typeof setTimeout>);
            }
        };
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
                    router.push('/checkout');
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
