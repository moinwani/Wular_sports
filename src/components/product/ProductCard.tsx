import { FC, memo, RefObject } from 'react';
import { useRouter } from 'next/router';
import { ProductFull } from '../../types';
import { getCDNUrl } from '../../services/githubService';

export interface ProductCardProps {
    product: ProductFull;
    onAddToCart: (product: ProductFull, size: string | null) => void;
    onImageClick: (images: string[], startIndex: number) => void;
    onWatchVideo: (url: string, ref: RefObject<HTMLButtonElement>) => void;
}

export const ProductCard: FC<ProductCardProps> = memo(({ product }) => {
    const router = useRouter();

    const handleCardClick = () => {
        router.push(`/product/${product.id}`);
    };

    const discountAmount = product.originalPrice ? product.originalPrice - product.price : 0;

    let imageElement;
    if (Array.isArray(product.image) && product.image.length > 0) {
        // Use the first image for listing card
        imageElement = (
            <img
                src={getCDNUrl(product.image[0])}
                alt={product.name}
                className="product-image"
            />
        );
    } else if (typeof product.image === 'string') {
        const imageUrl = getCDNUrl(product.image);
        imageElement = <img src={imageUrl} alt={product.name} className="product-image" />;
    }

    return (
        <div className="product-card compact" onClick={handleCardClick}>
            {imageElement}

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
