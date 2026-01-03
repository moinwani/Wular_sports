import { FC, useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { products } from '../data/products';
import { ProductFull } from '../types';
import { createWhatsAppLink } from '../utils/helpers';
import { Lightbox } from '../components/common/Lightbox';
import { VerticalImageGallery } from '../components/product/VerticalImageGallery';
import { HorizontalImageGallery } from '../components/product/HorizontalImageGallery';
import { SEOHead } from '../components/common/SEOHead';

export interface ProductDetailsViewProps {
    onAddToCart: (product: ProductFull, size: string) => void;
}

type ScrollPhase = 'images' | 'content' | 'normal';

export const ProductDetailsView: FC<ProductDetailsViewProps> = ({ onAddToCart }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [selectedSize, setSelectedSize] = useState<string>('');
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
        
        if (maxScroll <= 0) {
            // No scroll needed, move to content phase
            setScrollPhase('content');
            return;
        }
        
        const progress = maxScroll > 0 ? scrollTop / maxScroll : 0;
        imageScrollProgressRef.current = progress;
        
        if (progress >= 0.99 && scrollPhase === 'images') {
            setScrollPhase('content');
        }
    }, [scrollPhase, isMobile]);

    // Check content scroll completion
    const checkContentScrollComplete = useCallback(() => {
        if (!contentSectionRef.current || isMobile || scrollPhase !== 'content') return;
        
        const content = contentSectionRef.current;
        const scrollTop = content.scrollTop;
        const scrollHeight = content.scrollHeight;
        const clientHeight = content.clientHeight;
        const maxScroll = scrollHeight - clientHeight;
        
        if (maxScroll <= 0) {
            setScrollPhase('normal');
            return;
        }
        
        const progress = maxScroll > 0 ? scrollTop / maxScroll : 0;
        contentScrollProgressRef.current = progress;
        
        if (progress >= 0.99 && scrollPhase === 'content') {
            setScrollPhase('normal');
        }
    }, [scrollPhase, isMobile]);

    // Handle wheel event for controlled scrolling
    const handleWheel = useCallback((e: WheelEvent) => {
        if (isMobile || isScrollingRef.current) return;
        
        // Only prevent default during controlled scroll phases
        if (scrollPhase === 'images' || scrollPhase === 'content') {
            e.preventDefault();
            e.stopPropagation();
            
            if (isScrollingRef.current) return;
            isScrollingRef.current = true;
            
            const delta = e.deltaY;
            
            if (scrollPhase === 'images' && imageScrollContainerRef.current) {
                const scrollContainer = imageScrollContainerRef.current;
                const currentScroll = scrollContainer.scrollTop;
                const maxScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight;
                const newScroll = Math.max(0, Math.min(maxScroll, currentScroll + delta * 0.5));
                
                scrollContainer.scrollTo({ top: newScroll, behavior: 'auto' });
                
                setTimeout(() => {
                    checkImageScrollComplete();
                    isScrollingRef.current = false;
                }, 50);
            } else if (scrollPhase === 'content' && contentSectionRef.current) {
                const content = contentSectionRef.current;
                const currentScroll = content.scrollTop;
                const maxScroll = content.scrollHeight - content.clientHeight;
                const newScroll = Math.max(0, Math.min(maxScroll, currentScroll + delta * 0.5));
                
                content.scrollTo({ top: newScroll, behavior: 'auto' });
                
                setTimeout(() => {
                    checkContentScrollComplete();
                    isScrollingRef.current = false;
                }, 50);
            } else {
                isScrollingRef.current = false;
            }
        }
    }, [scrollPhase, isMobile, checkImageScrollComplete, checkContentScrollComplete]);

    // Attach wheel event listener and prevent body scroll during controlled phases
    useEffect(() => {
        if (isMobile) {
            document.body.style.overflow = '';
            return;
        }
        
        const container = productPageRef.current;
        if (!container) return;
        
        // Prevent body scroll during controlled scroll phases
        if (scrollPhase === 'images' || scrollPhase === 'content') {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        
        container.addEventListener('wheel', handleWheel, { passive: false });
        
        return () => {
            container.removeEventListener('wheel', handleWheel);
            document.body.style.overflow = '';
        };
    }, [handleWheel, isMobile, scrollPhase]);

    // Monitor image gallery scroll
    useEffect(() => {
        if (isMobile || scrollPhase !== 'images') return;
        
        const scrollContainer = imageScrollContainerRef.current;
        if (!scrollContainer) return;
        
        const handleScroll = () => {
            checkImageScrollComplete();
        };
        
        scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
        return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }, [scrollPhase, isMobile, checkImageScrollComplete]);

    // Monitor content scroll
    useEffect(() => {
        if (isMobile || scrollPhase !== 'content') return;
        
        const content = contentSectionRef.current;
        if (!content) return;
        
        const handleScroll = () => {
            checkContentScrollComplete();
        };
        
        content.addEventListener('scroll', handleScroll, { passive: true });
        return () => content.removeEventListener('scroll', handleScroll);
    }, [scrollPhase, isMobile, checkContentScrollComplete]);

    // Reset scroll phase when product changes
    useEffect(() => {
        setScrollPhase('images');
        imageScrollProgressRef.current = 0;
        contentScrollProgressRef.current = 0;
    }, [id]);

    if (!product) {
        return <div className="container">Product not found</div>;
    }

    const toggleSection = (section: string) => {
        setOpenSection(openSection === section ? null : section);
    };

    const handleOpenLightbox = (index: number) => {
        setLightboxIndex(index);
        setIsLightboxOpen(true);
    };

    if (!product) return null;

    const hasSizes = product.category.some(cat => ['Hard Tennis', 'Soft Tennis', 'Leather Ball'].includes(cat));
    const discountPercentage = product.originalPrice 
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
        : 0;

    const handleAddToCartClick = () => {
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
        onAddToCart(product, selectedSize);
    };

    const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedSize(e.target.value);
        setSizeError(false);
    };

    // Extract key specs for visual display
    const getWeightSpec = () => {
        const weightSpec = product.specs.find(s => s.toLowerCase().includes('weight'));
        return weightSpec ? weightSpec.split(':')[1]?.trim() : null;
    };

    const getEdgeSpec = () => {
        const edgeSpec = product.specs.find(s => s.toLowerCase().includes('edge'));
        return edgeSpec ? edgeSpec.split(':')[1]?.trim() : null;
    };

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
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <i className="fas fa-arrow-left"></i> Back
                </button>

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
                        <div className="product-header-group">
                            <div className="product-badge-row">
                                <span className="tramboo-badge-red">#1 BEST SELLER</span>
                            </div>

                            <h1 className="product-title-condensed">{product.name}</h1>

                            {/* Social Proof Banner */}
                            <div className="social-proof-banner">
                                <span><i className="fas fa-star"></i> 4.8/5</span>
                                <span>|</span>
                                <span><i className="fas fa-users"></i> 127+ Reviews</span>
                                <span>|</span>
                                <span><i className="fas fa-fire"></i> 50+ Sold This Month</span>
                            </div>

                            <div className="product-price-row">
                                <span className="price-main">₹{product.price.toLocaleString('en-IN')}</span>
                                {product.originalPrice && (
                                    <>
                                        <span className="price-crossed">₹{product.originalPrice.toLocaleString('en-IN')}</span>
                                        <span className="badge-save discount-badge-large">SAVE {discountPercentage}%</span>
                                    </>
                                )}
                            </div>

                            {/* Features Grid Compact */}
                            <div className="features-grid-compact">
                                <div className="feature-item-compact">
                                    <i className="fas fa-magic feature-icon-red"></i> READY TO PLAY
                                </div>
                                <div className="feature-item-compact">
                                    <i className="far fa-clock feature-icon-red"></i> 1 YEAR HANDLE WARRANTY
                                </div>
                                <div className="feature-item-compact">
                                    <i className="fas fa-feather feature-icon-red"></i> LIGHTWEIGHT
                                </div>
                                <div className="feature-item-compact">
                                    <i className="fas fa-certificate feature-icon-red"></i> PINGS LIKE A ROCKET
                                </div>
                            </div>
                        </div>

                        {hasSizes && (
                            <div className={`size-selector-container ${sizeError ? 'error-state' : ''}`}>
                                <div className="size-selector-header">
                                    <label className="size-label">
                                        Select Size <span className="required-asterisk">*</span>
                                    </label>
                                </div>
                                <div className="size-options-grid">
                                    {['35 inch', '36 inch'].map(size => (
                                        <label key={size} className={`size-option-box ${selectedSize === size ? 'selected' : ''} ${sizeError ? 'error' : ''}`}>
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
                                    <p className="size-error-message">
                                        <i className="fas fa-exclamation-circle"></i> Please select a size to continue
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Trust Box */}
                        <div className="product-trust-box">
                            <div className="trust-item">
                                <i className="fas fa-shield-check"></i>
                                <div>
                                    <strong>1 Year Handle Warranty</strong>
                                    <p>Coverage on manufacturing defects</p>
                                </div>
                            </div>
                            <div className="trust-item">
                                <i className="fas fa-truck-fast"></i>
                                <div>
                                    <strong>Free Shipping Across India</strong>
                                    <p>Delivered in 3-5 business days</p>
                                </div>
                            </div>
                            <div className="trust-item">
                                <i className="fas fa-undo-alt"></i>
                                <div>
                                    <strong>7-Day Return Policy</strong>
                                    <p>Hassle-free returns if not satisfied</p>
                                </div>
                            </div>
                            <div className="trust-item">
                                <i className="fas fa-certificate"></i>
                                <div>
                                    <strong>Authentic Kashmir Willow</strong>
                                    <p>Handcrafted with premium materials</p>
                                </div>
                            </div>
                        </div>

                        {/* What's Included Section */}
                        <div className="whats-included-box">
                            <h4>What's Included</h4>
                            <div className="included-items">
                                <div className="included-item">
                                    <i className="fas fa-check-circle"></i>
                                    <span>Premium Cricket Bat</span>
                                </div>
                                <div className="included-item">
                                    <i className="fas fa-check-circle"></i>
                                    <span>Free Bat Bag (Worth ₹200)</span>
                                </div>
                                <div className="included-item">
                                    <i className="fas fa-check-circle"></i>
                                    <span>Premium Toe Guard</span>
                                </div>
                                <div className="included-item">
                                    <i className="fas fa-check-circle"></i>
                                    <span>Extra Grip</span>
                                </div>
                                <div className="included-item">
                                    <i className="fas fa-check-circle"></i>
                                    <span>Fully Knocked & Oiled (Ready to Play)</span>
                                </div>
                            </div>
                            <p className="total-value">Total Value: ₹{(product.price + 200).toLocaleString('en-IN')} | You Save: ₹200</p>
                        </div>

                        {/* Key Specs Visual Cards */}
                        <div className="product-key-specs">
                            {getWeightSpec() && (
                                <div className="spec-card highlighted">
                                    <i className="fas fa-weight"></i>
                                    <div>
                                        <strong>Weight</strong>
                                        <p>{getWeightSpec()}</p>
                                    </div>
                                </div>
                            )}
                            <div className="spec-card">
                                <i className="fas fa-ruler-vertical"></i>
                                <div>
                                    <strong>Available Sizes</strong>
                                    <p>35" & 36"</p>
                                </div>
                            </div>
                            {getEdgeSpec() && (
                                <div className="spec-card">
                                    <i className="fas fa-ruler-combined"></i>
                                    <div>
                                        <strong>Edge Thickness</strong>
                                        <p>{getEdgeSpec()}</p>
                                    </div>
                                </div>
                            )}
                            <div className="spec-card">
                                <i className="fas fa-tree"></i>
                                <div>
                                    <strong>Willow Grade</strong>
                                    <p>Premium Kashmir Willow</p>
                                </div>
                            </div>
                        </div>

                        <div className="action-area">
                            <button className="add-to-cart-large" onClick={handleAddToCartClick}>
                                <span><i className="fas fa-shopping-bag"></i> BUY NOW - ₹{product.price.toLocaleString('en-IN')}</span>
                                {product.originalPrice && <span className="btn-crossed-price">₹{product.originalPrice.toLocaleString('en-IN')}</span>}
                            </button>

                            <div className="contact-options-row">
                                <a
                                    href={createWhatsAppLink(`Hi, I'm interested in ${product.name}`)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-contact-option btn-whatsapp-opt"
                                >
                                    <i className="fab fa-whatsapp"></i> SHOP ON WHATSAPP
                                </a>
                                <a
                                    href={createWhatsAppLink(`Hi, I want to see ${product.name} on Video Call`)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-contact-option btn-video-opt"
                                >
                                    <i className="fas fa-video"></i> SHOP ON VIDEO CALL
                                </a>
                            </div>

                            <p className="shipping-note">
                                NOTE: IT CAN TAKE UPTO 2-3 WORKING DAYS FOR THE BAT TO BE DISPATCHED. ALL ORDERS ARE DISPATCHED BY AIR FOR EXPRESS DELIVERY.
                            </p>
                        </div>

                        {/* Collapsible Sections */}
                        <div className="product-sections-container">
                            <div className="collapsible-section">
                                <button className="section-header" onClick={() => toggleSection('description')}>
                                    DESCRIPTION
                                    <i className={`fas ${openSection === 'description' ? 'fa-minus' : 'fa-plus'}`}></i>
                                </button>
                                <div className={`section-content ${openSection === 'description' ? 'open' : ''}`}>
                                    <p>{product.description}</p>
                                    <ul className="description-list">
                                        <li>Premium Kashmir Willow</li>
                                        <li>Full Cane Handle</li>
                                        <li>Double Blade / Single Blade Options</li>
                                        <li>Toe Guard Fitted</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="collapsible-section">
                                <button className="section-header" onClick={() => toggleSection('usage')}>
                                    HOW TO USE
                                    <i className={`fas ${openSection === 'usage' ? 'fa-minus' : 'fa-plus'}`}></i>
                                </button>
                                <div className={`section-content ${openSection === 'usage' ? 'open' : ''}`}>
                                    <p>Recommended for use with hard tennis balls (Guru, Nivia, etc). Avoid using with heavy leather balls unless specified.</p>
                                </div>
                            </div>

                            <div className="collapsible-section">
                                <button className="section-header" onClick={() => toggleSection('shipping')}>
                                    SHIPPING & RETURNS
                                    <i className={`fas ${openSection === 'shipping' ? 'fa-minus' : 'fa-plus'}`}></i>
                                </button>
                                <div className={`section-content ${openSection === 'shipping' ? 'open' : ''}`}>
                                    <p>Free shipping across India. Returns accepted within 3 days of delivery if the product is defective. See our Return Policy for details.</p>
                                </div>
                            </div>
                        </div>
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
        </div>
    );
};
