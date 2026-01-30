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

    // Default video if product doesn't have one
    const defaultVideoUrl = "https://res.cloudinary.com/ddahm5ebv/video/upload/v1767461480/for_tevxdy.mp4";
    const videoUrl = product.videoUrl || defaultVideoUrl;

    const isYouTube = (url: string) => url.includes('youtube.com') || url.includes('youtu.be');

    const extractVideoId = (url: string) => {
        if (!isYouTube(url)) return null;
        if (url.includes('/shorts/')) {
            return url.split('/shorts/')[1].split(/[?#]/)[0];
        }
        const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[7].length === 11) ? match[7] : (url.split('/').pop()?.split('?')[0] || null);
    };

    const videoId = extractVideoId(videoUrl);

    // Close completely - hide floating video and modal
    const handleCloseComplete = useCallback(() => {
        setIsVisible(false);
        setIsModalOpen(false);
        if (floatingVideoRef.current) {
            floatingVideoRef.current.pause();
        }
        if (onClose) {
            onClose();
        }
    }, [onClose]);

    // Open modal on video click
    const handleVideoClick = () => {
        setIsModalOpen(true);
        if (floatingVideoRef.current) {
            floatingVideoRef.current.pause();
        }
    };

    // Close modal (but keep floating video visible)
    const handleModalClose = () => {
        setIsModalOpen(false);
        if (floatingVideoRef.current) {
            floatingVideoRef.current.play().catch(() => { });
        }
    };

    // Add to Cart handler - closes everything
    const handleAddToCart = useCallback(() => {
        const hasSizes = product.category.some(cat => ['Hard Tennis', 'Soft Tennis', 'Leather Ball'].includes(cat));
        if (hasSizes) {
            const sizeSelector = document.querySelector('.size-selector-premium');
            if (sizeSelector) {
                sizeSelector.scrollIntoView({ behavior: 'smooth', block: 'center' });
                sizeSelector.classList.add('pulse-highlight');
                setTimeout(() => sizeSelector.classList.remove('pulse-highlight'), 2000);
            }
        } else {
            onAddToCart(product, '35 inch');
        }
        handleCloseComplete();
    }, [product, onAddToCart, handleCloseComplete]);

    // More Info handler - closes video and scrolls to tabs
    const handleMoreInfo = useCallback(() => {
        handleCloseComplete();
        setTimeout(() => {
            const tabsContainer = document.querySelector('.product-tabs-container');
            if (tabsContainer) {
                tabsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                const descriptionTab = document.querySelector('.product-tab') as HTMLElement;
                if (descriptionTab && !descriptionTab.classList.contains('active')) {
                    descriptionTab.click();
                }
            }
        }, 300);
    }, [handleCloseComplete]);

    // Listen for Buy Now button clicks to close video
    useEffect(() => {
        if (!isVisible && !isModalOpen) return;
        const handleBuyNowClick = () => handleCloseComplete();
        const buyNowButtons = document.querySelectorAll('.btn-primary-premium, .add-to-cart-large');
        buyNowButtons.forEach(btn => btn.addEventListener('click', handleBuyNowClick));
        return () => {
            buyNowButtons.forEach(btn => btn.removeEventListener('click', handleBuyNowClick));
        };
    }, [isVisible, isModalOpen, handleCloseComplete]);

    // Auto-play floating video (muted)
    useEffect(() => {
        if (floatingVideoRef.current && isVisible && !isModalOpen && !videoId) {
            floatingVideoRef.current.muted = true;
            floatingVideoRef.current.play().catch(() => { });
        }
    }, [isVisible, isModalOpen, videoId]);

    // Handle ESC key to close modal
    useEffect(() => {
        if (!isModalOpen) return;
        const handleEscKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleModalClose();
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
        return () => { document.body.style.overflow = ''; };
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
                    {videoId ? (
                        <div
                            className="watch-buy-youtube-preview"
                            style={{
                                width: '100%',
                                height: '100%',
                                backgroundImage: `url(https://img.youtube.com/vi/${videoId}/hqdefault.jpg)`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                            }}
                        />
                    ) : (
                        <video
                            ref={floatingVideoRef}
                            src={videoUrl}
                            muted
                            loop
                            playsInline
                            className="watch-buy-video"
                            aria-label="Product demonstration video - Click to watch full screen"
                        />
                    )}
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
                        className="watch-buy-modal-content premium-vertical"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="watch-buy-modal-video-wrapper vertical-aspect">
                            {videoId ? (
                                <iframe
                                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0&controls=1`}
                                    title="Watch & Buy Video"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="watch-buy-iframe"
                                ></iframe>
                            ) : (
                                <video
                                    src={videoUrl}
                                    controls
                                    autoPlay
                                    loop
                                    playsInline
                                    className="watch-buy-modal-video"
                                    aria-label="Product demonstration video"
                                />
                            )}
                        </div>

                        <div className="watch-buy-modal-actions vertical-stack">
                            <div className="modal-product-info">
                                <h3>{product.name}</h3>
                                <p>₹{product.price.toLocaleString('en-IN')}</p>
                            </div>
                            <div className="modal-button-group">
                                <button
                                    className="modal-action-btn primary large-gold"
                                    onClick={handleAddToCart}
                                >
                                    <i className="fas fa-shopping-bag"></i>
                                    ADD TO CART
                                </button>
                                <button
                                    className="modal-action-btn secondary link-style"
                                    onClick={handleMoreInfo}
                                >
                                    <i className="fas fa-info-circle"></i>
                                    Product Details
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};