const AI_CRAWLERS = [
    'GPTBot', 'OAI-SearchBot', 'ChatGPT-User',           // OpenAI / ChatGPT
    'ClaudeBot', 'Claude-SearchBot', 'Claude-User',      // Anthropic / Claude
    'PerplexityBot', 'Perplexity-User',                  // Perplexity
    'Google-Extended',                                   // Gemini
    'Applebot-Extended', 'Amazonbot', 'DuckAssistBot', 'meta-externalagent', 'CCBot',
];

/** @type {import('next-sitemap').IConfig} */
module.exports = {
    siteUrl: 'https://wularsports.com',
    generateRobotsTxt: true,
    generateIndexSitemap: false,
    changefreq: 'weekly',
    priority: 0.7,
    // Products, new categories and blog posts are listed live in /server-sitemap.xml
    exclude: ['/admin', '/checkout', '/order-success', '/review', '/404', '/server-sitemap.xml', '/llms.txt', '/feeds/*', '/category/*'],
    robotsTxtOptions: {
        policies: [
            // /api/photo/ serves product photos, which Google Images and link previews need
            { userAgent: '*', allow: ['/', '/api/photo/'], disallow: ['/admin', '/api'] },
            // AI assistants and their search crawlers are welcome: we want ChatGPT, Claude,
            // Perplexity, Gemini and Copilot to read the shop and recommend it
            ...AI_CRAWLERS.map(userAgent => ({ userAgent, allow: ['/', '/api/photo/'], disallow: ['/admin', '/api'] })),
        ],
        additionalSitemaps: ['https://wularsports.com/server-sitemap.xml'],
    },
    transform: async (config, path) => {
        const priorityMap = {
            '/': 1.0,
            '/tennis-cricket-bats': 0.9,
            '/hard-tennis-bats': 0.8,
            '/soft-tennis-bats': 0.8,
            '/leather-cricket-bats': 0.8,
            '/collection': 0.7,
            '/blog': 0.7,
            '/comparison': 0.8,
            '/about': 0.5,
            '/privacy-policy': 0.3,
            '/return-policy': 0.3,
            '/terms-conditions': 0.3,
        };
        const lastmod = new Date().toISOString();
        if (path.startsWith('/product/') || path.startsWith('/blog/') || path.startsWith('/category/')) {
            return null;
        }
        return {
            loc: path,
            lastmod,
            changefreq: priorityMap[path] ? 'monthly' : 'weekly',
            priority: priorityMap[path] || 0.7,
        };
    },
};
