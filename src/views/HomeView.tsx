import { FC, useRef, RefObject } from 'react';
import { Hero } from '../components/home/Hero';
import { TrustStrip } from '../components/common/TrustStrip';
import { Catalog } from '../components/product/Catalog';
import { VideoTestimonials } from '../components/home/VideoTestimonials';
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
        "@graph": [
            {
                "@type": "WebSite",
                "name": "Wular Sports",
                "url": "https://wularsports.com",
                "description": "Premium handcrafted cricket bats and sports equipment from Kashmir",
                "potentialAction": {
                    "@type": "SearchAction",
                    "target": "https://wularsports.com/collection?q={search_term_string}",
                    "query-input": "required name=search_term_string"
                }
            },
            {
                "@type": "SiteNavigationElement",
                "hasPart": [
                    {
                        "@type": "WebPage",
                        "name": "Hard Tennis Bats",
                        "url": "https://wularsports.com/hard-tennis-bats"
                    },
                    {
                        "@type": "WebPage",
                        "name": "Soft Tennis Bats",
                        "url": "https://wularsports.com/soft-tennis-bats"
                    },
                    {
                        "@type": "WebPage",
                        "name": "Leather Bats",
                        "url": "https://wularsports.com/leather-cricket-bats"
                    },
                    {
                        "@type": "WebPage",
                        "name": "Wular Insights",
                        "url": "https://wularsports.com/blog"
                    }
                ]
            }
        ]
    };

    return (
        <main>
            <SEOHead
                title="Wular Sports — Handcrafted Kashmiri Willow Cricket Bats | Free Delivery India"
                description="Buy premium handcrafted Kashmiri willow cricket bats online. Hard tennis, soft tennis & leather ball bats made in Srinagar, Kashmir. Free delivery across India. Shop now."
                keywords="kashmiri willow cricket bat, hard tennis bat Kashmir, soft tennis bat buy online, leather cricket bat Kashmir, scoop bat, non-scoop bat, buy cricket bat India, Wular Sports"
                ogType="website"
                canonicalUrl="https://wularsports.com"
                structuredData={structuredData}
            />
            <Hero onShopCollectionClick={onShopCollectionClick} />
            <TrustStrip />
            <Catalog ref={catalogRef} onAddToCart={onAddToCart} onImageClick={onImageClick} onWatchVideo={onWatchVideo} />
            <VideoTestimonials />
            <Customization />
            <About />
        </main>
    );
};
