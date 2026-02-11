import { FC, memo, useState, useEffect } from 'react';

export interface HeroProps {
    onShopCollectionClick: () => void;
}

const DESKTOP_IMAGE = 'https://cdn.jsdelivr.net/gh/moinwani/Wular_sports@main/assets/images/hero/desktop/hero-1.png';

const MOBILE_IMAGES = [
    'https://cdn.jsdelivr.net/gh/moinwani/Wular_sports@main/assets/images/hero/mobile/hero-1.png',
    'https://cdn.jsdelivr.net/gh/moinwani/Wular_sports@main/assets/images/hero/mobile/hero-2.png',
    'https://cdn.jsdelivr.net/gh/moinwani/Wular_sports@main/assets/images/hero/mobile/hero-3.PNG',
    'https://cdn.jsdelivr.net/gh/moinwani/Wular_sports@main/assets/images/hero/mobile/hero-4.png',
    'https://cdn.jsdelivr.net/gh/moinwani/Wular_sports@main/assets/images/hero/mobile/hero-5.png',
];

export const Hero: FC<HeroProps> = memo(({ onShopCollectionClick }) => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Auto-slide for mobile only
    useEffect(() => {
        if (!isMobile) return;
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % MOBILE_IMAGES.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [isMobile]);

    return (
        <>
            {/* Announcement Bar - Separate from header, homepage only */}
            <div className="announcement-bar">
                <div className="ticker-track">
                    <span>FINEST WILLOW FROM KASHMIR!&nbsp;&nbsp;&nbsp;★&nbsp;&nbsp;&nbsp;</span>
                    <span>FINEST WILLOW FROM KASHMIR!&nbsp;&nbsp;&nbsp;★&nbsp;&nbsp;&nbsp;</span>
                    <span>FINEST WILLOW FROM KASHMIR!&nbsp;&nbsp;&nbsp;★&nbsp;&nbsp;&nbsp;</span>
                    <span>FINEST WILLOW FROM KASHMIR!&nbsp;&nbsp;&nbsp;★&nbsp;&nbsp;&nbsp;</span>
                    <span>FINEST WILLOW FROM KASHMIR!&nbsp;&nbsp;&nbsp;★&nbsp;&nbsp;&nbsp;</span>
                    <span>FINEST WILLOW FROM KASHMIR!&nbsp;&nbsp;&nbsp;★&nbsp;&nbsp;&nbsp;</span>
                    <span>FINEST WILLOW FROM KASHMIR!&nbsp;&nbsp;&nbsp;★&nbsp;&nbsp;&nbsp;</span>
                    <span>FINEST WILLOW FROM KASHMIR!&nbsp;&nbsp;&nbsp;★&nbsp;&nbsp;&nbsp;</span>
                    <span>FINEST WILLOW FROM KASHMIR!&nbsp;&nbsp;&nbsp;★&nbsp;&nbsp;&nbsp;</span>
                    <span>FINEST WILLOW FROM KASHMIR!&nbsp;&nbsp;&nbsp;★&nbsp;&nbsp;&nbsp;</span>
                    <span>FINEST WILLOW FROM KASHMIR!&nbsp;&nbsp;&nbsp;★&nbsp;&nbsp;&nbsp;</span>
                    <span>FINEST WILLOW FROM KASHMIR!&nbsp;&nbsp;&nbsp;★&nbsp;&nbsp;&nbsp;</span>
                </div>
            </div>

            {/* Hero Section */}
            <section className="hero" id="home">
                {isMobile ? (
                    /* Mobile: 4-image slider with crossfade */
                    <div className="hero-slider">
                        {MOBILE_IMAGES.map((src, index) => (
                            <img
                                key={index}
                                src={src}
                                alt={`Hero Slide ${index + 1}`}
                                className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
                            />
                        ))}
                    </div>
                ) : (
                    /* Desktop: Single static image */
                    <img
                        src={DESKTOP_IMAGE}
                        alt="Legacy Edition Hero"
                        className="hero-img"
                    />
                )}

                <div className="hero-content-overlay">
                    <button
                        onClick={onShopCollectionClick}
                        className="btn-transparent"
                    >
                        Shop Collection
                    </button>
                </div>
            </section>
        </>
    );
});
