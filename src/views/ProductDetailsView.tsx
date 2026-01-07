import { FC, useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { products } from '../data/products';
import { ProductFull } from '../types';
import { createWhatsAppLink } from '../utils/helpers';
import { Lightbox } from '../components/common/Lightbox';
import { VerticalImageGallery } from '../components/product/VerticalImageGallery';
import { HorizontalImageGallery } from '../components/product/HorizontalImageGallery';
import { SEOHead } from '../components/common/SEOHead';
import { WatchBuyVideo } from '../components/product/WatchBuyVideo';
import { ProductCard } from '../components/product/ProductCard';

export interface ProductDetailsViewProps {
    onAddToCart: (product: ProductFull, size: string, quantity?: number) => void;
}

type ScrollPhase = 'images' | 'content' | 'normal';

export const ProductDetailsView: FC<ProductDetailsViewProps> = ({ onAddToCart }) => {
    const { id } = useParams<{ id: string }>();
    // const navigate = useNavigate();
    const [selectedSize, setSelectedSize] = useState<string>('');
    const [quantity, setQuantity] = useState(1);
    const [sizeError, setSizeError] = useState(false);
    const [openSection, setOpenSection] = useState<string | null>('description');
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    // Scroll control state
    const [scrollPhase, setScrollPhase] = useState<ScrollPhase>('images');
    const [isMobile, setIsMobile] = useState(false);
    const imageGalleryRef = useRef<HTMLDivElement | null>(null);
    const imageScrollContainerRef = useRef<HTMLDivElement | null>(null);
    const contentSectionRef = useRef<HTMLDivElement>(null);
    const productPageRef = useRef<HTMLDivElement>(null);
    const isScrollingRef = useRef(false);
    const imageScrollProgressRef = useRef(0);
    const contentScrollProgressRef = useRef(0);

    const product = products.find(p => p.id === id);

    // Check if mobile on mount and resize
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Store scroll container ref from VerticalImageGallery
    const handleImageScrollContainerRef = useCallback((ref: HTMLDivElement | null) => {
        imageScrollContainerRef.current = ref;
    }, []);

    // Check image scroll completion
    const checkImageScrollComplete = useCallback(() => {
        const scrollContainer = imageScrollContainerRef.current;
        if (!scrollContainer || isMobile) return;

        const scrollTop = scrollContainer.scrollTop;
        const scrollHeight = scrollContainer.scrollHeight;
        const clientHeight = scrollContainer.clientHeight;
        const maxScroll = scrollHeight - clientHeight;

        // Add small threshold to account for rounding
        const threshold = 5;

        if (maxScroll <= threshold) {
            // No scroll needed or already at bottom, move to content phase
            if (scrollPhase === 'images') {
                setScrollPhase('content');
            }
            return;
        }

        const progress = maxScroll > 0 ? scrollTop / maxScroll : 0;
        imageScrollProgressRef.current = progress;

        // Check if we're at or near the bottom (with threshold)
        if (scrollTop >= maxScroll - threshold && scrollPhase === 'images') {
            setScrollPhase('content');
        }
    }, [scrollPhase, isMobile]);

    // Check content scroll completion
    /* checkContentScrollComplete is unused
    const checkContentScrollComplete = useCallback(() => {
        if (!contentSectionRef.current || isMobile || scrollPhase !== 'content') return;

        const content = contentSectionRef.current;
        const scrollTop = content.scrollTop;
        const scrollHeight = content.scrollHeight;
        const clientHeight = content.clientHeight;
        const maxScroll = scrollHeight - clientHeight;

        // Add small threshold to account for rounding
        const threshold = 5;

        if (maxScroll <= threshold) {
            // No scroll needed or already at bottom, move to normal phase
            if (scrollPhase === 'content') {
                setScrollPhase('normal');
            }
            return;
        }

        const progress = maxScroll > 0 ? scrollTop / maxScroll : 0;
        contentScrollProgressRef.current = progress;

        // Check if we're at or near the bottom (with threshold)
        if (scrollTop >= maxScroll - threshold && scrollPhase === 'content') {
            setScrollPhase('normal');
        }
    }, [scrollPhase, isMobile]);
    */

    // Handle wheel event - STRICT SEQUENTIAL SCROLL BEHAVIOR
    const handleWheel = useCallback((e: WheelEvent) => {
        // Ignore on mobile - use normal scroll
        if (isMobile) return;

        // Only intercept during controlled phases (images or content)
        if (scrollPhase === 'images' || scrollPhase === 'content') {
            // ALWAYS prevent default page scroll during controlled phases
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            // Prevent simultaneous scrolling
            if (isScrollingRef.current) return;
            isScrollingRef.current = true;

            const delta = e.deltaY;
            const scrollSpeed = 1.5; // Smooth scroll speed

            // STEP 1: Scroll Images (Left Side) - FIRST PRIORITY
            if (scrollPhase === 'images' && imageScrollContainerRef.current) {
                const scrollContainer = imageScrollContainerRef.current;
                const currentScroll = scrollContainer.scrollTop;
                const scrollHeight = scrollContainer.scrollHeight;
                const clientHeight = scrollContainer.clientHeight;
                const maxScroll = scrollHeight - clientHeight;

                // Check if there's anything to scroll
                if (maxScroll > 10) {
                    // Calculate new scroll position
                    const newScroll = Math.max(0, Math.min(maxScroll, currentScroll + delta * scrollSpeed));

                    // Scroll the images container
                    scrollContainer.scrollTop = newScroll;

                    // Check completion after scroll
                    requestAnimationFrame(() => {
                        const newScrollTop = scrollContainer.scrollTop;
                        const remainingScroll = maxScroll - newScrollTop;

                        // If we've reached the bottom (within 10px threshold), move to next phase
                        if (remainingScroll <= 10) {
                            scrollContainer.scrollTop = maxScroll; // Ensure we're exactly at bottom
                            setScrollPhase('content'); // STEP 2: Move to content scroll phase
                        }
                        isScrollingRef.current = false;
                    });
                } else {
                    // No images to scroll, immediately move to content phase
                    setScrollPhase('content');
                    isScrollingRef.current = false;
                }
            }
            // STEP 3: Scroll Content (Right Side) - SECOND PRIORITY  
            else if (scrollPhase === 'content' && contentSectionRef.current) {
                const content = contentSectionRef.current;
                const currentScroll = content.scrollTop;
                const scrollHeight = content.scrollHeight;
                const clientHeight = content.clientHeight;
                const maxScroll = scrollHeight - clientHeight;

                // Check if there's anything to scroll
                if (maxScroll > 10) {
                    // Calculate new scroll position
                    const newScroll = Math.max(0, Math.min(maxScroll, currentScroll + delta * scrollSpeed));

                    // Scroll the content container
                    content.scrollTop = newScroll;

                    // Check completion after scroll
                    requestAnimationFrame(() => {
                        const newScrollTop = content.scrollTop;
                        const remainingScroll = maxScroll - newScrollTop;

                        // If we've reached the bottom (within 10px threshold), move to normal scroll
                        if (remainingScroll <= 10) {
                            content.scrollTop = maxScroll; // Ensure we're exactly at bottom
                            setScrollPhase('normal'); // STEP 4: Allow normal page scroll
                        }
                        isScrollingRef.current = false;
                    });
                } else {
                    // No content to scroll, immediately allow normal page scroll
                    setScrollPhase('normal');
                    isScrollingRef.current = false;
                }
            }
        }
        // STEP 4: Normal page scroll (scrollPhase === 'normal')
        // Don't prevent default - allow normal browser scroll behavior
    }, [scrollPhase, isMobile]);

    // Attach wheel event listener to WINDOW to catch ALL scroll events from anywhere on page
    useEffect(() => {
        if (isMobile) {
            // Mobile: Normal scroll behavior
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
            return;
        }

        // Desktop: Control scroll behavior based on phase
        if (scrollPhase === 'images' || scrollPhase === 'content') {
            // STRICTLY prevent body/page scroll during controlled phases
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
            document.documentElement.style.overflow = 'hidden';

            // Lock window scroll position
            const scrollY = window.scrollY;
            window.scrollTo(0, scrollY);
        } else {
            // Normal scroll phase - allow page scrolling
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
            document.documentElement.style.overflow = '';
        }

        // Listen to ALL wheel events on the window (capture phase to catch early)
        window.addEventListener('wheel', handleWheel, { passive: false, capture: true });

        // Also prevent any scroll events during controlled phases
        const preventScroll = (e: Event) => {
            if (scrollPhase === 'images' || scrollPhase === 'content') {
                e.preventDefault();
                e.stopPropagation();
                window.scrollTo(window.scrollX, window.scrollY); // Maintain position
            }
        };

        window.addEventListener('scroll', preventScroll, { passive: false, capture: true });

        return () => {
            window.removeEventListener('wheel', handleWheel, { capture: true });
            window.removeEventListener('scroll', preventScroll, { capture: true });
            // Cleanup styles
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
            document.documentElement.style.overflow = '';
        };
    }, [handleWheel, isMobile, scrollPhase]);

    // Monitor image gallery scroll for phase transition detection
    useEffect(() => {
        if (isMobile || scrollPhase !== 'images') return;

        const scrollContainer = imageScrollContainerRef.current;
        if (!scrollContainer) return;

        const handleScroll = () => {
            // Check if images are fully scrolled
            const scrollTop = scrollContainer.scrollTop;
            const maxScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight;
            const remainingScroll = maxScroll - scrollTop;

            // If at bottom (within 10px), transition to content phase
            if (remainingScroll <= 10 && scrollPhase === 'images') {
                setScrollPhase('content');
            }
        };

        scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
        return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }, [scrollPhase, isMobile]);

    // Monitor content scroll for phase transition detection
    useEffect(() => {
        if (isMobile || scrollPhase !== 'content') return;

        const content = contentSectionRef.current;
        if (!content) return;

        const handleScroll = () => {
            // Check if content is fully scrolled
            const scrollTop = content.scrollTop;
            const maxScroll = content.scrollHeight - content.clientHeight;
            const remainingScroll = maxScroll - scrollTop;

            // If at bottom (within 10px), transition to normal scroll phase
            if (remainingScroll <= 10 && scrollPhase === 'content') {
                setScrollPhase('normal');
            }
        };

        content.addEventListener('scroll', handleScroll, { passive: true });
        return () => content.removeEventListener('scroll', handleScroll);
    }, [scrollPhase, isMobile]);

    // Reset scroll phase when product changes or component mounts
    useEffect(() => {
        if (!isMobile) {
            setScrollPhase('images');
            imageScrollProgressRef.current = 0;
            contentScrollProgressRef.current = 0;

            // Reset scroll positions
            if (imageScrollContainerRef.current) {
                imageScrollContainerRef.current.scrollTop = 0;
            }
            if (contentSectionRef.current) {
                contentSectionRef.current.scrollTop = 0;
            }
        }
    }, [id, isMobile]);

    if (!product) {
        return <div className="container">Product not found</div>;
    }

    const toggleSection = (section: string) => {
        setOpenSection(openSection === section ? null : section);
    };

    /* handleOpenLightbox is unused
    const handleOpenLightbox = (index: number) => {
        setLightboxIndex(index);
        setIsLightboxOpen(true);
    };
    */

    if (!product) return null;

    // EXCEPTION: AK-47 Honeycomb is only 35 inch, so no size selector for it
    const isHoneycomb = product.id === 'ak-47-honeycomb';
    const hasSizes = !isHoneycomb && product.category.some(cat => ['Hard Tennis', 'Soft Tennis', 'Leather Ball'].includes(cat));
    const discountPercentage = product.originalPrice
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0;

    const handleAddToCartClick = () => {
        if (isHoneycomb) {
            // Automatically add 35 inch for Honeycomb
            onAddToCart(product, '35 inch');
            return;
        }

        if (hasSizes && !selectedSize) {
            setSizeError(true);
            // Scroll to size selector smoothly
            setTimeout(() => {
                const sizeSelector = document.querySelector('.size-selector-container');
                if (sizeSelector) {
                    sizeSelector.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
            return;
        }
        setSizeError(false);
        onAddToCart(product, selectedSize, quantity);
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
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "reviewCount": "127"
        }
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
                <div className={`product-details-grid-vertical ${isMobile ? 'mobile-layout' : ''}`}>
                    {/* Left Column: Images (Vertical on Desktop, Horizontal Swipe on Mobile) */}
                    <div
                        ref={imageGalleryRef}
                        className={`product-gallery-section-vertical ${scrollPhase === 'images' && !isMobile ? 'scroll-active' : ''}`}
                    >
                        {Array.isArray(product.image) ? (
                            isMobile ? (
                                <HorizontalImageGallery
                                    images={product.image}
                                    altText={product.name}
                                    onImageClick={(index) => {
                                        setLightboxIndex(index);
                                        setIsLightboxOpen(true);
                                    }}
                                />
                            ) : (
                                <VerticalImageGallery
                                    images={product.image}
                                    altText={product.name}
                                    onImageClick={(index) => {
                                        setLightboxIndex(index);
                                        setIsLightboxOpen(true);
                                    }}
                                    onScrollComplete={checkImageScrollComplete}
                                    scrollProgress={imageScrollProgressRef.current}
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
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className={isMobile ? "horizontal-gallery-image" : "vertical-gallery-image"}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Product Info - Sticky */}
                    <div
                        ref={contentSectionRef}
                        className={`product-info-section-sticky ${scrollPhase === 'content' && !isMobile ? 'scroll-active' : ''} ${scrollPhase === 'normal' && !isMobile ? 'scroll-normal' : ''}`}
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
                                            <i className="fas fa-exclamation-circle"></i> Please select a size
                                        </p>
                                    )}
                                </div>
                            )}

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
                                    <i className="fas fa-shopping-bag"></i>
                                    BUY NOW - ₹{(product.price * quantity).toLocaleString('en-IN')}
                                </button>
                            </div>

                            {/* Order on WhatsApp Button */}
                            <a
                                href={createWhatsAppLink(`Hi, I want to order: ${product.name} (Qty: ${quantity})`)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-whatsapp-order-premium"
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
                                <i className="fab fa-whatsapp" style={{ fontSize: '1.4rem' }}></i>
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
                                                            <i className="fas fa-check"></i>
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
                                                        <i className="fas fa-check-circle"></i>
                                                        <span>Free Bat Cover</span>
                                                    </div>
                                                    <span className="included-item-value">₹300</span>
                                                </li>
                                                <li>
                                                    <div className="included-item-left">
                                                        <i className="fas fa-check-circle"></i>
                                                        <span>Premium Toe Guard</span>
                                                    </div>
                                                    <span className="included-item-value">₹100</span>
                                                </li>
                                                <li>
                                                    <div className="included-item-left">
                                                        <i className="fas fa-check-circle"></i>
                                                        <span>Extra Grip</span>
                                                    </div>
                                                    <span className="included-item-value">₹100</span>
                                                </li>
                                                <li>
                                                    <div className="included-item-left">
                                                        <i className="fas fa-check-circle"></i>
                                                        <span>Fully Knocked & Oiled (Ready to Play)</span>
                                                    </div>
                                                    <span className="included-item-value">₹100</span>
                                                </li>
                                                <li>
                                                    <div className="included-item-left">
                                                        <i className="fas fa-check-circle"></i>
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
                                                        <i className="fas fa-box-open"></i>
                                                    </div>
                                                    <div className="step-content">
                                                        <h4>1. Fast Dispatch</h4>
                                                        <p>We dispatch your bat within <strong>24 hours</strong> of placing the order.</p>
                                                    </div>
                                                </div>

                                                <div className="shipping-step">
                                                    <div className="step-icon">
                                                        <i className="fas fa-shipping-fast"></i>
                                                    </div>
                                                    <div className="step-content">
                                                        <h4>2. Reliable Delivery</h4>
                                                        <p>Shipped via <strong>India Post</strong> for secure and reliable handling. Expected delivery in <strong>6-7 business days</strong>.</p>
                                                    </div>
                                                </div>

                                                <div className="shipping-step">
                                                    <div className="step-icon">
                                                        <i className="fas fa-map-marker-alt"></i>
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
                                                            Track on India Post <i className="fas fa-external-link-alt"></i>
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="shipping-note-box">
                                                <p><i className="fas fa-shield-alt"></i> <strong>Safe & Secure:</strong> We ensure premium packaging so your bat reaches you in perfect condition.</p>
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
                                                    <i className="fas fa-undo-alt"></i>
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
                                                <p><i className="fas fa-info-circle"></i> Our team will review your request and guide you through the next steps within 24-48 hours.</p>
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
                                                >
                                                    <i className="fab fa-whatsapp"></i>
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
                                                >
                                                    <i className="fas fa-video"></i>
                                                    <div>
                                                        <strong>Video Call</strong>
                                                        <span>See the bat live before buying</span>
                                                    </div>
                                                </a>

                                                <a
                                                    href="tel:+919320622451"
                                                    className="contact-option-btn call"
                                                >
                                                    <i className="fas fa-phone"></i>
                                                    <div>
                                                        <strong>Call Us</strong>
                                                        <span>+91 9320622451</span>
                                                    </div>
                                                </a>
                                            </div>

                                            <div className="shipping-info-clean">
                                                <p className="shipping-note-clean">
                                                    <i className="fas fa-info-circle"></i>
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

            {/* Watch & Buy Video - Only for Legacy Edition */}
            {product.id === 'legacy-edition' && (
                <WatchBuyVideo
                    product={product}
                    onAddToCart={onAddToCart}
                />
            )}
        </div>
    );
};
