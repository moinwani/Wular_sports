/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    poweredByHeader: false,
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'cdn.jsdelivr.net' },
            // Product photos uploaded from the admin panel
            { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
            // YouTube thumbnails on the reviews strip — resized, WebP, cached a month (YouTube's own cache is 2h)
            { protocol: 'https', hostname: 'i.ytimg.com', pathname: '/vi/**' },
        ],
        formats: ['image/webp', 'image/avif'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
        // Photo links carry a fingerprint (?v=…) or are unique uploads, so a
        // resized photo can be kept for a month instead of being redone every minute
        minimumCacheTTL: 2678400,
    },
    async headers() {
        const csp = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://*.clarity.ms https://apis.google.com https://accounts.google.com https://checkout.razorpay.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://*.googletagmanager.com https://*.google-analytics.com https://connect.facebook.net",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net",
            "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
            "img-src 'self' data: blob: https://cdn.jsdelivr.net https://*.public.blob.vercel-storage.com https://*.clarity.ms https://i.ytimg.com https://*.google-analytics.com https://*.googletagmanager.com https://www.facebook.com",
            "frame-src 'self' https://www.youtube.com https://api.razorpay.com https://*.googletagmanager.com",
            "connect-src 'self' https://api.github.com https://*.firebaseio.com https://*.googleapis.com https://api.razorpay.com https://*.clarity.ms https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://script.google.com https://*.google-analytics.com https://*.googletagmanager.com https://www.facebook.com",
            "media-src 'self' https://cdn.jsdelivr.net",
        ].join('; ');

        return [
            {
                // Font files never change under the same name
                source: '/fonts/:file*',
                headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
            },
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
