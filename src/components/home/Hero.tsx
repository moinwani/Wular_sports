import { FC, memo, useState, useEffect } from 'react';

export interface HeroProps {
    onShopCollectionClick: () => void;
}

const DESKTOP_IMAGE = 'https://cdn.jsdelivr.net/gh/moinwani/Wular_sports@main/assets/images/hero/hero-desktop.jpg';
const MOBILE_IMAGE = 'https://cdn.jsdelivr.net/gh/moinwani/Wular_sports@main/assets/images/hero/legacy-edition.png';

export const Hero: FC<HeroProps> = memo(({ onShopCollectionClick }) => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <section className="hero" id="home">
            {/* Front Image - Single Slide */}
            <div className="hero-single-image">
                <img
                    src={isMobile ? MOBILE_IMAGE : DESKTOP_IMAGE}
                    alt="Legacy Edition Hero"
                    className="hero-img"
                />
            </div>

            {/* Hero Content - Positioned at bottom center for desktop */}
            <div className="hero-content-overlay">
                <button
                    onClick={onShopCollectionClick}
                    className="btn-transparent"
                >
                    Shop Collection
                </button>
            </div>
        </section>
    );
});
