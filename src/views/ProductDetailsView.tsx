import { FC, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { products } from '../data/products';
import { ProductFull } from '../types';
import { createWhatsAppLink } from '../utils/helpers';
import { Lightbox } from '../components/common/Lightbox';
import { ImageGallery } from '../components/product/ImageGallery';

export interface ProductDetailsViewProps {
    onAddToCart: (product: ProductFull, size: string) => void;
}

export const ProductDetailsView: FC<ProductDetailsViewProps> = ({ onAddToCart }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [selectedSize, setSelectedSize] = useState<string>('');
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

    const handleAddToCartClick = () => {
        if (hasSizes && !selectedSize) {
            alert("Please select a size to continue");
            return;
        }
        onAddToCart(product, selectedSize);
    };

    const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedSize(e.target.value);
    };

    return (
        <div className="product-details-page">
            <div className="container">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <i className="fas fa-arrow-left"></i> Back
                </button>

                <div className="product-details-grid">
                    {/* Left Column: Images */}
                    <div className="product-gallery-section">
                        {Array.isArray(product.image) ? (
                            <ImageGallery
                                images={product.image}
                                altText={product.name}
                                onImageClick={handleOpenLightbox}
                            />
                        ) : (
                            <img
                                src={product.image}
                                alt={product.name}
                                className="product-main-image"
                                onClick={() => {
                                    setLightboxIndex(0);
                                    setIsLightboxOpen(true);
                                }}
                            />
                        )}
                    </div>

                    {/* Right Column: Product Info */}
                    <div className="product-info-section">
                        <div className="product-header-group">
                            <div className="product-badge-row">
                                <span className="tramboo-badge-red">#1 BEST SELLER</span>
                            </div>

                            <h1 className="product-title-condensed">{product.name}</h1>

                            <div className="product-price-row">
                                <span className="price-main">RS. {product.price.toLocaleString('en-IN')}.00</span>
                                {product.originalPrice && (
                                    <>
                                        <span className="price-crossed">RS. {product.originalPrice.toLocaleString('en-IN')}.00</span>
                                        <span className="badge-save">SAVE {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%</span>
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
                            <div className="size-selector-clean">
                                <div className="size-options-grid">
                                    {['35 inch', '36 inch'].map(size => (
                                        <label key={size} className={`size-option-box ${selectedSize === size ? 'selected' : ''}`}>
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
                            </div>
                        )}

                        <div className="action-area">
                            <button className="add-to-cart-large" onClick={handleAddToCartClick}>
                                <span><i className="fas fa-shopping-bag"></i> BUY NOW - RS. {product.price.toLocaleString('en-IN')}.00</span>
                                {product.originalPrice && <span className="btn-crossed-price">RS. {product.originalPrice.toLocaleString('en-IN')}.00</span>}
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
