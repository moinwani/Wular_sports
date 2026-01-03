import { FC, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { products } from '../data/products';
import { ProductFull } from '../types';
import { createWhatsAppLink } from '../utils/helpers';
import { Lightbox } from '../components/common/Lightbox';
import { VerticalImageGallery } from '../components/product/VerticalImageGallery';
import { SEOHead } from '../components/common/SEOHead';

export interface ProductDetailsViewProps {
    onAddToCart: (product: ProductFull, size: string) => void;
}

export const ProductDetailsView: FC<ProductDetailsViewProps> = ({ onAddToCart }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [selectedSize, setSelectedSize] = useState<string>('');
    const [sizeError, setSizeError] = useState(false);
    const [openSection, setOpenSection] = useState<string | null>('description');
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    const product = products.find(p => p.id === id);

    if (!product) {
        // Ideally we might want to redirect, but returning null or a not found message is safe
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
        <div className="product-details-page">
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

                <div className="product-details-grid-vertical">
                    {/* Left Column: Vertical Scrollable Images */}
                    <div className="product-gallery-section-vertical">
                        {Array.isArray(product.image) ? (
                            <VerticalImageGallery
                                images={product.image}
                                altText={product.name}
                                onImageClick={(index) => {
                                    setLightboxIndex(index);
                                    setIsLightboxOpen(true);
                                }}
                            />
                        ) : (
                            <div className="vertical-gallery-scroll-container">
                                <div 
                                    className="vertical-gallery-image-item"
                                    onClick={() => {
                                        setLightboxIndex(0);
                                        setIsLightboxOpen(true);
                                    }}
                                >
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="vertical-gallery-image"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Product Info - Sticky */}
                    <div className="product-info-section-sticky">
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
