import { FC, useState, memo, useEffect } from 'react';

export interface HeroProps {
    onShopCollectionClick: () => void;
}

const BACKGROUND_IMAGES = [
    'https://cdn.jsdelivr.net/gh/moinwani/Wular_sports@main/assets/images/hero/legacy-edition.png',
    'https://cdn.jsdelivr.net/gh/moinwani/Wular_sports@main/assets/images/hero/hero-1.jpg',
    'https://cdn.jsdelivr.net/gh/moinwani/Wular_sports@main/assets/images/hero/hero-2.jpg'
];

export const Hero: FC<HeroProps> = memo(({ onShopCollectionClick }) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    // Auto-slide effect
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
        }, 5000); // Change slide every 5 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <section className="hero" id="home">
            {/* Front Image Slider */}
            <div className="hero-slider">
                {BACKGROUND_IMAGES.map((image, index) => (
                    <img
                        key={index}
                        src={image}
                        alt={`Hero Slide ${index + 1}`}
                        className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
                    />
                ))}
            </div>

            {/* Hero Content */}
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
