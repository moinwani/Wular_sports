import { FC, memo, useState, MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductFull } from '../../types';

export interface ProductCardProps {
    product: ProductFull;
    onAddToCart?: (product: ProductFull, size: string | null) => void;
    onImageClick?: (images: string[], startIndex: number) => void;
    onWatchVideo?: (url: string, ref?: any) => void;
}

export const ProductCard: FC<ProductCardProps> = memo(({ product }) => {
    const navigate = useNavigate();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [touchStart, setTouchStart] = useState<number | null>(null);

    const images = Array.isArray(product.image) ? product.image : [product.image];

    const handleCardClick = () => {
        navigate(`/product/${product.id}`);
    };

    const handlePrevImage = (e: MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const handleNextImage = (e: MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStart === null) return;
        const touchEnd = e.changedTouches[0].clientX;
        const diff = touchStart - touchEnd;

        if (diff > 50) {
            // Swipe right
            setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
        } else if (diff < -50) {
            // Swipe left
            setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
        }
        setTouchStart(null);
    };

    const discountAmount = product.originalPrice ? product.originalPrice - product.price : 0;

    return (
        <div
            className="product-card compact"
            onClick={handleCardClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <div className="product-image-container">
                <img
                    src={images[currentImageIndex]}
                    alt={`${product.name} - image ${currentImageIndex + 1}`}
                    className="product-image"
                />

                {images.length > 1 && (
                    <>
                        <button className="carousel-nav-btn prev" onClick={handlePrevImage} aria-label="Previous image">
                            <i className="fas fa-chevron-left"></i>
                        </button>
                        <button className="carousel-nav-btn next" onClick={handleNextImage} aria-label="Next image">
                            <i className="fas fa-chevron-right"></i>
                        </button>
                        <div className="carousel-dots">
                            {images.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`dot ${idx === currentImageIndex ? 'active' : ''}`}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

            <div className="product-info-compact">
                <h3 className="product-name">{product.name}</h3>
                <div className="product-price">
                    <span className="current-price">₹{product.price.toLocaleString('en-IN')}</span>
                    {product.originalPrice && (
                        <>
                            <span className="original-price">₹{product.originalPrice.toLocaleString('en-IN')}</span>
                            <span className="discount-amount">Save ₹{discountAmount.toLocaleString('en-IN')}</span>
                        </>
                    )}
                </div>
                <button className="btn-view-details">
                    View Details
                </button>
            </div>
        </div>
    );
});
