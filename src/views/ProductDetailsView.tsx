import React, { FC, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { products } from '../data/products';
import { ProductFull } from '../types';
import { getSpecIcon } from '../utils/helpers';
import { ImageGallery } from '../components/product/ImageGallery';

export interface ProductDetailsViewProps {
    onAddToCart: (product: ProductFull, size: string) => void;
}

export const ProductDetailsView: FC<ProductDetailsViewProps> = ({ onAddToCart }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [product, setProduct] = useState<ProductFull | null>(null);
    const [selectedSize, setSelectedSize] = useState<string>('');
    const [sizeError, setSizeError] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
        const foundProduct = products.find(p => p.id === id);
        if (foundProduct) {
            setProduct(foundProduct);
        } else {
            navigate('/'); // Redirect to home if product not found
        }
    }, [id, navigate]);

    if (!product) return null;

    const hasSizes = product.category.some(cat => ['Hard Tennis', 'Soft Tennis', 'Leather Ball'].includes(cat));

    const handleAddToCartClick = () => {
        if (hasSizes && !selectedSize) {
            setSizeError(true);
            return;
        }
        onAddToCart(product, selectedSize);
    };

    const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedSize(e.target.value);
        if (sizeError) setSizeError(false);
    };

    return (
        <div className="product-details-page">
            <div className="container">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <i className="fas fa-arrow-left"></i> Back to Collection
                </button>

                <div className="product-details-grid">
                    {/* Left Column: Images */}
                    <div className="product-gallery-section">
                        {Array.isArray(product.image) ? (
                            <ImageGallery images={product.image} altText={product.name} />
                        ) : (
                            <img src={product.image} alt={product.name} className="product-main-image" />
                        )}

                        {/* Video Button */}
                        {product.videoUrl && (
                            <div className="product-video-section">
                                <a
                                    href={product.videoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn video-btn"
                                >
                                    <i className="fab fa-youtube"></i> Watch Product Video
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Product Info */}
                    <div className="product-info-section">
                        <div className="product-header-group">
                            <div className="product-tags">
                                <span className="tag category-tag">{product.category.join(' / ')}</span>
                                {product.originalPrice && <span className="tag sale-tag">Sale</span>}
                            </div>
                            <h1 className="product-title">{product.name}</h1>
                            <div className="product-price-large">
                                <span className="current-price">₹{product.price.toLocaleString('en-IN')}</span>
                                {product.originalPrice && <span className="original-price">₹{product.originalPrice.toLocaleString('en-IN')}</span>}
                            </div>
                        </div>

                        <div className="product-description-full">
                            <p>{product.description}</p>
                        </div>

                        {hasSizes && (
                            <div className="size-selector-container">
                                <label className="size-label">Select Size:</label>
                                <div className="size-options-grid">
                                    <label className={`size-option-box ${selectedSize === '35 inch' ? 'selected' : ''}`}>
                                        <input
                                            type="radio"
                                            name="bat-size"
                                            value="35 inch"
                                            checked={selectedSize === '35 inch'}
                                            onChange={handleSizeChange}
                                        />
                                        <span>35 inch</span>
                                    </label>
                                    <label className={`size-option-box ${selectedSize === '36 inch' ? 'selected' : ''}`}>
                                        <input
                                            type="radio"
                                            name="bat-size"
                                            value="36 inch"
                                            checked={selectedSize === '36 inch'}
                                            onChange={handleSizeChange}
                                        />
                                        <span>36 inch</span>
                                    </label>
                                </div>
                                {sizeError && <p className="error-text">Please select a size to continue</p>}
                            </div>
                        )}

                        <div className="specs-container">
                            <h3>Specifications</h3>
                            <div className="specs-list">
                                {product.specs.map((spec, i) => (
                                    <div key={i} className="spec-row">
                                        <i className={`fas ${getSpecIcon(spec)}`}></i>
                                        <span>{spec}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="action-area">
                            <button className="btn add-to-cart-large" onClick={handleAddToCartClick}>
                                <i className="fas fa-shopping-cart"></i> Add to Cart - ₹{product.price.toLocaleString('en-IN')}
                            </button>

                            <div className="trust-badges-row">
                                <div className="trust-badge">
                                    <i className="fas fa-shield-alt"></i>
                                    <span>Secure Payment</span>
                                </div>
                                <div className="trust-badge">
                                    <i className="fas fa-truck"></i>
                                    <span>Fast Delivery</span>
                                </div>
                                <div className="trust-badge">
                                    <i className="fas fa-check-circle"></i>
                                    <span>100% Authentic</span>
                                </div>
                            </div>
                        </div>

                        {product.reviewLink && (
                            <div className="review-box">
                                <div className="verified-label"><i className="fas fa-check"></i> Verified Review</div>
                                <a href={product.reviewLink} target="_blank" rel="noopener noreferrer" className="review-link">
                                    <i className="fab fa-instagram"></i> Watch Customer Review
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
