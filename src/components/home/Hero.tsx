import { FC, useState, memo, useEffect } from 'react';

export interface HeroProps {
    onShopCollectionClick: () => void;
}

const BACKGROUND_IMAGES = [
    'https://res.cloudinary.com/ddahm5ebv/image/upload/v1767247423/6246894018251918552_c5k6qi.jpg',
    'https://res.cloudinary.com/ddahm5ebv/image/upload/v1767247422/6246894018251918553_s6dj7r.jpg'
];

export const Hero: FC<HeroProps> = memo(({ onShopCollectionClick }) => {
    const [isAnimating, setIsAnimating] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);

    // Auto-slide effect
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
        }, 5000); // Change slide every 5 seconds

        return () => clearInterval(interval);
    }, []);

    const handleTitleClick = () => {
        if (isAnimating) return;
        setIsAnimating(true);
        setTimeout(() => {
            setIsAnimating(false);
        }, 1500);
    };

    return (
        <section className="hero" id="home">
            {/* Background Slider */}
            <div className="hero-background-slider">
                {BACKGROUND_IMAGES.map((image, index) => (
                    <div
                        key={index}
                        className={`hero-background-slide ${index === currentSlide ? 'active' : ''}`}
                        style={{ backgroundImage: `url(${image})` }}
                    />
                ))}
            </div>

            {/* Hero Content */}
            <div className="container hero-content-wrapper">
                <h1
                    className={`hero-title ${isAnimating ? 'is-animating' : ''}`}
                    onClick={handleTitleClick}
                >
                    Unleash Your Power
                </h1>
                <p className="hero-subtitle">Crafted for Champions. Built for Victory.</p>
                <button onClick={onShopCollectionClick} className="btn">Shop Collection</button>
            </div>
        </section>
    );
});
