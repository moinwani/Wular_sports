import Head from 'next/head';
import { FC } from 'react';

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
    title = 'Wular Sports — Handcrafted Kashmiri Willow Cricket Bats',
    description = 'Buy premium handcrafted Kashmiri willow cricket bats online. Hard tennis, soft tennis & leather ball bats made in Srinagar, Kashmir. Free delivery across India.',
    keywords = 'kashmiri willow cricket bat, hard tennis bat Kashmir, soft tennis bat buy online, leather cricket bat Kashmir, scoop bat, Wular Sports',
    ogImage = 'https://cdn.jsdelivr.net/gh/moinwani/Wular_sports@main/assets/images/brand/og-image.jpg',
    ogType = 'website',
    canonicalUrl,
    structuredData,
}) => (
    <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords} />
        <meta name="author" content="Wular Sports" />
        <meta name="robots" content="index, follow" />

        <meta property="og:type" content={ogType} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:site_name" content="Wular Sports" />
        {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />

        {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

        {structuredData && (
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />
        )}
    </Head>
);
