import { FC, useState, useRef, useEffect, useCallback } from 'react';
import { ProductFull } from '../../types';

interface WatchBuyVideoProps {
    product: ProductFull;
    onAddToCart: (product: ProductFull, size: string) => void;
    onClose?: () => void;
}

export const WatchBuyVideo: FC<WatchBuyVideoProps> = ({ product, onAddToCart, onClose }) => {
    const [isVisible, setIsVisible] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const floatingVideoRef = useRef<HTMLVideoElement>(null);
    const modalVideoRef = useRef<HTMLVideoElement>(null);

    const videoUrl = "https://res.cloudinary.com/ddahm5ebv/video/upload/v1767461480/for_tevxdy.mp4";

    // Close completely - hide floating video and modal
    const handleCloseComplete = useCallback(() => {
        setIsVisible(false);
        setIsModalOpen(false);
        // Pause both videos
        if (floatingVideoRef.current) {
            floatingVideoRef.current.pause();
        }
        if (modalVideoRef.current) {
            modalVideoRef.current.pause();
        }
        if (onClose) {
            onClose();
        }
    }, [onClose]);

    // Open modal on video click
    const handleVideoClick = () => {
        setIsModalOpen(true);
        // Pause floating video when modal opens
        if (floatingVideoRef.current) {
            floatingVideoRef.current.pause();
        }
    };

    // Close modal (but keep floating video visible)
    const handleModalClose = () => {
        setIsModalOpen(false);
        // Resume floating video
        if (floatingVideoRef.current) {
            floatingVideoRef.current.play().catch(() => {});
        }
    };

    // Add to Cart handler - closes everything
    const handleAddToCart = () => {
        const hasSizes = product.category.some(cat => ['Hard Tennis', 'Soft Tennis', 'Leather Ball'].includes(cat));
        if (hasSizes) {
            // Scroll to size selector
            const sizeSelector = document.querySelector('.size-selector-premium');
            if (sizeSelector) {
                sizeSelector.scrollIntoView({ behavior: 'smooth', block: 'center' });
                sizeSelector.classList.add('pulse-highlight');
                setTimeout(() => sizeSelector.classList.remove('pulse-highlight'), 2000);
            }
        } else {
            onAddToCart(product, '35 inch');
        }
        // Close everything
        handleCloseComplete();
    }, [product, onAddToCart, handleCloseComplete]);

    // More Info handler - closes video and scrolls to tabs
    const handleMoreInfo = useCallback(() => {
        // Close everything first
        handleCloseComplete();
        
        // Wait a bit for close animation, then scroll
        setTimeout(() => {
            const tabsContainer = document.querySelector('.product-tabs-container');
            if (tabsContainer) {
                tabsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                // Open description tab if not already open
                const descriptionTab = document.querySelector('.product-tab') as HTMLElement;
                if (descriptionTab && !descriptionTab.classList.contains('active')) {
                    descriptionTab.click();
                }
            }
        }, 300);
    }, [handleCloseComplete]);

    // Listen for Buy Now button clicks to close video (from main product page)
    useEffect(() => {
        if (!isVisible && !isModalOpen) return;

        const handleBuyNowClick = (e: Event) => {
            // Close video when Buy Now is clicked anywhere on the page
            handleCloseComplete();
        };

        // Listen for clicks on Buy Now button
        const buyNowButtons = document.querySelectorAll('.btn-primary-premium, .add-to-cart-large');
        buyNowButtons.forEach(btn => {
            btn.addEventListener('click', handleBuyNowClick);
        });

        return () => {
            buyNowButtons.forEach(btn => {
                btn.removeEventListener('click', handleBuyNowClick);
            });
        };
    }, [isVisible, isModalOpen, handleCloseComplete]);

    // Auto-play floating video (muted)
    useEffect(() => {
        if (floatingVideoRef.current && isVisible && !isModalOpen) {
            floatingVideoRef.current.muted = true;
            floatingVideoRef.current.play().catch(() => {
                // Autoplay may be blocked by browser, handle silently
            });
        }
    }, [isVisible, isModalOpen]);

    // Auto-play modal video (unmuted with sound)
    useEffect(() => {
        if (modalVideoRef.current && isModalOpen) {
            modalVideoRef.current.muted = false;
            modalVideoRef.current.volume = 0.7; // Set volume to 70%
            modalVideoRef.current.play().catch(() => {
                // Autoplay with sound may be blocked, user can click play
            });
        }
    }, [isModalOpen]);

    // Handle ESC key to close modal
    useEffect(() => {
        if (!isModalOpen) return;

        const handleEscKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleModalClose();
            }
        };

        document.addEventListener('keydown', handleEscKey);
        return () => document.removeEventListener('keydown', handleEscKey);
    }, [isModalOpen]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isModalOpen]);

    if (!isVisible) return null;

    return (
        <>
            {/* Floating Preview Video */}
            <div className="watch-buy-video-container">
                <div className="watch-buy-video-header">
                    <span className="watch-buy-label">Watch & Buy</span>
                    <button 
                        className="watch-buy-close-btn"
                        onClick={handleCloseComplete}
                        aria-label="Close video"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                
                <div 
                    className="watch-buy-video-wrapper"
                    onClick={handleVideoClick}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleVideoClick();
                        }
                    }}
                >
                    <video
                        ref={floatingVideoRef}
                        src={videoUrl}
                        muted
                        loop
                        playsInline
                        className="watch-buy-video"
                        aria-label="Product demonstration video - Click to watch full screen"
                    />
                    <div className="watch-buy-overlay">
                        <i className="fas fa-play"></i>
                        <span className="watch-buy-click-text">Click to Watch</span>
                    </div>
                </div>
            </div>

            {/* Full-Screen Modal Video */}
            {isModalOpen && (
                <div 
                    className="watch-buy-modal-overlay" 
                    onClick={handleModalClose}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Watch & Buy Video"
                >
                    <button 
                        className="watch-buy-modal-close"
                        onClick={handleModalClose}
                        aria-label="Close video"
                    >
                        <i className="fas fa-times"></i>
                    </button>

                    <div 
                        className="watch-buy-modal-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="watch-buy-modal-video-wrapper">
                            <video
                                ref={modalVideoRef}
                                src={videoUrl}
                                controls
                                loop
                                playsInline
                                className="watch-buy-modal-video"
                                aria-label="Product demonstration video"
                            />
                        </div>

                        <div className="watch-buy-modal-actions">
                            <button 
                                className="modal-action-btn primary"
                                onClick={handleAddToCart}
                            >
                                <i className="fas fa-shopping-bag"></i>
                                Add to Cart
                            </button>
                            <button 
                                className="modal-action-btn secondary"
                                onClick={handleMoreInfo}
                            >
                                <i className="fas fa-info-circle"></i>
                                More Info
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};