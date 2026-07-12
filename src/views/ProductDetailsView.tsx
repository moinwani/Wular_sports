import { FC, useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { products } from '../data/products';
import { ProductFull } from '../types';
import { createWhatsAppLink } from '../utils/helpers';
import { CATEGORY_SLUGS } from '../data/constants';
import { Lightbox } from '../components/common/Lightbox';
import { VerticalImageGallery } from '../components/product/VerticalImageGallery';
import { HorizontalImageGallery } from '../components/product/HorizontalImageGallery';
import { SEOHead } from '../components/common/SEOHead';
import { Breadcrumb } from '../components/common/Breadcrumb';
import { Icon } from '../components/common/Icon';
import { WatchBuyVideo } from '../components/product/WatchBuyVideo';
import { ProductCard } from '../components/product/ProductCard';
import { getCDNUrl } from '../services/githubService';

export interface ProductDetailsViewProps {
    product: ProductFull;
    onAddToCart: (product: ProductFull, size: string, quantity?: number) => void;
}

type ScrollPhase = 'images' | 'content' | 'normal';

export const ProductDetailsView: FC<ProductDetailsViewProps> = ({ product, onAddToCart }) => {
    const [selectedSize, setSelectedSize] = useState<string>('');
    const [quantity, setQuantity] = useState(1);
    const [sizeError, setSizeError] = useState(false);
    const [openSection, setOpenSection] = useState<string | null>('description');
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [scrollPhase] = useState<ScrollPhase>('normal');
    const [isMobile, setIsMobile] = useState(false);
    const imageGalleryRef = useRef<HTMLDivElement | null>(null);
    const imageScrollContainerRef = useRef<HTMLDivElement | null>(null);
    const contentSectionRef = useRef<HTMLDivElement>(null);
    const productPageRef = useRef<HTMLDivElement>(null);
    const isScrollingRef = useRef(false);
    const imageScrollProgressRef = useRef(0);
    const contentScrollProgressRef = useRef(0);

    const id = product?.id;

    // Check if mobile on mount and resize
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // GA4 / GTM: track product view
    useEffect(() => {
        if (typeof window !== 'undefined' && window.dataLayer && product) {
            window.dataLayer.push({
                event: 'view_item',
                ecommerce: {
                    items: [{
                        item_id: product.id,
                        item_name: product.name,
                        price: product.price,
                        item_category: product.category || 'bat',
                    }]
                }
            });
        }
    }, []);

    // Store scroll container ref from VerticalImageGallery
    const handleImageScrollContainerRef = useCallback((ref: HTMLDivElement | null) => {
        imageScrollContainerRef.current = ref;
    }, []);

    // Handle wheel event — REMOVED (scroll-lock was blocking conversion)
    // Gallery still works as normal scrollable sidebar on desktop

    if (!product) {
        return <div className="container">Product not found</div>;
    }

    const toggleSection = (section: string) => {
        setOpenSection(openSection === section ? null : section);
    };

    if (!product) return null;

    // EXCEPTION: AK-47 Honeycomb is only 35 inch, so no size selector for it
    const isHoneycomb = product.id === 'ak-47-honeycomb';
    const hasSizes = !isHoneycomb && product.category.some(cat => ['Hard Tennis', 'Soft Tennis', 'Leather Ball'].includes(cat));
    const discountPercentage = product.originalPrice
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0;

    const handleAddToCartClick = () => {
        let itemData: { size?: string; quantity?: number } = {};

        if (isHoneycomb) {
            // Automatically add 35 inch for Honeycomb
            onAddToCart(product, '35 inch');
            itemData = { size: '35 inch', quantity: 1 };
        } else if (hasSizes && !selectedSize) {
            setSizeError(true);
            setTimeout(() => {
                const sizeSelector = document.querySelector('.size-selector-container');
                if (sizeSelector) {
                    sizeSelector.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
            return;
        } else {
            setSizeError(false);
            onAddToCart(product, selectedSize, quantity);
            itemData = { size: selectedSize, quantity };
        }

        // GA4 / GTM: track add_to_cart
        if (typeof window !== 'undefined' && window.dataLayer) {
            window.dataLayer.push({
                event: 'add_to_cart',
                ecommerce: {
                    currency: 'INR',
                    value: product.price * (itemData.quantity || 1),
                    items: [{
                        item_id: product.id,
                        item_name: product.name,
                        price: product.price,
                        quantity: itemData.quantity || 1,
                        item_variant: itemData.size || '',
                        item_category: product.category?.[0] || '',
                    }]
                }
            });
        }
    };

    const increaseQuantity = () => setQuantity(prev => prev + 1);
    const decreaseQuantity = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

    const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedSize(e.target.value);
        setSizeError(false);
    };

    // Extract key specs for visual display
    /* getWeightSpec is unused
    const getWeightSpec = () => {
        const weightSpec = product.specs.find(s => s.toLowerCase().includes('weight'));
        return weightSpec ? weightSpec.split(':')[1]?.trim() : null;
    };
    */

    /* getEdgeSpec is unused
    const getEdgeSpec = () => {
        const edgeSpec = product.specs.find(s => s.toLowerCase().includes('edge'));
        return edgeSpec ? edgeSpec.split(':')[1]?.trim() : null;
    };
    */

    // Product structured data for SEO
    const productImage = Array.isArray(product.image) ? product.image[0] : product.image;
    const structuredData = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Product",
                "name": product.name,
                "image": Array.isArray(product.image) ? product.image : [product.image],
                "description": product.description,
                "brand": {
                    "@type": "Brand",
                    "name": "Wular Sports"
                },
                "offers": {
                    "@type": "Offer",
                    "url": `https://wularsports.com/product/${product.id}`,
                    "priceCurrency": "INR",
                    "price": product.price,
                    "priceValidUntil": "2026-12-31",
                    "availability": "https://schema.org/InStock",
                    "seller": {
                        "@type": "Organization",
                        "name": "Wular Sports"
                    }
                }
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://wularsports.com" },
                    { "@type": "ListItem", "position": 2, "name": "Collection", "item": "https://wularsports.com/collection" },
                    { "@type": "ListItem", "position": 3, "name": product.category.join(" & "), "item": `https://wularsports.com/${CATEGORY_SLUGS[product.category[0]] || product.category[0].toLowerCase().replace(/\s/g, '-')}` },
                    { "@type": "ListItem", "position": 4, "name": product.name },
                ]
            },
            {
                "@type": "FAQPage",
                "mainEntity": [
                    {
                        "@type": "Question",
                        "name": "What is this cricket bat made of?",
                        "acceptedAnswer": { "@type": "Answer", "text": product.description }
                    },
                    {
                        "@type": "Question",
                        "name": "What comes with the bat?",
                        "acceptedAnswer": { "@type": "Answer", "text": "Each bat comes with a free bat cover, premium toe guard, extra grip, and is fully knocked-in and oiled — ready to play out of the box." }
                    },
                    {
                        "@type": "Question",
                        "name": "How long does delivery take?",
                        "acceptedAnswer": { "@type": "Answer", "text": "We dispatch within 24 hours. Delivery takes 6-7 business days via India Post. You will receive a tracking ID within 24 hours of dispatch." }
                    },
                    {
                        "@type": "Question",
                        "name": "Can I return or exchange the bat?",
                        "acceptedAnswer": { "@type": "Answer", "text": "Yes. We offer a 7-day return policy. The bat must be unused and in original packaging. Contact us on WhatsApp within 7 days of delivery to initiate a return." }
                    },
                    {
                        "@type": "Question",
                        "name": "What sizes are available?",
                        "acceptedAnswer": { "@type": "Answer", "text": `This bat is available in ${product.specs.find(s => s.toLowerCase().includes('height'))?.split(':')[1]?.trim() || 'standard'} size.` }
                    }
                ]
            }
        ]
    };


    return (
        <div className="product-details-page" ref={productPageRef}>
            <SEOHead
                title={`${product.name} - Buy Online | Wular Sports`}
                description={`${product.description} Price: ₹${product.price}. Free shipping. 1-year warranty. Ready to play.`}
                keywords={`${product.name}, buy ${product.name}, ${product.category.join(', ')}, cricket bat price, Kashmir willow bat`}
                ogImage={productImage}
                ogType="product"
                canonicalUrl={`https://wularsports.com/product/${product.id}`}
                structuredData={structuredData}
            />
            <div className="container">
                <Breadcrumb items={[
                    { name: 'Home', url: '/' },
                    { name: 'Collection', url: '/collection' },
                    { name: product.category.join(' & '), url: `/${CATEGORY_SLUGS[product.category[0]]}` },
                    { name: product.name },
                ]} />
                <div className={`product-details-grid-vertical ${isMobile ? 'mobile-layout' : ''}`}>
                    {/* Left Column: Images (Vertical on Desktop, Horizontal Swipe on Mobile) */}
                    <div
                        ref={imageGalleryRef}
                        className="product-gallery-section-vertical"
                    >
                        {Array.isArray(product.image) ? (
                            isMobile ? (
                                <HorizontalImageGallery
                                    images={product.image.map(img => getCDNUrl(img))}
                                    altText={product.name}
                                    onImageClick={(index) => {
                                        setLightboxIndex(index);
                                        setIsLightboxOpen(true);
                                    }}
                                />
                            ) : (
                                <VerticalImageGallery
                                    images={product.image.map(img => getCDNUrl(img))}
                                    altText={product.name}
                                    onImageClick={(index) => {
                                        setLightboxIndex(index);
                                        setIsLightboxOpen(true);
                                    }}
                                    onScrollContainerRef={handleImageScrollContainerRef}
                                />
                            )
                        ) : (
                            <div className={isMobile ? "horizontal-image-gallery-mobile" : "vertical-gallery-scroll-container"}>
                                <div
                                    className={isMobile ? "horizontal-gallery-slide" : "vertical-gallery-image-item"}
                                    onClick={() => {
                                        setLightboxIndex(0);
                                        setIsLightboxOpen(true);
                                    }}
                                >
                                    <Image
                                        src={product.image}
                                        alt={product.name}
                                        className={isMobile ? "horizontal-gallery-image" : "vertical-gallery-image"}
                                        width={600}
                                        height={600}
                                        unoptimized
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Product Info - Sticky */}
                    <div
                        ref={contentSectionRef}
                        className="product-info-section-sticky"
                    >
                        {/* Above the Fold Section - Clean & Premium */}
                        <div className="product-header-clean">
                            <h1 className="product-title-premium">{product.name}</h1>

                            {/* Short one-line description */}
                            <p className="product-subtitle-premium">
                                {product.category.join(' | ')} Cricket Bat
                            </p>

                            {/* Price Section */}
                            <div className="product-price-section-premium">
                                <div className="price-main-premium">₹{product.price.toLocaleString('en-IN')}</div>
                                {product.originalPrice && (
                                    <div className="price-secondary-premium">
                                        <span className="price-original-strike">₹{product.originalPrice.toLocaleString('en-IN')}</span>
                                        <span className="discount-badge-premium">Save {discountPercentage}%</span>
                                    </div>
                                )}
                            </div>

                            {/* Size Selector */}
                            {hasSizes && (
                                <div className={`size-selector-premium ${sizeError ? 'error-state' : ''}`}>
                                    <label className="size-label-premium">
                                        Select Size <span className="required-asterisk">*</span>
                                    </label>
                                    <div className="size-options-premium">
                                        {['35 inch', '36 inch'].map(size => (
                                            <label key={size} className={`size-option-premium ${selectedSize === size ? 'selected' : ''} ${sizeError ? 'error' : ''}`}>
                                                <input
                                                    type="radio"
                                                    name="bat-size"
                                                    value={size}
                                                    checked={selectedSize === size}
                                                    onChange={handleSizeChange}
                                                />
                                                <span>{size}</span>
                                            </label>
                                        ))}
                                    </div>
                                    {sizeError && (
                                        <p className="size-error-premium">
                                            <Icon name="fa-exclamation-circle" /> Please select a size
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="trust-strip" style={{
                                display: 'flex', flexWrap: 'wrap', gap: '1rem',
                                justifyContent: 'center', padding: '0.75rem 0',
                                borderTop: '1px solid rgba(255,255,255,0.08)',
                                borderBottom: '1px solid rgba(255,255,255,0.08)',
                                marginBottom: '0.5rem',
                            }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: '#aaa' }}>
                                    <Icon name="fa-truck" style={{ color: 'var(--golden)' }} /> Free Delivery
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: '#aaa' }}>
                                    <Icon name="fa-shield-alt" style={{ color: 'var(--golden)' }} /> 1-Year Warranty
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: '#aaa' }}>
                                    <Icon name="fa-undo" style={{ color: 'var(--golden)' }} /> 7-Day Returns
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: '#aaa' }}>
                                    <Icon name="fa-money-bill" style={{ color: 'var(--golden)' }} /> COD Available
                                </span>
                            </div>

                            {/* Primary CTA with Quantity */}
                            <div className="actions-row-premium" style={{ display: 'flex', gap: '1rem', alignItems: 'stretch' }}>
                                {/* Quantity Selector */}
                                <div className="quantity-selector-premium" style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: '8px',
                                    background: 'rgba(0,0,0,0.2)'
                                }}>
                                    <button
                                        onClick={decreaseQuantity}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: 'white',
                                            padding: '0 1rem',
                                            fontSize: '1.2rem',
                                            cursor: 'pointer',
                                            height: '100%'
                                        }}
                                        aria-label="Decrease quantity"
                                    >
                                        −
                                    </button>
                                    <span style={{
                                        color: 'white',
                                        fontSize: '1.1rem',
                                        fontWeight: '600',
                                        minWidth: '2rem',
                                        textAlign: 'center'
                                    }}>{quantity}</span>
                                    <button
                                        onClick={increaseQuantity}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: 'white',
                                            padding: '0 1rem',
                                            fontSize: '1.2rem',
                                            cursor: 'pointer',
                                            height: '100%'
                                        }}
                                        aria-label="Increase quantity"
                                    >
                                        +
                                    </button>
                                </div>

                                <button className="btn-primary-premium" onClick={handleAddToCartClick} style={{ flex: 1, margin: 0 }}>
                                    <Icon name="fa-shopping-bag" />
                                    BUY NOW - ₹{(product.price * quantity).toLocaleString('en-IN')}
                                </button>
                            </div>

                            {/* Order on WhatsApp Button */}
                        <a
                            href={createWhatsAppLink(`Hi, I want to order: ${product.name} (Qty: ${quantity})`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-whatsapp-order-premium"
                            onClick={() => {
                                import('../services/leads').then(({ trackWhatsAppClick }) =>
                                    trackWhatsAppClick('product_order', product.name, {
                                        type: 'product_order',
                                        product_id: product.id,
                                        quantity,
                                    })
                                ).catch(() => { /* best-effort */ });
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.8rem',
                                width: '100%',
                                padding: '1rem',
                                marginTop: '1rem',
                                backgroundColor: '#25D366',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '1.1rem',
                                fontWeight: '600',
                                textDecoration: 'none',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                transition: 'transform 0.2s ease'
                            }}
                        >
                            <Icon name="fa-whatsapp" style={{ fontSize: '1.4rem' }} />
                            ORDER ON WHATSAPP
                        </a>
                        </div>

                        {/* Tabs Section */}
                        <div className="product-tabs-container">
                            <div className="product-tabs">
                                <button
                                    className={`product-tab ${openSection === 'description' ? 'active' : ''}`}
                                    onClick={() => toggleSection('description')}
                                >
                                    DESCRIPTION
                                </button>
                                <button
                                    className={`product-tab ${openSection === 'included' ? 'active' : ''}`}
                                    onClick={() => toggleSection('included')}
                                >
                                    WHAT'S INCLUDED
                                </button>
                                <button
                                    className={`product-tab ${openSection === 'shipping' ? 'active' : ''}`}
                                    onClick={() => toggleSection('shipping')}
                                >
                                    SHIPPING
                                </button>
                                <button
                                    className={`product-tab ${openSection === 'returns' ? 'active' : ''}`}
                                    onClick={() => toggleSection('returns')}
                                >
                                    RETURNS
                                </button>
                                <button
                                    className={`product-tab ${openSection === 'contact' ? 'active' : ''}`}
                                    onClick={() => toggleSection('contact')}
                                >
                                    CONTACT
                                </button>
                            </div>

                            {/* Tab Content */}
                            <div className="product-tab-content">
                                {/* DESCRIPTION Tab */}
                                {openSection === 'description' && (
                                    <div className="tab-panel active">
                                        <div className="product-specs-clean">
                                            <h3 className="specs-title">Product Details</h3>
                                            <ul className="specs-list-clean">
                                                {product.specs
                                                    .filter(spec =>
                                                        !spec.toLowerCase().includes('free') &&
                                                        !spec.toLowerCase().includes('delivery') &&
                                                        !spec.toLowerCase().includes('included')
                                                    )
                                                    .map((spec, index) => (
                                                        <li key={index}>
                                                            <Icon name="fa-check" />
                                                            <span>{spec}</span>
                                                        </li>
                                                    ))
                                                }
                                            </ul>
                                            <div className="description-text-clean">
                                                <p>{product.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* WHAT'S INCLUDED Tab */}
                                {openSection === 'included' && (
                                    <div className="tab-panel active">
                                        <div className="included-section-clean">
                                            <h3 className="included-title">What Comes With Your Bat</h3>
                                            <ul className="included-list-clean">
                                                <li>
                                                    <div className="included-item-left">
                                                        <Icon name="fa-check-circle" />
                                                        <span>Free Bat Cover</span>
                                                    </div>
                                                    <span className="included-item-value">₹300</span>
                                                </li>
                                                <li>
                                                    <div className="included-item-left">
                                                        <Icon name="fa-check-circle" />
                                                        <span>Premium Toe Guard</span>
                                                    </div>
                                                    <span className="included-item-value">₹100</span>
                                                </li>
                                                <li>
                                                    <div className="included-item-left">
                                                        <Icon name="fa-check-circle" />
                                                        <span>Extra Grip</span>
                                                    </div>
                                                    <span className="included-item-value">₹100</span>
                                                </li>
                                                <li>
                                                    <div className="included-item-left">
                                                        <Icon name="fa-check-circle" />
                                                        <span>Fully Knocked & Oiled (Ready to Play)</span>
                                                    </div>
                                                    <span className="included-item-value">₹100</span>
                                                </li>
                                                <li>
                                                    <div className="included-item-left">
                                                        <Icon name="fa-check-circle" />
                                                        <span>Free Shipping</span>
                                                    </div>
                                                    <span className="included-item-value">₹200</span>
                                                </li>
                                            </ul>
                                            <div className="value-highlight">
                                                <strong>Total Value: ₹{product.price.toLocaleString('en-IN')}</strong>
                                                <span className="you-save">You Save: ₹800 (All Free)</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* SHIPPING Tab */}
                                {openSection === 'shipping' && (
                                    <div className="tab-panel active">
                                        <div className="shipping-section-clean">
                                            <h3 className="shipping-title">When Will I Get My Order?</h3>

                                            <div className="shipping-steps">
                                                <div className="shipping-step">
                                                    <div className="step-icon">
                                                        <Icon name="fa-box-open" />
                                                    </div>
                                                    <div className="step-content">
                                                        <h4>1. Fast Dispatch</h4>
                                                        <p>We dispatch your bat within <strong>24 hours</strong> of placing the order.</p>
                                                    </div>
                                                </div>

                                                <div className="shipping-step">
                                                    <div className="step-icon">
                                                        <Icon name="fa-shipping-fast" />
                                                    </div>
                                                    <div className="step-content">
                                                        <h4>2. Reliable Delivery</h4>
                                                        <p>Shipped via <strong>India Post</strong> for secure and reliable handling. Expected delivery in <strong>6-7 business days</strong>.</p>
                                                    </div>
                                                </div>

                                                <div className="shipping-step">
                                                    <div className="step-icon">
                                                        <Icon name="fa-map-marker-alt" />
                                                    </div>
                                                    <div className="step-content">
                                                        <h4>3. Live Tracking</h4>
                                                        <p>You will receive a <strong>Tracking ID</strong> within 24 hours. You can track your package daily on the India Post website.</p>
                                                        <a
                                                            href="https://www.indiapost.gov.in/home"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="track-btn-india-post"
                                                            style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '0.5rem',
                                                                marginTop: '0.8rem',
                                                                padding: '0.6rem 1rem',
                                                                backgroundColor: '#fff',
                                                                color: '#d00202', /* India Post Red */
                                                                border: '1px solid #d00202',
                                                                borderRadius: '5px',
                                                                textDecoration: 'none',
                                                                fontWeight: 'bold',
                                                                fontSize: '0.9rem',
                                                                transition: 'all 0.2s'
                                                            }}
                                                        >
                                                            Track on India Post <Icon name="fa-external-link-alt" />
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="shipping-note-box">
                                                <p><Icon name="fa-shield-alt" /> <strong>Safe & Secure:</strong> We ensure premium packaging so your bat reaches you in perfect condition.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* RETURNS Tab */}
                                {openSection === 'returns' && (
                                    <div className="tab-panel active">
                                        <div className="returns-section-clean">
                                            <h3 className="returns-title">Hassle-Free Returns</h3>

                                            <div className="returns-info">
                                                <div className="policy-note">
                                                    <Icon name="fa-undo-alt" />
                                                    <p>We offer a <strong>7-day return policy</strong> for all our products.</p>
                                                </div>

                                                <div className="return-conditions">
                                                    <h4>Return Conditions</h4>
                                                    <ul>
                                                        <li>Product must be <strong>unused</strong> and in its <strong>original condition</strong>.</li>
                                                        <li>Original packaging must be intact.</li>
                                                        <li>Used or damaged products will not be eligible for return.</li>
                                                    </ul>
                                                </div>

                                                <div className="return-process">
                                                    <h4>How to Initiate a Return</h4>
                                                    <p>Contact us on <strong>WhatsApp</strong> within 7 days of delivery. Please provide:</p>
                                                    <ol>
                                                        <li>Your Order ID.</li>
                                                        <li>Photo/Video proof showing the product is unused and in original condition.</li>
                                                    </ol>
                                                </div>
                                            </div>

                                            <div className="returns-note-box">
                                                <p><Icon name="fa-info-circle" /> Our team will review your request and guide you through the next steps within 24-48 hours.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* CONTACT Tab */}
                                {openSection === 'contact' && (
                                    <div className="tab-panel active">
                                        <div className="contact-section-clean">
                                            <h3 className="contact-title">Need Help Choosing?</h3>
                                            <p className="contact-subtitle">Contact us for personalized assistance</p>

                                            <div className="contact-options-clean">
                                            <a
                                                href={createWhatsAppLink(`Hi, I'm interested in ${product.name}`)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="contact-option-btn whatsapp"
                                                onClick={() => {
                                                    import('../services/leads').then(({ trackWhatsAppClick }) =>
                                                        trackWhatsAppClick('contact_tab_chat', product.name, {
                                                            type: 'product_inquiry',
                                                            product_id: product.id,
                                                        })
                                                    ).catch(() => { /* best-effort */ });
                                                }}
                                            >
                                                <Icon name="fa-whatsapp" />
                                                <div>
                                                    <strong>Chat on WhatsApp</strong>
                                                    <span>Typically replies within 5 minutes</span>
                                                </div>
                                            </a>

                                            <a
                                                href={createWhatsAppLink(`Hi, I want to see ${product.name} on Video Call`)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="contact-option-btn video"
                                                onClick={() => {
                                                    import('../services/leads').then(({ trackWhatsAppClick }) =>
                                                        trackWhatsAppClick('contact_tab_video', product.name, {
                                                            type: 'video_call',
                                                            product_id: product.id,
                                                        })
                                                    ).catch(() => { /* best-effort */ });
                                                }}
                                            >
                                                <Icon name="fa-video" />
                                                <div>
                                                    <strong>Video Call</strong>
                                                    <span>See the bat live before buying</span>
                                                </div>
                                            </a>

                                                <a
                                                    href="tel:+919320622451"
                                                    className="contact-option-btn call"
                                                >
                                                    <Icon name="fa-phone" />
                                                    <div>
                                                        <strong>Call Us</strong>
                                                        <span>+91 9320622451</span>
                                                    </div>
                                                </a>
                                            </div>

                                            <div className="shipping-info-clean">
                                                <p className="shipping-note-clean">
                                                    <Icon name="fa-info-circle" />
                                                    <strong>Note:</strong> Orders take 2-3 working days to dispatch. All orders shipped by air for express delivery.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* RELATED PRODUCTS Section */}
            <div className="related-products-section">
                <div className="container">
                    <h2 className="related-title">More to Explore</h2>

                    <div className="related-categories">
                        {[
                            { title: "Hard Tennis Bats", type: "Hard Tennis" },
                            { title: "Soft Tennis Bats", type: "Soft Tennis" },
                            { title: "Leather Bat Collection", type: "Leather Ball" }
                        ].map(category => {
                            const otherProducts = products.filter(p =>
                                p.id !== product.id &&
                                p.category.includes(category.type as any)
                            );

                            if (otherProducts.length === 0) return null;

                            return (
                                <div key={category.type} className="related-category-group">
                                    <h3 className="related-category-title">{category.title}</h3>
                                    <div className="catalog-grid">
                                        {otherProducts.map(p => (
                                            <ProductCard
                                                key={p.id}
                                                product={p}
                                                onAddToCart={(prod, size) => onAddToCart(prod, size || '')}
                                                onImageClick={() => { }}
                                                onWatchVideo={() => { }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Lightbox Component */}
            {isLightboxOpen && (
                <Lightbox
                    gallery={{ images: Array.isArray(product.image) ? product.image : [product.image], startIndex: lightboxIndex }}
                    onClose={() => setIsLightboxOpen(false)}
                />
            )}

            {/* Watch & Buy Video - For Legacy Editions & AK-47 Honeycomb */}
            {(product.id === 'legacy-edition' || product.id === 'legacy-edition-2.0' || product.id === 'ak-47-honeycomb') && (
                <WatchBuyVideo
                    product={product}
                    onAddToCart={onAddToCart}
                />
            )}
        </div>
    );
};
