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
        const { products } = await import('./src/data/products');
        const { blogs } = await import('./src/data/blogs');
        const result = [];
        const lastmod = new Date().toISOString();
        for (const p of products) {
            result.push({
                loc: `/product/${p.id}`,
                lastmod,
                changefreq: 'monthly',
                priority: 0.9,
            });
        }
        for (const b of blogs) {
            result.push({
                loc: `/blog/${b.id}`,
                lastmod: new Date(b.date).toISOString(),
                changefreq: 'monthly',
                priority: 0.6,
            });
        }
        return result;
    },
};
