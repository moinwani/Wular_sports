import React, { FC, useState, memo } from 'react';

export interface HeroProps {
    onShopCollectionClick: () => void;
}

export const Hero: FC<HeroProps> = memo(({ onShopCollectionClick }) => {
    const [isAnimating, setIsAnimating] = useState(false);

    const handleTitleClick = () => {
        if (isAnimating) return; // Prevent re-triggering while animating
        setIsAnimating(true);
        setTimeout(() => {
            setIsAnimating(false);
        }, 1500); // Match animation duration in CSS
    };

    return (
        <section className="hero" id="home">
            <div className="container">
                <h1
                    className={`hero-title ${isAnimating ? 'is-animating' : ''}`}
                    onClick={handleTitleClick}
                >
                    Unleash Your Power
                </h1>
                <p className="hero-subtitle">Crafted for Champions. Built for Victory.</p>
                <div className="hero-cta-box">
                    <p>We support Cash on Delivery. Only ₹300 advance booking required!</p>
                    <button onClick={onShopCollectionClick} className="btn">Shop Collection</button>
                </div>
            </div>
        </section>
    );
});
