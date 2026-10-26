import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { CartProvider, useCart } from '../src/context/CartContext';
import { ToastProvider, useToast } from '../src/context/ToastContext';
import { Header } from '../src/components/common/Header';
import { Footer } from '../src/components/common/Footer';
import { Toast } from '../src/components/common/Toast';
import { captureAttribution } from '../src/utils/attributionCapture';
import { CatalogProvider } from '../src/context/CatalogContext';
import '../index.css';

declare global {
    interface Window {
        dataLayer: any[];
    }
}

const CartSidebar = dynamic(() => import('../src/components/checkout/CartSidebar').then(m => ({ default: m.CartSidebar })), { ssr: false });
const FloatingButtons = dynamic(() => import('../src/components/common/FloatingButtons').then(m => ({ default: m.FloatingButtons })), { ssr: false });
const FloatingCallButton = dynamic(() => import('../src/components/common/FloatingButtons').then(m => ({ default: m.FloatingCallButton })), { ssr: false });
const ExitIntentPopup = dynamic(() => import('../src/components/common/ExitIntentPopup').then(m => ({ default: m.ExitIntentPopup })), { ssr: false });

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

    useEffect(() => {
        captureAttribution();

        const handleRouteChange = (url: string) => {
            if (window.dataLayer) {
                window.dataLayer.push({ event: 'page_view', page: url });
            }
        };

        handleRouteChange(window.location.pathname);
        router.events.on('routeChangeComplete', handleRouteChange);
        return () => {
            router.events.off('routeChangeComplete', handleRouteChange);
        };
    }, []);

    return (
        <div className="app">
            <Header />
            <main>
                <Component {...pageProps} />
            </main>
            {/* A focused checkout: no footer links pulling shoppers away */}
            {router.pathname !== '/checkout' && <Footer />}

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
                // "Added to cart" is noise once the shopper is already at checkout
                isVisible={!!toast && router.pathname !== '/checkout'}
                type={toast?.type}
                onClose={clearToast}
            />
            {/* Contact buttons would cover admin tables and distract at checkout (it has its own WhatsApp link) */}
            {!router.pathname.startsWith('/admin') && router.pathname !== '/checkout' && (
                <>
                    <FloatingButtons />
                    <FloatingCallButton />
                </>
            )}
            <ExitIntentPopup />
        </div>
    );
}

export default function App(props: AppProps) {
    return (
        <CatalogProvider initial={props.pageProps?.catalog || null}>
            <CartProvider>
                <ToastProvider>
                    <AppShell {...props} />
                </ToastProvider>
            </CartProvider>
        </CatalogProvider>
    );
}
