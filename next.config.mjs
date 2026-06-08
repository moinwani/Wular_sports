/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    poweredByHeader: false,
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'cdn.jsdelivr.net' },
        ],
    },
    async headers() {
        const csp = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://*.clarity.ms https://apis.google.com https://accounts.google.com https://checkout.razorpay.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://*.googletagmanager.com https://*.google-analytics.com https://connect.facebook.net",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net",
            "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
            "img-src 'self' data: https://cdn.jsdelivr.net https://*.clarity.ms https://i.ytimg.com https://*.google-analytics.com https://*.googletagmanager.com https://www.facebook.com",
            "frame-src 'self' https://www.youtube.com https://api.razorpay.com https://*.googletagmanager.com",
            "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.razorpay.com https://*.clarity.ms https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://script.google.com https://*.google-analytics.com https://*.googletagmanager.com https://www.facebook.com",
            "media-src 'self' https://cdn.jsdelivr.net",
        ].join('; ');

        return [
            {
                source: '/(.*)',
                headers: [
                    { key: 'X-Frame-Options', value: 'DENY' },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
                    { key: 'Content-Security-Policy', value: csp },
                    { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
                ],
            },
        ];
    },
};

export default nextConfig;
