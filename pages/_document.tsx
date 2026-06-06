import { Html, Head, Main, NextScript } from 'next/document';

const OG_IMAGE = 'https://cdn.jsdelivr.net/gh/moinwani/Wular_sports@main/assets/images/brand/og-image.jpg';

const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Wular Sports",
    "url": "https://wularsports.com/",
    "logo": "https://cdn.jsdelivr.net/gh/moinwani/Wular_sports@main/assets/images/brand/logo.png",
    "contactPoint": { "@type": "ContactPoint", "telephone": "+91-9320622451", "contactType": "customer service", "availableLanguage": ["English", "Hindi", "Urdu"] },
    "sameAs": ["https://www.instagram.com/wular.sports", "https://youtube.com/@wularsports"]
};

const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Wular Sports",
    "url": "https://wularsports.com/",
    "logo": "https://cdn.jsdelivr.net/gh/moinwani/Wular_sports@main/assets/images/brand/logo.png",
    "image": OG_IMAGE,
    "description": "Premium handcrafted Kashmiri willow cricket bats — hard tennis, soft tennis, and leather ball bats. Proudly made in Srinagar, Kashmir.",
    "telephone": "+91-9320622451",
    "email": "wularsports@gmail.com",
    "address": { "@type": "PostalAddress", "addressLocality": "Srinagar", "addressRegion": "Jammu and Kashmir", "addressCountry": "IN" },
    "geo": { "@type": "GeoCoordinates", "latitude": "34.0837", "longitude": "74.7973" },
    "priceRange": "₹₹",
    "currenciesAccepted": "INR",
    "paymentAccepted": "Cash, UPI, Bank Transfer",
    "areaServed": "India",
    "sameAs": ["https://www.instagram.com/wular.sports", "https://youtube.com/@wularsports"]
};

const navigationSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": [
        { "@type": "SiteNavigationElement", "position": 1, "name": "Hard Tennis Bats", "url": "https://wularsports.com/hard-tennis-bats" },
        { "@type": "SiteNavigationElement", "position": 2, "name": "Soft Tennis Bats", "url": "https://wularsports.com/soft-tennis-bats" },
        { "@type": "SiteNavigationElement", "position": 3, "name": "Leather Cricket Bats", "url": "https://wularsports.com/leather-cricket-bats" }
    ]
};

export default function Document() {
    return (
        <Html lang="en">
            <Head>
                <meta charSet="UTF-8" />
                <link rel="icon" href="https://cdn.jsdelivr.net/gh/moinwani/Wular_sports@main/assets/images/brand/site-icon.png" type="image/png" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link rel="preconnect" href="https://cdn.jsdelivr.net" />
                <link rel="preconnect" href="https://cdnjs.cloudflare.com" />
                <link
                    rel="preload"
                    as="style"
                    href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700&family=Oswald:wght@400;500;700&display=swap"
                    crossOrigin="anonymous"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700&family=Oswald:wght@400;500;700&display=swap"
                    rel="stylesheet"
                    media="print"
                />
                <noscript>
                    <link
                        href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700&family=Oswald:wght@400;500;700&display=swap"
                        rel="stylesheet"
                    />
                </noscript>
                <script dangerouslySetInnerHTML={{ __html: `document.querySelector('link[media="print"]').media='all'` }} />
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" integrity="sha512-SnH5WK+bZxgPHs44uWIX+LLJAJ9/2PkPKZ5QiAj6Ta86w+fsb2TkcmfRyVX3pBnMFcV7oQPJkl9QevSCWr3W6A==" crossOrigin="anonymous" referrerPolicy="no-referrer" />
                <script src="https://accounts.google.com/gsi/client" async defer></script>
                {/* Microsoft Clarity */}
                <script dangerouslySetInnerHTML={{ __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","tn1mu1gwo1");` }} />
                {/* Global JSON-LD schemas */}
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }} />
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(navigationSchema) }} />
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}
