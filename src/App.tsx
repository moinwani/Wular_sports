import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { View, CartItem, ProductFull, CustomerDetails, PaymentMethod } from './types';
import { products } from './data/products';
import { createWhatsAppLink } from './utils/helpers';

// Components
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { Lightbox } from './components/common/Lightbox';
import { Toast } from './components/common/Toast';
import { VideoModal } from './components/common/VideoModal';
import { FloatingButtons, FloatingCallButton } from './components/common/FloatingButtons';

import { CartSidebar } from './components/checkout/CartSidebar';
import { CheckoutSidebar } from './components/checkout/CheckoutSidebar';

import { HomeView } from './views/HomeView';
import { CollectionView } from './views/CollectionView';
import { PrivacyPolicyView, ReturnPolicyView, TermsAndConditionsView } from './views/PolicyViews';

export const App = () => {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [toast, setToast] = useState({ message: '', isVisible: false });
    const [lightboxGallery, setLightboxGallery] = useState<{ images: string[], startIndex: number } | null>(null);
    const [videoModalUrl, setVideoModalUrl] = useState<string | null>(null);
    const [videoTriggerRef, setVideoTriggerRef] = useState<React.RefObject<HTMLButtonElement> | null>(null);
    const [activeView, setActiveView] = useState<View>('home');
    const toastTimeoutRef = useRef<number | null>(null);

    const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
    const cartItemCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

    // Effect to lock body scroll when a sidebar or modal is open
    useEffect(() => {
        const body = document.body;
        if (isCartOpen || isCheckoutOpen || lightboxGallery || videoModalUrl) {
            body.classList.add('body-no-scroll');
        } else {
            body.classList.remove('body-no-scroll');
        }

        return () => {
            body.classList.remove('body-no-scroll');
        };
    }, [isCartOpen, isCheckoutOpen, lightboxGallery, videoModalUrl]);

    const showToast = (message: string) => {
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        setToast({ message, isVisible: true });
        toastTimeoutRef.current = window.setTimeout(() => { setToast({ message: '', isVisible: false }); }, 4000);
    };

    const handleAddToCart = (product: ProductFull, size: string | null) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id && item.size === size);
            if (existingItem) {
                return prevCart.map(item =>
                    item.id === product.id && item.size === size ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prevCart, { ...product, quantity: 1, size: size || undefined }];
        });
        setIsCartOpen(true);
        const sizeText = size ? ` (${size})` : '';
        showToast(`${product.name}${sizeText} added to cart!`);
    };

    const handleUpdateQuantity = (productId: string, quantity: number, size?: string) => {
        if (quantity < 1) return;
        setCart(prevCart => prevCart.map(item =>
            item.id === productId && item.size === size ? { ...item, quantity } : item
        ));
    };

    const handleRemoveItem = (productId: string, size?: string) => {
        setCart(prevCart => prevCart.filter(item => !(item.id === productId && item.size === size)));
    };
    const handleCheckout = () => { setIsCartOpen(false); setIsCheckoutOpen(true); };
    const handleBackToCart = () => { setIsCheckoutOpen(false); setIsCartOpen(true); };

    const handleLightboxOpen = (images: string[], startIndex: number) => {
        setLightboxGallery({ images, startIndex });
    };

    const handleLightboxClose = useCallback(() => {
        setLightboxGallery(null);
    }, []);


    const handleWatchVideo = (url: string, ref: React.RefObject<HTMLButtonElement>) => {
        setVideoModalUrl(url);
        setVideoTriggerRef(ref);
    };

    const handleCloseVideoModal = () => {
        setVideoModalUrl(null);
        if (videoTriggerRef?.current) {
            videoTriggerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        setVideoTriggerRef(null);
    };

    const handlePlaceOrder = (customerDetails: CustomerDetails, paymentMethod: PaymentMethod) => {
        const productSummary = cart.map(item => `- ${item.name}${item.size ? ` (${item.size})` : ''} (x${item.quantity})`).join('\n');
        const advanceAmount = cartItemCount * 300;

        const customerInfo = [
            `👤 *Name:* ${customerDetails.fullName}`,
            customerDetails.email ? `✉️ *Email:* ${customerDetails.email}` : null,
            `📞 *Phone:* +91${customerDetails.phone}`,
            `📍 *Address:* ${customerDetails.address}, ${customerDetails.city}, ${customerDetails.state} - ${customerDetails.pinCode}`,
            customerDetails.landmark ? `🏠 *Landmark:* ${customerDetails.landmark}` : null
        ].filter(Boolean).join('\n');

        let paymentDetailsText = '';
        if (paymentMethod === 'full') {
            paymentDetailsText = `
*Payment Method:* Full Payment
*Total Amount:* ₹${cartTotal.toLocaleString('en-IN')}

_This total amount includes no additional charges—full online payments are free from COD convenience fees._
            `.trim().replace(/^\s+/gm, '');
        } else {
            const remainingAmount = cartTotal - advanceAmount;
            const codFee = Math.round(remainingAmount * 0.05);
            const totalOnDelivery = remainingAmount + codFee;

            paymentDetailsText = `
*Payment Method:* Partial (Advance + COD)
*Advance to Pay:* ₹${advanceAmount.toLocaleString('en-IN')}

---
*Amount Due on Delivery*
---
Remaining Amount: ₹${remainingAmount.toLocaleString('en-IN')}
+ 5% COD Convenience Fee: ₹${codFee.toLocaleString('en-IN')}
---------------------------------
*Total to Pay at Delivery: ₹${totalOnDelivery.toLocaleString('en-IN')}*

⚠️ *Important Note:* The 5% COD convenience fee goes directly to the delivery service provider (e.g., India Post, DTDC) and **not to Wular Sports**.
✅ _If you pay the entire amount online in advance, this extra 5% fee does NOT apply._
            `.trim().replace(/^\s+/gm, '');
        }

        const message = `
✨ *New Order from Wular Sports Website* ✨

---
*Customer Details*
---
${customerInfo}

---
*Order Summary*
---
${productSummary}

---
*Payment Information*
---
${paymentDetailsText}

Please confirm my order and provide payment instructions. Thank you!
        `.trim().replace(/^\s+/gm, '');

        const whatsappUrl = createWhatsAppLink(message);
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

        showToast("Confirm your order on WhatsApp!");
        setCart([]);
        setIsCheckoutOpen(false);
    };

    const handleNavigate = (view: View) => {
        setActiveView(view);
        window.scrollTo(0, 0);
    };

    return (
        <>
            <Lightbox gallery={lightboxGallery} onClose={handleLightboxClose} />
            <VideoModal videoUrl={videoModalUrl} onClose={handleCloseVideoModal} />
            <Toast message={toast.message} isVisible={toast.isVisible} />
            <Header onCartClick={() => setIsCartOpen(true)} cartItemCount={cartItemCount} onNavigate={handleNavigate} />

            <div className="view-container">
                {activeView === 'home' && (
                    <HomeView
                        onShopCollectionClick={() => handleNavigate('collection')}
                        onAddToCart={handleAddToCart}
                        onImageClick={handleLightboxOpen}
                        onWatchVideo={handleWatchVideo}
                    />
                )}
                {activeView === 'collection' && <CollectionView products={products} onImageClick={handleLightboxOpen} onAddToCart={handleAddToCart} onWatchVideo={handleWatchVideo} />}
                {activeView === 'privacy' && <PrivacyPolicyView />}
                {activeView === 'return' && <ReturnPolicyView />}
                {activeView === 'terms' && <TermsAndConditionsView />}
            </div>

            <Footer onNavigate={handleNavigate} />
            <FloatingButtons />
            <FloatingCallButton />

            <CartSidebar
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                cart={cart}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onCheckout={handleCheckout}
                total={cartTotal}
            />
            <CheckoutSidebar
                isOpen={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
                onBack={handleBackToCart}
                onPlaceOrder={handlePlaceOrder}
                total={cartTotal}
                cartItemCount={cartItemCount}
            />
        </>
    );
};
