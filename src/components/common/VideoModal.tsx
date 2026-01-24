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
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    // Track window size for hybrid behavior
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Set up video refs array
    useEffect(() => {
        videoRefs.current = videoRefs.current.slice(0, testimonials.length);
    }, [testimonials.length]);

    // Initial scroll to starting video (Mobile only)
    useEffect(() => {
        if (isMobile && containerRef.current) {
            const items = containerRef.current.querySelectorAll('.reel-item');
            if (items[initialIndex]) {
                items[initialIndex].scrollIntoView({ behavior: 'auto', block: 'center' });
            }
        }
    }, [initialIndex, isMobile]);

    // Handle play/pause logic
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
        if (!isMobile || !containerRef.current) return;

        const container = containerRef.current;
        const scrollPos = container.scrollTop;
        const height = container.clientHeight;
        const index = Math.round(scrollPos / height);

        if (index !== activeIndex && index >= 0 && index < testimonials.length) {
            setActiveIndex(index);
        }
    }, [activeIndex, testimonials.length, isMobile]);

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

    const navigateDesktop = (direction: 'next' | 'prev') => {
        if (direction === 'next') {
            setActiveIndex(prev => (prev + 1) % testimonials.length);
        } else {
            setActiveIndex(prev => (prev - 1 + testimonials.length) % testimonials.length);
        }
    };

    return (
        <div className="video-modal-overlay" onClick={handleClose}>
            <button className="video-modal-close-btn" aria-label="Close" onClick={handleClose}>
                <i className="fas fa-times"></i>
            </button>

            {/* Desktop Navigation Arrows */}
            {!isMobile && (
                <>
                    <button className="reel-nav-btn prev" onClick={(e) => { e.stopPropagation(); navigateDesktop('prev'); }}>
                        <i className="fas fa-chevron-left"></i>
                    </button>
                    <button className="reel-nav-btn next" onClick={(e) => { e.stopPropagation(); navigateDesktop('next'); }}>
                        <i className="fas fa-chevron-right"></i>
                    </button>
                </>
            )}

            <div
                className={isMobile ? "video-reel-container" : "video-desktop-container"}
                ref={containerRef}
                onScroll={handleScroll}
                onClick={(e) => e.stopPropagation()}
                style={isMobile ? {
                    width: '100%',
                    maxWidth: '450px',
                    height: '100dvh', // Use dynamic viewport
                    overflowY: 'auto',
                    scrollSnapType: 'y mandatory',
                    scrollbarWidth: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    background: '#000'
                } : {
                    width: '90%',
                    maxWidth: '1100px',
                    height: 'auto',
                    maxHeight: '85vh',
                    position: 'relative',
                    background: '#000',
                    display: 'flex',
                    borderRadius: '15px',
                    overflow: 'hidden',
                    boxShadow: '0 0 50px rgba(0,0,0,0.8)'
                }}
            >
                {/* Desktop View: Render only active, Mobile View: Render all for scroll */}
                {testimonials.map((t, idx) => {
                    if (!isMobile && idx !== activeIndex) return null;
                    const product = products.find(p => p.id === t.productId);

                    return (
                        <div
                            key={t.id}
                            className="reel-item"
                            style={{
                                flex: isMobile ? '0 0 100%' : '1',
                                height: '100%',
                                width: '100%',
                                position: 'relative',
                                scrollSnapAlign: 'start',
                                display: 'flex',
                                flexDirection: isMobile ? 'column' : 'row',
                                overflow: 'hidden'
                            }}
                        >
                            {/* Video Player */}
                            <div style={{
                                flex: isMobile ? 1 : '0 0 60%',
                                position: 'relative',
                                background: '#000',
                                display: 'flex',
                                alignItems: 'center',
                                borderRight: !isMobile ? '1px solid rgba(255,255,255,0.1)' : 'none'
                            }}>
                                <video
                                    ref={(el) => { videoRefs.current[idx] = el; }}
                                    src={t.url}
                                    preload="metadata"
                                    loop
                                    playsInline
                                    webkit-playsinline="true"
                                    onClick={() => togglePlay(idx)}
                                    className="reel-video"
                                    style={{ width: '100%', height: '100%', objectFit: isMobile ? 'cover' : 'contain', cursor: 'pointer' }}
                                />

                                <div style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    height: '30%',
                                    background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
                                    pointerEvents: 'none'
                                }} />
                            </div>

                            {/* Sidebar / Info (Desktop) or Footer (Mobile) */}
                            <div style={isMobile ? {
                                background: 'rgba(10, 10, 10, 0.95)',
                                padding: '1rem',
                                borderBottomLeftRadius: '10px',
                                borderBottomRightRadius: '10px'
                            } : {
                                flex: '1',
                                background: '#111',
                                padding: '2.5rem',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                textAlign: 'left'
                            }}>
                                {!isMobile && (
                                    <>
                                        <div className="rating" style={{ color: 'var(--golden)', marginBottom: '1rem' }}>
                                            {[...Array(t.rating)].map((_, i) => <i key={i} className="fas fa-star"></i>)}
                                        </div>
                                        <p style={{ fontStyle: 'italic', fontSize: '1.2rem', color: '#ddd', marginBottom: '1.5rem', lineHeight: '1.6' }}>"{t.comment}"</p>
                                        <h4 style={{ color: 'var(--golden)', fontSize: '1.3rem', letterSpacing: '1px' }}>{t.name}</h4>
                                        <div style={{ height: '1px', background: 'rgba(212,175,55,0.2)', margin: '2rem 0' }} />
                                    </>
                                )}

                                {product && (
                                    <div className="modal-product-section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <img
                                                src={Array.isArray(product.image) ? product.image[0] : product.image}
                                                alt={product.name}
                                                className="modal-product-img"
                                                style={{ width: isMobile ? '40px' : '60px', height: isMobile ? '40px' : '60px' }}
                                            />
                                            <div>
                                                <h4 style={{ fontSize: isMobile ? '0.8rem' : '1rem', margin: 0 }}>{product.name}</h4>
                                                <span className="modal-product-price" style={{ fontSize: isMobile ? '0.8rem' : '1.1rem' }}>₹{product.price.toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>
                                        <button
                                            className="btn"
                                            onClick={() => {
                                                handleClose();
                                                navigate(`/product/${product.id}`);
                                            }}
                                            style={isMobile ? { fontSize: '0.75rem', padding: '0.4rem 0.8rem' } : { padding: '0.8rem 1.5rem' }}
                                        >
                                            Shop Now
                                        </button>
                                    </div>
                                )}
                            </div>
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
