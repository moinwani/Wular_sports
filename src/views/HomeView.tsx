import { FC, useRef, RefObject } from 'react';
import { Hero } from '../components/home/Hero';
import { Catalog } from '../components/product/Catalog';
import { Customization } from '../components/checkout/Customization';
import { About } from '../components/home/About';
import { SEOHead } from '../components/common/SEOHead';
import { ProductFull } from '../types';

interface HomeViewProps {
    onShopCollectionClick: () => void;
    onAddToCart: (product: ProductFull, size: string | null) => void;
    onImageClick: (images: string[], startIndex: number) => void;
    onWatchVideo: (url: string, ref: RefObject<HTMLButtonElement>) => void;
}

export const HomeView: FC<HomeViewProps> = ({ onShopCollectionClick, onAddToCart, onImageClick, onWatchVideo }) => {
    const catalogRef = useRef<HTMLElement>(null);

    const structuredData = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "Wular Sports",
        "url": "https://wularsports.com",
        "description": "Premium handcrafted cricket bats and sports equipment from Kashmir",
        "potentialAction": {
            "@type": "SearchAction",
            "target": "https://wularsports.com/collection?q={search_term_string}",
            "query-input": "required name=search_term_string"
        }
    };

    return (
        <main>
            <SEOHead
                title="Wular Sports - Premium Handcrafted Cricket Bats | Kashmir Willow & English Willow"
                description="Discover premium handcrafted cricket bats from Wular Sports. Expert craftsmanship from Kashmir. Hard tennis, soft tennis, and leather ball bats. Free shipping across India."
                keywords="cricket bats, Kashmir willow bats, English willow bats, handcrafted cricket bats, premium cricket equipment, hard tennis bats, soft tennis bats, leather ball bats, Wular Sports"
                ogType="website"
                canonicalUrl="https://wularsports.com"
                structuredData={structuredData}
            />
            <Hero onShopCollectionClick={onShopCollectionClick} />
            <Catalog ref={catalogRef} onAddToCart={onAddToCart} onImageClick={onImageClick} onWatchVideo={onWatchVideo} />
            <Customization />
            <About />
        </main>
    );
};
