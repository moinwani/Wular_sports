import { FC, memo, RefObject } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductFull } from '../../types';

export interface ProductCardProps {
    product: ProductFull;
    onAddToCart: (product: ProductFull, size: string | null) => void;
    onImageClick: (images: string[], startIndex: number) => void;
    onWatchVideo: (url: string, ref: RefObject<HTMLButtonElement>) => void;
}

export const ProductCard: FC<ProductCardProps> = memo(({ product }) => {
    const navigate = useNavigate();

    const handleCardClick = () => {
        navigate(`/product/${product.id}`);
    };

    const discountPercentage = product.originalPrice 
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
        : 0;
    const discountAmount = product.originalPrice ? product.originalPrice - product.price : 0;

    let imageElement;
    if (Array.isArray(product.image) && product.image.length > 0) {
        // Use the first image for listing card
        imageElement = (
            <img
                src={product.image[0]}
                alt={product.name}
                className="product-image"
            />
        );
    } else if (typeof product.image === 'string') {
        const imageUrl = product.image;
        imageElement = <img src={imageUrl} alt={product.name} className="product-image" />;
    }

    return (
        <div className="product-card compact" onClick={handleCardClick}>
            {imageElement}
            
            <div className="product-tags-below-image">
                <span className="tag category-tag">{product.category[0]}</span>
                {product.originalPrice && (
                    <span className="tag sale-tag discount-badge-large">
                        SAVE {discountPercentage}%
                    </span>
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
                <p className="product-description-short">
                    {product.description.length > 70 ? product.description.substring(0, 70) + '...' : product.description}
                </p>
                <button className="btn-view-details">
                    View Details
                </button>
            </div>
        </div>
    );
});
