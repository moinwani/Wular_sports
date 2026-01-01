import { FC, useEffect } from 'react';

interface SEOHeadProps {
    title?: string;
    description?: string;
    keywords?: string;
    ogImage?: string;
    ogType?: 'website' | 'product' | 'article';
    canonicalUrl?: string;
    structuredData?: object;
}

export const SEOHead: FC<SEOHeadProps> = ({
    title = 'Wular Sports - Premium Handcrafted Cricket Bats & Sports Equipment',
    description = 'Discover premium handcrafted cricket bats and sports equipment from Wular Sports. Each piece is meticulously crafted by skilled artisans in Kashmir for champions who demand excellence.',
    keywords = 'cricket bats, handcrafted cricket bats, Kashmir willow bats, English willow bats, premium cricket equipment, sports equipment, Wular Sports',
    ogImage = 'https://res.cloudinary.com/ddahm5ebv/image/upload/v1752150442/photo_6305588890991445271_m_tme4bb.jpg',
    ogType = 'website',
    canonicalUrl,
    structuredData
}) => {
    useEffect(() => {
        // Update title
        document.title = title;

        // Update or create meta tags
        const updateMetaTag = (name: string, content: string, isProperty = false) => {
            const attribute = isProperty ? 'property' : 'name';
            let element = document.querySelector(`meta[${attribute}="${name}"]`);

            if (!element) {
                element = document.createElement('meta');
                element.setAttribute(attribute, name);
                document.head.appendChild(element);
            }

            element.setAttribute('content', content);
        };

        // Standard meta tags
        updateMetaTag('description', description);
        updateMetaTag('keywords', keywords);
        updateMetaTag('author', 'Wular Sports');
        updateMetaTag('robots', 'index, follow');

        // Open Graph tags
        updateMetaTag('og:title', title, true);
        updateMetaTag('og:description', description, true);
        updateMetaTag('og:image', ogImage, true);
        updateMetaTag('og:type', ogType, true);
        updateMetaTag('og:site_name', 'Wular Sports', true);

        if (canonicalUrl) {
            updateMetaTag('og:url', canonicalUrl, true);
        }

        // Twitter Card tags
        updateMetaTag('twitter:card', 'summary_large_image');
        updateMetaTag('twitter:title', title);
        updateMetaTag('twitter:description', description);
        updateMetaTag('twitter:image', ogImage);

        // Canonical URL
        if (canonicalUrl) {
            let linkElement = document.querySelector('link[rel="canonical"]');
            if (!linkElement) {
                linkElement = document.createElement('link');
                linkElement.setAttribute('rel', 'canonical');
                document.head.appendChild(linkElement);
            }
            linkElement.setAttribute('href', canonicalUrl);
        }

        // Structured Data (JSON-LD)
        if (structuredData) {
            let scriptElement = document.querySelector('script[type="application/ld+json"]');
            if (!scriptElement) {
                scriptElement = document.createElement('script');
                scriptElement.setAttribute('type', 'application/ld+json');
                document.head.appendChild(scriptElement);
            }
            scriptElement.textContent = JSON.stringify(structuredData);
        }
    }, [title, description, keywords, ogImage, ogType, canonicalUrl, structuredData]);

    return null;
};
