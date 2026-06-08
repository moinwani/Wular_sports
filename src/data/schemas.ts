const OG_IMAGE = 'https://cdn.jsdelivr.net/gh/moinwani/Wular_sports@main/assets/images/brand/og-image.jpg';

export const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Wular Sports",
    "url": "https://wularsports.com/",
    "logo": "https://cdn.jsdelivr.net/gh/moinwani/Wular_sports@main/assets/images/brand/logo.png",
    "contactPoint": { "@type": "ContactPoint", "telephone": "+91-9320622451", "contactType": "customer service", "availableLanguage": ["English", "Hindi", "Urdu"] },
    "sameAs": ["https://www.instagram.com/wular.sports", "https://youtube.com/@wularsports"],
};

export const localBusinessSchema = {
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
    "sameAs": ["https://www.instagram.com/wular.sports", "https://youtube.com/@wularsports"],
};

export const navigationSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": [
        { "@type": "SiteNavigationElement", "position": 1, "name": "Hard Tennis Bats", "url": "https://wularsports.com/hard-tennis-bats" },
        { "@type": "SiteNavigationElement", "position": 2, "name": "Soft Tennis Bats", "url": "https://wularsports.com/soft-tennis-bats" },
        { "@type": "SiteNavigationElement", "position": 3, "name": "Leather Cricket Bats", "url": "https://wularsports.com/leather-cricket-bats" },
    ],
};
