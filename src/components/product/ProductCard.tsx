import { FC, memo, RefObject } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { ProductFull } from '../../types';
import { getCDNUrl } from '../../services/githubService';

export interface ProductCardProps {
    product: ProductFull;
    onAddToCart: (product: ProductFull, size: string | null) => void;
    onImageClick: (images: string[], startIndex: number) => void;
    onWatchVideo: (url: string, ref: RefObject<HTMLButtonElement>) => void;
}

export const ProductCard: FC<ProductCardProps> = memo(({ product, onAddToCart }) => {
    const router = useRouter();

    const isHoneycomb = product.id === 'ak-47-honeycomb';
    const needsSizeSelection = !isHoneycomb && product.category.some(
        cat => ['Hard Tennis', 'Soft Tennis', 'Leather Ball'].includes(cat)
    );

    const handleCardClick = () => {
        router.push(`/product/${product.id}`);
    };

    const handleAddToCart = (e: React.MouseEvent) => {
        e.stopPropagation();
        const size = isHoneycomb ? '35 inch' : '';
        onAddToCart(product, size);
    };

    const handleViewDetails = (e: React.MouseEvent) => {
        e.stopPropagation();
        router.push(`/product/${product.id}`);
    };

    const discountAmount = product.originalPrice ? product.originalPrice - product.price : 0;

    let imageElement;
    if (Array.isArray(product.image) && product.image.length > 0) {
        imageElement = (
            <Image
                src={getCDNUrl(product.image[0])}
                alt={product.name}
                width={300}
                height={300}
                className="product-image"
                unoptimized
            />
        );
    } else if (typeof product.image === 'string') {
        const imageUrl = getCDNUrl(product.image);
        imageElement = (
            <Image
                src={imageUrl}
                alt={product.name}
                width={300}
                height={300}
                className="product-image"
                unoptimized
            />
        );
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
                <button className="btn-view-details" onClick={handleViewDetails}>
                    View Details
                </button>
                {!needsSizeSelection && (
                    <button className="btn-add-to-cart" onClick={handleAddToCart} style={{ marginTop: '0.5rem' }}>
                        Add to Cart
                    </button>
                )}
            </div>
        </div>
    );
});
