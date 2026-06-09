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

const MAX_MOBILE_WIDTH = 450;

export const VideoModal: FC<VideoModalProps> = ({ testimonials, initialIndex, onClose }) => {
    const router = useRouter();
    const containerRef = useRef<HTMLDivElement>(null);
    const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth <= 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const loopedItems = isMobile ? [testimonials[testimonials.length - 1], ...testimonials, testimonials[0]] : testimonials;
    const [activeIndex, setActiveIndex] = useState(isMobile ? initialIndex + 1 : initialIndex);
    const isInteracting = useRef(false);

    useEffect(() => {
        videoRefs.current = new Array(loopedItems.length).fill(null);
    }, [loopedItems.length]);

    useEffect(() => {
        if (isMobile && containerRef.current) {
            const container = containerRef.current;
            const h = container.clientHeight;
            const targetPos = (initialIndex + 1) * h;
            container.scrollTo({ top: targetPos, behavior: 'auto' });
        }
    }, [initialIndex, isMobile]);

    const handleScroll = useCallback(() => {
        if (!isMobile || !containerRef.current || isInteracting.current) return;

        const c = containerRef.current;
        const h = c.clientHeight;
        if (h <= 0) return;

        const floatIndex = c.scrollTop / h;
        const intIndex = Math.round(floatIndex);

        if (floatIndex <= 0.1) {
            isInteracting.current = true;
            c.scrollTo({ top: testimonials.length * h, behavior: 'auto' });
            setActiveIndex(testimonials.length);
            setTimeout(() => { isInteracting.current = false; }, 80);
        } else if (floatIndex >= (loopedItems.length - 1.1)) {
            isInteracting.current = true;
            c.scrollTo({ top: h, behavior: 'auto' });
            setActiveIndex(1);
            setTimeout(() => { isInteracting.current = false; }, 80);
        } else if (intIndex !== activeIndex) {
            setActiveIndex(intIndex);
        }
    }, [activeIndex, isMobile, testimonials.length, loopedItems.length]);

    useEffect(() => {
        videoRefs.current.forEach((video, idx) => {
            if (video) {
                if (idx === activeIndex) video.play().catch(() => { });
                else { video.pause(); video.currentTime = 0; }
            }
        });
    }, [activeIndex]);

    const handleClose = () => {
        videoRefs.current.forEach(v => v?.pause());
        onClose();
    };

    const togglePlay = (idx: number) => {
        const video = videoRefs.current[idx];
        if (video) video.paused ? video.play() : video.pause();
    };

    const isYouTube = (url: string) => url.includes('youtube.com') || url.includes('youtu.be');

    const extractVideoId = (url: string) => {
        if (!isYouTube(url)) return null;
        if (url.includes('/shorts/')) return url.split('/shorts/')[1].split(/[?#]/)[0];
        const m = url.match(/^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/);
        return (m && m[7].length === 11) ? m[7] : url.split('/').pop()?.split('?')[0] || null;
    };

    const getEmbedUrl = (url: string) => {
        const id = extractVideoId(url);
        if (!id) return url;
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://wularsports.com';
        return `https://www.youtube.com/embed/${id}?mute=1&autoplay=1&loop=1&playlist=${id}&modestbranding=1&rel=0&playsinline=1&enablejsapi=1&origin=${origin}&widgetid=1`;
    };

    const navigateDesktop = (d: 'next' | 'prev') => {
        setActiveIndex(prev => d === 'next'
            ? (prev + 1) % testimonials.length
            : (prev - 1 + testimonials.length) % testimonials.length
        );
    };

    return (
        <div className="video-modal-overlay" onClick={handleClose}>
            <button className="video-modal-close-btn" aria-label="Close" onClick={handleClose}>
                <Icon name="fa-times" />
            </button>

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

            {isMobile ? (
                <div
                    ref={containerRef}
                    onScroll={handleScroll}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        width: '100%',
                        maxWidth: `${MAX_MOBILE_WIDTH}px`,
                        height: '100dvh',
                        overflowY: 'auto',
                        scrollSnapType: 'y mandatory',
                        scrollbarWidth: 'none',
                        background: '#000',
                        overscrollBehavior: 'contain',
                    }}
                >
                    {loopedItems.map((t, idx) => {
                        const product = products.find(p => p.id === t.productId);
                        return (
                            <div
                                key={`${t.id}-${idx}`}
                                style={{
                                    height: '100dvh',
                                    width: '100%',
                                    scrollSnapAlign: 'start',
                                    position: 'relative',
                                    background: '#000',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                {isYouTube(t.url) ? (
                                    <iframe
                                        src={idx === activeIndex ? getEmbedUrl(t.url) : ''}
                                        title={t.name}
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        referrerPolicy="no-referrer-when-downgrade"
                                        allowFullScreen
                                        style={{
                                            position: 'absolute',
                                            inset: 0,
                                            width: '100%',
                                            height: '100%',
                                            border: 'none',
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
                                        style={{
                                            position: 'absolute',
                                            inset: 0,
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            cursor: 'pointer',
                                        }}
                                    />
                                )}

                                {product && (
                                    <div style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        padding: '2.5rem 1rem 1.25rem',
                                        paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))',
                                        background: 'linear-gradient(transparent, rgba(0,0,0,0.8) 60%)',
                                        zIndex: 2,
                                        display: 'flex',
                                        alignItems: 'flex-end',
                                        gap: '0.6rem',
                                    }}>
                                        <img
                                            src={Array.isArray(product.image) ? product.image[0] : product.image}
                                            alt={product.name}
                                            style={{
                                                width: '42px',
                                                height: '42px',
                                                borderRadius: '8px',
                                                objectFit: 'contain',
                                                background: '#111',
                                                flexShrink: 0,
                                            }}
                                        />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                color: 'var(--golden)',
                                                fontSize: '0.85rem',
                                                fontWeight: 700,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                                            }}>
                                                {product.name}
                                            </div>
                                            <div style={{
                                                color: '#fff',
                                                fontSize: '0.9rem',
                                                fontWeight: 600,
                                                textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                                            }}>
                                                ₹{product.price.toLocaleString('en-IN')}
                                            </div>
                                        </div>
                                    <button
                                        className="btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            window.dataLayer.push({
                                                event: 'testimonial_shop_click',
                                                product_id: product.id,
                                                testimonial_name: t.name,
                                            });
                                            handleClose();
                                            router.push(`/product/${product.id}`);
                                        }}
                                        style={{
                                            fontSize: '0.8rem',
                                            padding: '0.5rem 1rem',
                                            flexShrink: 0,
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        Shop Now
                                    </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div
                    className="video-desktop-container-new"
                    ref={containerRef}
                    onClick={(e) => e.stopPropagation()}
                    style={{
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
                        scrollbarWidth: 'none',
                    }}
                >
                    {testimonials.map((t, idx) => {
                        if (idx !== activeIndex) return null;
                        const product = products.find(p => p.id === t.productId);
                        return (
                            <div key={t.id} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{
                                    width: 'max-content',
                                    position: 'relative',
                                    background: '#000',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    borderRadius: '15px',
                                    overflow: 'hidden',
                                }}>
                                    {isYouTube(t.url) ? (
                                        <iframe
                                            src={getEmbedUrl(t.url)}
                                            title={t.name}
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                            referrerPolicy="no-referrer-when-downgrade"
                                            allowFullScreen
                                            style={{ width: 'auto', height: '70vh', aspectRatio: '9/16', maxHeight: '65vh', border: 'none' }}
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
                                            style={{ width: 'auto', height: '70vh', objectFit: 'contain', cursor: 'pointer', maxHeight: '65vh' }}
                                        />
                                    )}
                                </div>

                                <div style={{
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
                                    alignItems: 'center',
                                }}>
                                    <div className="rating" style={{ color: 'var(--golden)', marginBottom: '0.75rem' }}>
                                        {[...Array(t.rating)].map((_, i) => <Icon key={i} name="fa-star" style={{ fontSize: '1.2rem' }} />)}
                                    </div>
                                    <p style={{ fontStyle: 'italic', fontSize: '1.4rem', color: '#fff', marginBottom: '1rem', lineHeight: '1.6', maxWidth: '700px' }}>"{t.comment}"</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                        <h4 style={{ color: 'var(--golden)', fontSize: '1.2rem', margin: 0, letterSpacing: '1px', textTransform: 'uppercase' }}>{t.name}</h4>
                                        {t.isRepeatCustomer && (
                                            <span className="repeat-badge modal-badge" style={{ fontSize: '0.9rem', padding: '0.3rem 0.8rem', background: 'rgba(212, 175, 55, 0.2)', border: '1px solid var(--golden)', borderRadius: '20px', color: 'var(--golden)' }}>
                                                <Icon name="fa-redo-alt" /> Repeat Champion
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ height: '1px', width: '100px', background: 'rgba(212,175,55,0.4)', marginBottom: '1.5rem' }} />

                                    {product && (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem', width: '100%' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', textAlign: 'left' }}>
                                                <img src={Array.isArray(product.image) ? product.image[0] : product.image} alt={product.name} style={{ width: '70px', height: '70px' }} />
                                                <div>
                                                    <h4 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--golden)' }}>{product.name}</h4>
                                                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>₹{product.price.toLocaleString('en-IN')}</span>
                                                </div>
                                            </div>
                                    <button className="btn" onClick={() => {
                                        window.dataLayer.push({
                                            event: 'testimonial_shop_click',
                                            product_id: product.id,
                                            testimonial_name: t.name,
                                        });
                                        handleClose();
                                        router.push(`/product/${product.id}`);
                                    }} style={{ padding: '1rem 2.5rem', fontSize: '1rem', boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)' }}>
                                        Shop This Bat
                                    </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <style>{`
                .video-desktop-container-new::-webkit-scrollbar { display: none; }
                .video-modal-overlay > div:first-of-type::-webkit-scrollbar { display: none; }
            `}</style>
        </div>
    );
};
