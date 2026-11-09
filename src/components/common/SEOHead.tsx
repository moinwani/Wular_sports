import Head from 'next/head';
import { FC } from 'react';
import { absoluteUrl } from '../../lib/blog';

/** JSON-LD inside <script>: escape "<" so text like "</script>" in a product
 *  description or post can never end the script tag early */
const jsonLd = (data: object) => JSON.stringify(data).replace(/</g, '\\u003c');

interface SEOHeadProps {
    title?: string;
    description?: string;
    keywords?: string;
    ogImage?: string;
    ogType?: 'website' | 'product' | 'article';
    canonicalUrl?: string;
    structuredData?: object;
    robots?: string;
    /** Article dates/section for blog posts (Open Graph article tags) */
    article?: { publishedTime?: string; modifiedTime?: string; section?: string; author?: string };
}

export const SEOHead: FC<SEOHeadProps> = ({
    title = 'Wular Sports — Handcrafted Kashmiri Willow Cricket Bats',
    description = 'Buy premium handcrafted Kashmiri willow cricket bats online. Hard tennis, soft tennis & leather ball bats made in Srinagar, Kashmir. Free delivery across India.',
    keywords = 'kashmiri willow cricket bat, hard tennis bat Kashmir, soft tennis bat buy online, leather cricket bat Kashmir, scoop bat, Wular Sports',
    ogImage = 'https://cdn.jsdelivr.net/gh/moinwani/Wular_sports@main/assets/images/brand/og-image.jpg',
    ogType = 'website',
    canonicalUrl,
    structuredData,
    robots = 'index, follow',
    article,
}) => {
    // Share previews (WhatsApp, Facebook, X) need a full https:// address —
    // photos uploaded from the admin panel are stored as /api/photo/… paths
    const image = absoluteUrl(ogImage);
    return (
    <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords} />
        <meta name="author" content="Wular Sports" />
        <meta name="robots" content={robots} />

        <meta property="og:type" content={ogType} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={image} />
        <meta property="og:site_name" content="Wular Sports" />
        <meta property="og:locale" content="en_IN" />
        {article?.publishedTime && <meta property="article:published_time" content={article.publishedTime} />}
        {article?.modifiedTime && <meta property="article:modified_time" content={article.modifiedTime} />}
        {article?.section && <meta property="article:section" content={article.section} />}
        {article?.author && <meta property="article:author" content={article.author} />}
        {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={image} />

        {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

        {structuredData && (
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }}
            />
        )}
    </Head>
    );
};
