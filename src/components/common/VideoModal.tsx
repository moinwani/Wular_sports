import { FC, useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { products } from '../../data/products';

interface Testimonial {
    id: number;
    url: string;
    name: string;
    comment: string;
    rating: number;
    productId: string;
}

export interface VideoModalProps {
    testimonials: Testimonial[];
    initialIndex: number;
    onClose: () => void;
}

export const VideoModal: FC<VideoModalProps> = ({ testimonials, initialIndex, onClose }) => {
    const navigate = useNavigate();
    const containerRef = useRef<HTMLDivElement>(null);
    const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
    const [activeIndex, setActiveIndex] = useState(initialIndex);

    // Set up video refs array
    useEffect(() => {
        videoRefs.current = videoRefs.current.slice(0, testimonials.length);
    }, [testimonials.length]);

    // Initial scroll to starting video
    useEffect(() => {
        if (containerRef.current) {
            const items = containerRef.current.querySelectorAll('.reel-item');
            if (items[initialIndex]) {
                items[initialIndex].scrollIntoView({ behavior: 'auto', block: 'center' });
            }
        }
    }, [initialIndex]);

    // Handle play/pause logic based on visible index
    useEffect(() => {
        videoRefs.current.forEach((video, idx) => {
            if (video) {
                if (idx === activeIndex) {
                    video.play().catch(e => console.log('Auto-play blocked:', e));
                } else {
                    video.pause();
                    video.currentTime = 0;
                }
            }
        });
    }, [activeIndex]);

    const handleScroll = useCallback(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const scrollPos = container.scrollTop;
        const height = container.clientHeight;
        const index = Math.round(scrollPos / height);

        if (index !== activeIndex && index >= 0 && index < testimonials.length) {
            setActiveIndex(index);
        }
    }, [activeIndex, testimonials.length]);

    const handleClose = () => {
        videoRefs.current.forEach(v => v?.pause());
        onClose();
    };

    const togglePlay = (idx: number) => {
        const video = videoRefs.current[idx];
        if (video) {
            if (video.paused) video.play();
            else video.pause();
        }
    };

    return (
        <div className="video-modal-overlay" onClick={handleClose}>
            <button className="video-modal-close-btn" aria-label="Close reels" onClick={handleClose}>
                <i className="fas fa-times"></i>
            </button>

            <div
                className="video-reel-container"
                ref={containerRef}
                onScroll={handleScroll}
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '100%',
                    maxWidth: '450px',
                    height: '100%',
                    maxHeight: '100vh',
                    overflowY: 'auto',
                    scrollSnapType: 'y mandatory',
                    scrollbarWidth: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    background: '#000'
                }}
            >
                {testimonials.map((t, idx) => {
                    const product = products.find(p => p.id === t.productId);

                    return (
                        <div
                            key={t.id}
                            className="reel-item"
                            style={{
                                flex: '0 0 100%',
                                height: '100%',
                                width: '100%',
                                position: 'relative',
                                scrollSnapAlign: 'start',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden'
                            }}
                        >
                            {/* Video Player */}
                            <div style={{ flex: 1, position: 'relative', background: '#000', display: 'flex', alignItems: 'center' }}>
                                <video
                                    ref={el => videoRefs.current[idx] = el}
                                    src={t.url}
                                    preload="metadata"
                                    loop
                                    playsInline
                                    webkit-playsinline="true"
                                    onClick={() => togglePlay(idx)}
                                    className="reel-video"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                                />

                                {/* Overlay Gradient for visibility */}
                                <div style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    height: '40%',
                                    background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                                    pointerEvents: 'none'
                                }} />

                                {/* Reel Instructions (Subtle) */}
                                {idx === 0 && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '20px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        color: '#fff',
                                        fontSize: '0.8rem',
                                        opacity: 0.6,
                                        pointerEvents: 'none',
                                        animation: 'bounce 2s infinite'
                                    }}>
                                        <i className="fas fa-chevron-up"></i> Swipe up for more
                                    </div>
                                )}
                            </div>

                            {/* Product Info Bar */}
                            {product && (
                                <div className="modal-product-footer" style={{ borderTop: 'none', borderRadius: 0, background: 'rgba(10, 10, 10, 0.95)' }}>
                                    <div className="modal-product-info">
                                        <img
                                            src={Array.isArray(product.image) ? product.image[0] : product.image}
                                            alt={product.name}
                                            className="modal-product-img"
                                        />
                                        <div className="modal-product-details">
                                            <h4 style={{ fontSize: '0.85rem' }}>{product.name}</h4>
                                            <span className="modal-product-price">₹{product.price.toLocaleString('en-IN')}</span>
                                        </div>
                                    </div>
                                    <button
                                        className="btn"
                                        onClick={() => {
                                            handleClose();
                                            navigate(`/product/${product.id}`);
                                        }}
                                        style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                                    >
                                        Shop Now
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <style>{`
                .video-reel-container::-webkit-scrollbar { display: none; }
                @keyframes bounce {
                    0%, 20%, 50%, 80%, 100% {transform: translateX(-50%) translateY(0);}
                    40% {transform: translateX(-50%) translateY(-10px);}
                    60% {transform: translateX(-50%) translateY(-5px);}
                }
            `}</style>
        </div>
    );
};
