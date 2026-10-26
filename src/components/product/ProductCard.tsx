import { FC, memo, RefObject } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { ProductFull } from '../../types';
import { getCDNUrl } from '../../services/githubService';
import { productSizes, splitProductName } from '../../lib/catalog';

export interface ProductCardProps {
    product: ProductFull;
    onAddToCart: (product: ProductFull, size: string | null) => void;
    onImageClick: (images: string[], startIndex: number) => void;
    onWatchVideo: (url: string, ref: RefObject<HTMLButtonElement>) => void;
}

export const ProductCard: FC<ProductCardProps> = memo(({ product, onAddToCart }) => {
    const router = useRouter();

    // More than one size → the customer picks on the product page
    const sizes = productSizes(product);
    const [title, subtitle] = splitProductName(product.name);
    const needsSizeSelection = sizes.length > 1;

    const handleCardClick = () => {
        router.push(`/product/${product.id}`);
    };

    const handleAddToCart = (e: React.MouseEvent) => {
        e.stopPropagation();
        const size = sizes[0] || '';
        onAddToCart(product, size);

        if (typeof window !== 'undefined' && window.dataLayer) {
            window.dataLayer.push({
                event: 'add_to_cart',
                ecommerce: {
                    currency: 'INR',
                    value: product.price,
                    items: [{
                        item_id: product.id,
                        item_name: product.name,
                        price: product.price,
                        quantity: 1,
                        item_variant: size,
                        item_category: product.category?.[0] || '',
                    }]
                }
            });
        }
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
                <h3 className="product-name">{title}</h3>
                {subtitle && <p className="product-card-sub">{subtitle}</p>}
                {product.aggregateRating && product.aggregateRating.reviewCount > 0 && (
                    <p className="product-card-rating" aria-label={`Rated ${product.aggregateRating.ratingValue} out of 5`}>
                        <span aria-hidden="true">★</span> {product.aggregateRating.ratingValue}
                        <span className="product-card-rating__n"> ({product.aggregateRating.reviewCount})</span>
                    </p>
                )}
                <div className="product-price">
                    <span className="current-price">₹{product.price.toLocaleString('en-IN')}</span>
                    {product.originalPrice && (
                        <>
                            <span className="original-price">₹{product.originalPrice.toLocaleString('en-IN')}</span>
                            <span className="discount-amount">Save ₹{discountAmount.toLocaleString('en-IN')}</span>
                        </>
                    )}
                </div>
                <p className="product-card-perks">Free delivery · Cash on delivery</p>
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
