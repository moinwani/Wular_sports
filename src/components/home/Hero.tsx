import { FC, memo, useState, useEffect } from 'react';
import Image from 'next/image';
import { getFolderFiles, getCDNUrl } from '../../services/githubService';

export interface HeroProps {
    onShopCollectionClick: () => void;
}

export const Hero: FC<HeroProps> = memo(({ onShopCollectionClick }) => {
    const [isMobile, setIsMobile] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [mobileImages, setMobileImages] = useState<string[]>([]);
    const [desktopImage, setDesktopImage] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    // Initial Desktop Fallback (for speed)
    const fallbackDesktop = 'https://cdn.jsdelivr.net/gh/moinwani/Wular_sports@main/assets/images/hero/desktop/hero-1.png';

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize(); // set correct value immediately on mount
        window.addEventListener('resize', handleResize);

        // Fetch Dynamic Hero Images
        async function loadHeroAssets() {
            try {
                // Fetch Mobile Slider Images
                const mobileFiles = await getFolderFiles('assets/images/hero/mobile');
                const mImages = mobileFiles
                    .filter(f => /\.(png|jpe?g|webp|PNG|JPG)$/.test(f.name))
                    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
                    .map(f => getCDNUrl(f.path, f.sha));

                if (mImages.length > 0) setMobileImages(mImages);

                // Fetch Desktop Image (takes the first image found in desktop folder)
                const desktopFiles = await getFolderFiles('assets/images/hero/desktop');
                const dImage = desktopFiles.find(f => /\.(png|jpe?g|webp|PNG|JPG)$/.test(f.name));
                if (dImage) {
                    setDesktopImage(getCDNUrl(dImage.path, dImage.sha));
                } else {
                    setDesktopImage(fallbackDesktop);
                }
            } catch {
                setDesktopImage(fallbackDesktop);
            } finally {
                setIsLoading(false);
            }
        }

        loadHeroAssets();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Auto-slide for mobile only
    useEffect(() => {
        if (!isMobile || mobileImages.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % mobileImages.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [isMobile, mobileImages.length]);

    if (isLoading && !desktopImage && mobileImages.length === 0) {
        return <div className="hero-loading" style={{ height: '60vh', background: '#0a0a0a' }} />;
    }

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
                {isMobile ? (
                    /* Mobile: Dynamic slider with crossfade */
                    <div className="hero-slider">
                        {mobileImages.length > 0 ? (
                            mobileImages.map((src, index) => (
                                <div key={src} className={`hero-slide ${index === currentSlide ? 'active' : ''}`} style={{ position: 'relative' }}>
                                    <Image
                                        src={src}
                                        alt={`Handcrafted Kashmiri Willow Cricket Bat — Wular Sports Slide ${index + 1}`}
                                        fill
                                        style={{ objectFit: 'cover' }}
                                        sizes="100vw"
                                        quality={90}
                                        priority={index === currentSlide}
                                    />
                                </div>
                            ))
                        ) : (
                            <div className="hero-placeholder" />
                        )}
                    </div>
                ) : (
                    /* Desktop: Dynamic image with cache busting */
                    <div className="hero-img" style={{ position: 'relative', width: '100%', height: '100%' }}>
                        <Image
                            src={desktopImage || fallbackDesktop}
                            alt="Handcrafted Kashmiri Willow Cricket Bats — Wular Sports Legacy Edition"
                            fill
                            style={{ objectFit: 'cover' }}
                            sizes="100vw"
                            quality={90}
                            priority
                        />
                    </div>
                )}

                <div className="hero-content-overlay">
                    <h1 className="hero-heading">Match-Ready Kashmiri Willow Bats — Handcrafted in Srinagar</h1>
                    <p className="hero-tagline">Free Delivery Across India | Fully Knocked &amp; Oiled | Ready to Play Out of the Box</p>

                    <div className="hero-social-proof" style={{
                        display: 'flex', justifyContent: 'center', gap: '2rem',
                        marginTop: '1.5rem', marginBottom: '1.5rem',
                        flexWrap: 'wrap',
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
                            <span style={{ color: 'var(--golden)', fontSize: '1.1rem' }}>★★★★★</span>
                            <span style={{ color: '#ccc', fontSize: '0.8rem' }}>from 8 Verified Reviews</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
                            <span style={{ color: 'var(--golden)', fontWeight: 'bold', fontSize: '1rem' }}>Kashmir</span>
                            <span style={{ color: '#ccc', fontSize: '0.8rem' }}>Handcrafted in Srinagar</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
                            <span style={{ color: 'var(--golden)', fontSize: '1.1rem' }}>🚚</span>
                            <span style={{ color: '#ccc', fontSize: '0.8rem' }}>Free Delivery Across India</span>
                        </div>
                    </div>

                    <button onClick={onShopCollectionClick} className="btn-hero-cta">
                        Shop Collection
                    </button>
                </div>
            </section>
        </>
    );
});
