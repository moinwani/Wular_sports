import { FC, useState, useRef, useEffect } from 'react';
import { ProductFull } from '../../types';

interface WatchBuyVideoProps {
    product: ProductFull;
    onAddToCart: (product: ProductFull, size: string) => void;
    onClose?: () => void;
}

export const WatchBuyVideo: FC<WatchBuyVideoProps> = ({ product, onAddToCart, onClose }) => {
    const [isVisible, setIsVisible] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);
    const [showQuickActions, setShowQuickActions] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    const videoUrl = "https://res.cloudinary.com/ddahm5ebv/video/upload/v1767461480/for_tevxdy.mp4";

    const handleClose = () => {
        setIsVisible(false);
        if (onClose) {
            onClose();
        }
    };

    const handleVideoClick = () => {
        setShowQuickActions(!showQuickActions);
    };

    const handleAddToCart = () => {
        // Check if product has sizes - if so, prompt for size selection
        const hasSizes = product.category.some(cat => ['Hard Tennis', 'Soft Tennis', 'Leather Ball'].includes(cat));
        if (hasSizes) {
            // Scroll to size selector
            const sizeSelector = document.querySelector('.size-selector-premium');
            if (sizeSelector) {
                sizeSelector.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Highlight size selector
                sizeSelector.classList.add('pulse-highlight');
                setTimeout(() => sizeSelector.classList.remove('pulse-highlight'), 2000);
            }
            setShowQuickActions(false);
        } else {
            onAddToCart(product, '35 inch'); // Default size if no size selector
            setShowQuickActions(false);
        }
    };

    const handleMoreInfo = () => {
        // Scroll to product details section
        const detailsSection = document.querySelector('.product-tabs-container');
        if (detailsSection) {
            detailsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        setShowQuickActions(false);
    };

    // Auto-play and loop video
    useEffect(() => {
        if (videoRef.current && isVisible) {
            videoRef.current.play().catch(() => {
                // Autoplay may be blocked by browser, handle silently
            });
        }
    }, [isVisible]);

    if (!isVisible) return null;

    return (
        <div className={`watch-buy-video-container ${isExpanded ? 'expanded' : ''} ${showQuickActions ? 'show-actions' : ''}`}>
            <div className="watch-buy-video-header">
                <span className="watch-buy-label">Watch & Buy</span>
                <button 
                    className="watch-buy-close-btn"
                    onClick={handleClose}
                    aria-label="Close video"
                >
                    <i className="fas fa-times"></i>
                </button>
            </div>
            
            <div 
                className="watch-buy-video-wrapper"
                onClick={handleVideoClick}
            >
                <video
                    ref={videoRef}
                    src={videoUrl}
                    muted
                    loop
                    playsInline
                    className="watch-buy-video"
                    aria-label="Product demonstration video"
                />
                {!showQuickActions && (
                    <div className="watch-buy-overlay">
                        <i className="fas fa-play"></i>
                    </div>
                )}
            </div>

            {showQuickActions && (
                <div className="watch-buy-quick-actions">
                    <button 
                        className="quick-action-btn primary"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart();
                        }}
                    >
                        <i className="fas fa-shopping-bag"></i>
                        Add to Cart
                    </button>
                    <button 
                        className="quick-action-btn secondary"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleMoreInfo();
                        }}
                    >
                        <i className="fas fa-info-circle"></i>
                        More Info
                    </button>
                </div>
            )}
        </div>
    );
};
