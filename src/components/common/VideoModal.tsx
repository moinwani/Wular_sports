import { FC, useRef, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { products } from '../../data/products';
import { Testimonial } from '../../types';
import { Icon } from './Icon';

export interface VideoModalProps {
    testimonials: Testimonial[];
    initialIndex: number;
    onClose: () => void;
}

export const VideoModal: FC<VideoModalProps> = ({ testimonials, initialIndex, onClose }) => {
    const router = useRouter();
    const containerRef = useRef<HTMLDivElement>(null);
    const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
    const [isMobile, setIsMobile] = useState(false);

    // Looping state (Mobile only)
    const loopedItems = isMobile ? [testimonials[testimonials.length - 1], ...testimonials, testimonials[0]] : testimonials;
    const [activeIndex, setActiveIndex] = useState(isMobile ? initialIndex + 1 : initialIndex);
    const isInteracting = useRef(false); // To prevent logic collisions during reset

    // Track window size
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Set up video refs array size
    useEffect(() => {
        videoRefs.current = new Array(loopedItems.length).fill(null);
    }, [loopedItems.length]);

    // Initial positioning (Instant - fixes back-scroll)
    useEffect(() => {
        if (isMobile && containerRef.current) {
            const container = containerRef.current;
            const targetPos = (initialIndex + 1) * container.clientHeight;
            container.scrollTo({ top: targetPos, behavior: 'auto' });
        }
    }, [initialIndex, isMobile]);

    // Looping Reset Logic (Mobile only)
    const handleScroll = useCallback(() => {
        if (!isMobile || !containerRef.current || isInteracting.current) return;

        const container = containerRef.current;
        const scrollPos = container.scrollTop;
        const h = container.clientHeight;
        const floatIndex = scrollPos / h;
        const intIndex = Math.round(floatIndex);

        // SILENT RESET boundary checks
        if (floatIndex <= 0.1) {
            // Reached start clone -> jump to real end
            isInteracting.current = true;
            container.scrollTo({ top: testimonials.length * h, behavior: 'auto' });
            setActiveIndex(testimonials.length);
            setTimeout(() => { isInteracting.current = false; }, 50);
        } else if (floatIndex >= (loopedItems.length - 1.1)) {
            // Reached end clone -> jump to real start
            isInteracting.current = true;
            container.scrollTo({ top: h, behavior: 'auto' });
            setActiveIndex(1);
            setTimeout(() => { isInteracting.current = false; }, 50);
        } else {
            if (intIndex !== activeIndex) {
                setActiveIndex(intIndex);
            }
        }
    }, [activeIndex, isMobile, testimonials.length, loopedItems.length]);

    // Handle Play/Pause
    useEffect(() => {
        videoRefs.current.forEach((video, idx) => {
            if (video) {
                if (idx === activeIndex) {
                    video.play().catch(() => { });
                } else {
                    video.pause();
                    video.currentTime = 0;
                }
            }
        });
    }, [activeIndex]);

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

    const isYouTube = (url: string) => url.includes('youtube.com') || url.includes('youtu.be');

    const extractVideoId = (url: string) => {
        if (!isYouTube(url)) return null;

        // Handle shorts format specifically
        if (url.includes('/shorts/')) {
            return url.split('/shorts/')[1].split(/[?#]/)[0];
        }

        // Handle standard watch?v= and youtu.be/ ID extraction
        const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
        const match = url.match(regExp);
        if (match && match[7].length === 11) {
            return match[7];
        }

        // Fallback
        return url.split('/').pop()?.split('?')[0] || null;
    };

    const getEmbedUrl = (url: string) => {
        const videoId = extractVideoId(url);
        if (!videoId) return url;
        return `https://www.youtube.com/embed/${videoId}?mute=1&autoplay=1&loop=1&playlist=${videoId}&modestbranding=1&rel=0&playsinline=1&enablejsapi=1&origin=${window.location.origin}&widgetid=1`;
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
                <Icon name="fa-times" />
            </button>

            {/* Desktop Navigation Arrows */}
            {!isMobile && (
                <>
                    <button className="reel-nav-btn prev" onClick={(e) => { e.stopPropagation(); navigateDesktop('prev'); }}>
                        <Icon name="fa-chevron-left" />
                    </button>
                    <button className="reel-nav-btn next" onClick={(e) => { e.stopPropagation(); navigateDesktop('next'); }}>
                        <Icon name="fa-chevron-right" />
                    </button>
                </>
            )}

            <div
                className={isMobile ? "video-reel-container" : "video-desktop-container-new"}
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
                    width: '95%',
                    maxWidth: '1200px',
                    height: 'auto',
                    maxHeight: '90vh',
                    position: 'relative',
                    background: 'transparent',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    overflowY: 'auto',
                    scrollbarWidth: 'none'
                }}
            >
                {/* Desktop View: Render only active, Mobile View: Render all for scroll */}
                {loopedItems.map((t, idx) => {
                    // Desktop Optimization: Only render active item
                    if (!isMobile && idx !== activeIndex) return null;
                    const product = products.find(p => p.id === t.productId);

                    return (
                        <div
                            key={`${t.id}-${idx}`}
                            className="reel-item"
                            style={{
                                flex: isMobile ? '0 0 100%' : 'none',
                                height: isMobile ? '100%' : 'auto',
                                width: isMobile ? '100%' : 'auto',
                                position: 'relative',
                                scrollSnapAlign: 'start',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center'
                            }}
                        >
                            {/* Video Player Section */}
                            <div style={{
                                width: isMobile ? '100%' : 'max-content',
                                flex: isMobile ? 1 : 'none',
                                position: 'relative',
                                background: '#000',
                                display: 'flex',
                                justifyContent: 'center',
                                borderRadius: !isMobile ? '15px' : '0',
                                overflow: 'hidden'
                            }}>
                                {isYouTube(t.url) ? (
                                    <iframe
                                        src={idx === activeIndex ? getEmbedUrl(t.url) : ''}
                                        title={t.name}
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        referrerPolicy="no-referrer-when-downgrade"
                                        allowFullScreen
                                        style={{
                                            width: isMobile ? '100%' : 'auto',
                                            height: isMobile ? '100%' : '70vh',
                                            aspectRatio: '9/16',
                                            maxHeight: isMobile ? 'none' : '65vh',
                                            border: 'none'
                                        }}
                                    />
                                ) : (
                                    <video
                                        ref={(el) => { videoRefs.current[idx] = el; }}
                                        src={t.url}
                                        preload="metadata"
                                        autoPlay
                                        loop
                                        playsInline
                                        webkit-playsinline="true"
                                        onClick={() => togglePlay(idx)}
                                        className="reel-video"
                                        style={{
                                            width: isMobile ? '100%' : 'auto',
                                            height: isMobile ? '100%' : '70vh',
                                            objectFit: isMobile ? 'cover' : 'contain',
                                            cursor: 'pointer',
                                            maxHeight: isMobile ? 'none' : '65vh'
                                        }}
                                    />
                                )}

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

                            {/* Info Section (Below Video for Desktop, Bottom Bar for Mobile) */}
                            <div style={isMobile ? {
                                background: 'rgba(10, 10, 10, 0.95)',
                                padding: '1rem',
                                width: '100%'
                            } : {
                                width: '100%',
                                maxWidth: '800px',
                                background: '#111',
                                padding: '2rem 3rem',
                                marginTop: '1.5rem',
                                borderRadius: '15px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                textAlign: 'center',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center'
                            }}>
                                {!isMobile && (
                                    <>
                                        <div className="rating" style={{ color: 'var(--golden)', marginBottom: '0.75rem' }}>
                                            {[...Array(t.rating)].map((_, i) => <Icon key={i} name="fa-star" style={{ fontSize: '1.2rem' }} />)}
                                        </div>
                                        <p style={{ fontStyle: 'italic', fontSize: '1.4rem', color: '#fff', marginBottom: '1rem', lineHeight: '1.6', maxWidth: '700px' }}>"{t.comment}"</p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                            <h4 style={{ color: 'var(--golden)', fontSize: '1.2rem', margin: 0, letterSpacing: '1px', textTransform: 'uppercase' }}>{t.name}</h4>
                                            {t.isRepeatCustomer && (
                                                <span className="repeat-badge modal-badge" style={{
                                                    fontSize: '0.9rem',
                                                    padding: '0.3rem 0.8rem',
                                                    background: 'rgba(212, 175, 55, 0.2)',
                                                    border: '1px solid var(--golden)',
                                                    borderRadius: '20px',
                                                    color: 'var(--golden)'
                                                }}>
                                                    <Icon name="fa-redo-alt" /> Repeat Champion
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ height: '1px', width: '100px', background: 'rgba(212,175,55,0.4)', marginBottom: '1.5rem' }} />
                                    </>
                                )}

                                {product && (
                                    <div className="modal-product-section" style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: '2rem',
                                        width: '100%'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', textAlign: 'left' }}>
                                            <img
                                                src={Array.isArray(product.image) ? product.image[0] : product.image}
                                                alt={product.name}
                                                className="modal-product-img"
                                                style={{ width: isMobile ? '45px' : '70px', height: isMobile ? '45px' : '70px' }}
                                            />
                                            <div>
                                                <h4 style={{ fontSize: isMobile ? '0.85rem' : '1.1rem', margin: 0, color: 'var(--golden)' }}>{product.name}</h4>
                                                <span className="modal-product-price" style={{ fontSize: isMobile ? '0.85rem' : '1.2rem', fontWeight: 'bold' }}>₹{product.price.toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>
                                        <button
                                            className="btn"
                                            onClick={() => {
                                                handleClose();
                                                router.push(`/product/${product.id}`);
                                            }}
                                            style={isMobile ? {
                                                fontSize: '0.8rem',
                                                padding: '0.5rem 1rem'
                                            } : {
                                                padding: '1rem 2.5rem',
                                                fontSize: '1rem',
                                                boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)'
                                            }}
                                        >
                                            {isMobile ? "Shop Now" : "Shop This Bat"}
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
                .video-desktop-container-new::-webkit-scrollbar { display: none; }
            `}</style>
        </div>
    );
};
