import React, { FC, memo, useState, useRef, useMemo } from 'react';
import { ProductFull } from '../../types';
import { ImageGallery } from './ImageGallery';
import { getSpecIcon } from '../../utils/helpers';

export interface ProductCardProps {
    product: ProductFull;
    onAddToCart: (product: ProductFull, size: string | null) => void;
    onImageClick: (images: string[], startIndex: number) => void;
    onWatchVideo: (url: string, ref: React.RefObject<HTMLButtonElement>) => void;
}

export const ProductCard: FC<ProductCardProps> = memo(({ product, onAddToCart, onImageClick, onWatchVideo }) => {
    const videoButtonRef = useRef<HTMLButtonElement>(null);
    const hasSizeOptions = useMemo(() => {
        return product.specs.some(spec =>
            spec.toLowerCase().includes('35') &&
            spec.toLowerCase().includes('36') &&
            spec.toLowerCase().includes('inch')
        );
    }, [product.specs]);

    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [showSizeError, setShowSizeError] = useState(false);

    // Urgency Trigger Logic
    const urgencyMessage = useMemo(() => {
        if (product.originalPrice && product.originalPrice > product.price) {
            const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
            if (discount > 30) return `🔥 High Demand! ${discount}% OFF`;
        }
        return "⚡ Selling Fast!";
    }, [product.price, product.originalPrice]);

    let imageElement;
    if (Array.isArray(product.image) && product.image.length > 0) {
        imageElement = <ImageGallery images={product.image} altText={product.name} onImageClick={(index) => onImageClick(product.image as string[], index)} />;
    } else if (typeof product.image === 'string') {
        const imageUrl = product.image;
        imageElement = <img src={imageUrl} alt={product.name} className="product-image" onClick={() => onImageClick([imageUrl], 0)} />;
    }

    const handleAddToCartClick = () => {
        if (hasSizeOptions && !selectedSize) {
            setShowSizeError(true);
            return;
        }
        onAddToCart(product, selectedSize);
    };

    const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedSize(e.target.value);
        if (showSizeError) {
            setShowSizeError(false);
        }
    };

    return (
        <div className="product-card">
            <div className="product-tags">
                <span className="tag category-tag">{product.category.join(' / ')}</span>
                {product.originalPrice && <span className="tag sale-tag">Sale</span>}
            </div>
            {imageElement}

            <div className="urgency-bar">
                <i className="fas fa-fire-alt"></i> {urgencyMessage}
            </div>

            {product.videoUrl && (
                <div className="product-video-button-container">
                    <button ref={videoButtonRef} className="btn video-btn" onClick={() => onWatchVideo(product.videoUrl!, videoButtonRef)}>
                        ▶ Watch Bat in Action
                    </button>
                </div>
            )}
            <h3 className="product-name">{product.name}</h3>
            <p className="product-description">{product.description}</p>

            {hasSizeOptions && (
                <div className="product-size-selector">
                    <div className="size-selector-header">
                        <label className="size-selector-label">Select Bat Size</label>
                    </div>
                    <div className="size-radio-group">
                        <div className="size-radio-option">
                            <input type="radio" id={`size-35-${product.id}`} name={`size-${product.id}`} value="35 inch" checked={selectedSize === "35 inch"} onChange={handleSizeChange} />
                            <label htmlFor={`size-35-${product.id}`}>35 inch</label>
                        </div>
                        <div className="size-radio-option">
                            <input type="radio" id={`size-36-${product.id}`} name={`size-${product.id}`} value="36 inch" checked={selectedSize === "36 inch"} onChange={handleSizeChange} />
                            <label htmlFor={`size-36-${product.id}`}>36 inch</label>
                        </div>
                    </div>
                    {showSizeError && <p className="error-message size-error">Please select a bat size.</p>}
                </div>
            )}

            <div className="product-specs-grid">
                {product.specs.map((spec, i) => (
                    <div key={i} className="spec-item">
                        <i className={`fas ${getSpecIcon(spec)} spec-icon`} aria-hidden="true"></i>
                        <span className="spec-text">{spec}</span>
                    </div>
                ))}
            </div>

            <div className="product-footer">
                <div className="product-price">
                    <span className="current-price">₹{product.price.toLocaleString('en-IN')}</span>
                    {product.originalPrice && <span className="original-price">₹{product.originalPrice.toLocaleString('en-IN')}</span>}
                </div>
                <button className="btn add-to-cart-btn" onClick={handleAddToCartClick}>
                    <i className="fas fa-shopping-cart" aria-hidden="true"></i> Add to Cart
                </button>
            </div>

            <div className="trust-badges">
                <div className="trust-item">
                    <i className="fas fa-shield-alt"></i>
                    <span>Secure Checkout</span>
                </div>
                <div className="trust-item">
                    <i className="fas fa-undo"></i>
                    <span>3-Day Return</span>
                </div>
                <div className="trust-item">
                    <i className="fas fa-check-circle"></i>
                    <span>Authentic</span>
                </div>
            </div>

            {product.reviewLink && (
                <div className="product-review-section verified-review">
                    <div className="verified-badge">
                        <i className="fas fa-check-circle"></i>
                        <span>Verified Customer Review</span>
                    </div>
                    <a href={product.reviewLink} target="_blank" rel="noopener noreferrer" className="btn review-btn">
                        <i className="fab fa-instagram"></i> Watch Real Customer Review
                    </a>
                </div>
            )}
        </div>
    );
});
