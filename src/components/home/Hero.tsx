import { FC, memo, useState, useEffect } from 'react';
import { getImageProps } from 'next/image';
import { assetFiles, getCDNUrl } from '../../services/githubService';

export interface HeroProps {
    onShopCollectionClick: () => void;
}

/*
 * Hero photos come from the repo folders assets/images/hero/mobile (the phone
 * slider, in name order) and assets/images/hero/desktop (first photo). The
 * list is fixed when the site is built, so the first photo is in the page from
 * the very first moment — no waiting for JavaScript or GitHub — and the phone
 * downloads only the photo for its screen size.
 */
const IMAGE = /\.(png|jpe?g|webp)$/i;
const MOBILE_SLIDES = assetFiles('assets/images/hero/mobile').filter(f => IMAGE.test(f.name)).map(f => getCDNUrl(f.path));
const DESKTOP_IMAGE = getCDNUrl(assetFiles('assets/images/hero/desktop').find(f => IMAGE.test(f.name))?.path || 'assets/images/hero/desktop/hero-1.png');
const ALT = 'Handcrafted Kashmiri Willow Cricket Bats — Wular Sports';

const optimised = (src: string) => getImageProps({ src, alt: '', fill: true, sizes: '100vw', quality: 75 }).props;

export const Hero: FC<HeroProps> = memo(({ onShopCollectionClick }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [showMoreSlides, setShowMoreSlides] = useState(false);

    // Phone slider: the other photos start downloading only after the page has
    // finished loading, so they never slow down the first one.
    useEffect(() => {
        if (MOBILE_SLIDES.length <= 1 || !window.matchMedia('(max-width: 767px)').matches) return;
        let timer: ReturnType<typeof setTimeout> | undefined;
        let interval: ReturnType<typeof setInterval> | undefined;
        const begin = () => {
            timer = setTimeout(() => {
                setShowMoreSlides(true);
                interval = setInterval(() => setCurrentSlide(prev => (prev + 1) % MOBILE_SLIDES.length), 5000);
            }, 1500);
        };
        if (document.readyState === 'complete') begin();
        else window.addEventListener('load', begin, { once: true });
        return () => {
            window.removeEventListener('load', begin);
            clearTimeout(timer);
            clearInterval(interval);
        };
    }, []);

    const first = optimised(MOBILE_SLIDES[0] || DESKTOP_IMAGE);
    const desktop = optimised(DESKTOP_IMAGE);

    return (
        <>
            {/* Announcement Bar - Separate from header, homepage only */}
            <div className="announcement-bar">
                <div className="ticker-track">
                    {Array.from({ length: 12 }, (_, i) => (
                        <span key={i}>Free Delivery Across India ★ Fully Knocked &amp; Oiled ★ Premium Accessories Included&nbsp;&nbsp;&nbsp;★&nbsp;&nbsp;&nbsp;</span>
                    ))}
                </div>
            </div>

            {/* Hero Section */}
            <section className="hero" id="home">
                <div className="hero-slider">
                    <div className={`hero-slide ${currentSlide === 0 ? 'active' : ''}`}>
                        <picture>
                            <source media="(min-width: 768px)" srcSet={desktop.srcSet} sizes="100vw" />
                            <img
                                src={first.src}
                                srcSet={first.srcSet}
                                sizes="100vw"
                                alt={ALT}
                                className="hero-photo"
                                fetchPriority="high"
                                decoding="async"
                            />
                        </picture>
                    </div>
                    {showMoreSlides && MOBILE_SLIDES.slice(1).map((src, i) => {
                        const photo = optimised(src);
                        return (
                            <div key={src} className={`hero-slide hero-slide--extra ${currentSlide === i + 1 ? 'active' : ''}`}>
                                <img
                                    src={photo.src}
                                    srcSet={photo.srcSet}
                                    sizes="100vw"
                                    alt={`${ALT} — photo ${i + 2}`}
                                    className="hero-photo"
                                    loading="lazy"
                                    decoding="async"
                                />
                            </div>
                        );
                    })}
                </div>

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
