/** @type {import('next-sitemap').IConfig} */
module.exports = {
    siteUrl: 'https://wularsports.com',
    generateRobotsTxt: true,
    generateIndexSitemap: false,
    changefreq: 'weekly',
    priority: 0.7,
    exclude: ['/admin', '/checkout', '/order-success', '/404'],
    robotsTxtOptions: {
        policies: [
            { userAgent: '*', allow: '/' },
            { userAgent: '*', disallow: ['/admin', '/api'] },
        ],
        additionalSitemaps: [],
    },
    transform: async (config, path) => {
        const priorityMap = {
            '/': 1.0,
            '/hard-tennis-bats': 0.8,
            '/soft-tennis-bats': 0.8,
            '/leather-cricket-bats': 0.8,
            '/collection': 0.7,
            '/blog': 0.7,
            '/about': 0.5,
            '/privacy-policy': 0.3,
            '/return-policy': 0.3,
            '/terms-conditions': 0.3,
        };
        const lastmod = new Date().toISOString();
        if (path.startsWith('/product/') || path.startsWith('/blog/')) {
            return null;
        }
        return {
            loc: path,
            lastmod,
            changefreq: priorityMap[path] ? 'monthly' : 'weekly',
            priority: priorityMap[path] || 0.7,
        };
    },
    additionalPaths: async () => {
        const result = [];
        const lastmod = new Date().toISOString();
        for (const id of [
            'legacy-edition-2.0',
            'legacy-edition',
            'bahubali-edition',
            'ak-47-honeycomb',
            'standard-leather-bat',
        ]) {
            result.push({
                loc: `/product/${id}`,
                lastmod,
                changefreq: 'monthly',
                priority: 0.9,
            });
        }
        const blogDates = {
            'kashmiri-willow-cricket-bat-buying-guide-2025': '2026-01-30',
            'choosing-the-right-bat-weight': '2026-01-05',
            'the-singapore-cane-handle-advantage': '2025-12-28',
            'breaking-the-willow-myth': '2025-12-20',
            'cricket-bat-maintenance-care-guide': '2026-01-07',
            'from-tennis-to-leather-transition-guide': '2026-01-22',
            'mastering-hard-tennis-cricket-gear': '2026-01-24',
            'the-artisan-edge-handcrafted-vs-machine-made': '2026-01-23',
            'best-kashmiri-willow-cricket-bat-under-3000': '2026-04-21',
            'scoop-vs-non-scoop-cricket-bat-guide': '2026-04-21',
            'buy-kashmiri-willow-cricket-bat-online-india': '2026-04-21',
        };
        for (const [id, date] of Object.entries(blogDates)) {
            result.push({
                loc: `/blog/${id}`,
                lastmod: new Date(date).toISOString(),
                changefreq: 'monthly',
                priority: 0.6,
            });
        }
        return result;
    },
};
