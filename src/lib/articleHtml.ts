import sanitizeHtml from 'sanitize-html';

/**
 * Server-side cleaning for blog article HTML (used when a post is saved and
 * when a post page is built). Keeps what articles use — headings, lists,
 * tables with simple inline styles, links, images, the site's CTA classes —
 * and drops scripts, event handlers and anything else unsafe.
 *
 * Pure JavaScript (no browser emulation), so it runs on Vercel's servers.
 */

const SIZE = /^[\d.]+(px|em|rem|%)?(\s+[\d.]+(px|em|rem|%)?){0,3}$/;
const BORDER = /^[\w\s.#(),%-]+$/;
const COLOR = /^[\w\s.#(),%-]+$/;

export const cleanArticleHtml = (html: string): string =>
    sanitizeHtml(String(html || ''), {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'figure', 'figcaption']),
        allowedAttributes: {
            a: ['href', 'target', 'rel', 'title'],
            img: ['src', 'alt', 'loading', 'width', 'height', 'title'],
            td: ['colspan', 'rowspan'],
            th: ['colspan', 'rowspan', 'scope'],
            '*': ['class', 'style', 'id'],
        },
        allowedStyles: {
            '*': {
                padding: [SIZE],
                margin: [SIZE],
                width: [SIZE],
                'text-align': [/^(left|right|center|justify)$/],
                border: [BORDER],
                'border-collapse': [/^(collapse|separate)$/],
                background: [COLOR],
                'background-color': [COLOR],
                color: [COLOR],
                'font-weight': [/^(normal|bold|[1-9]00)$/],
            },
        },
        allowedSchemes: ['http', 'https', 'mailto', 'tel'],
        allowedSchemesByTag: { img: ['https', 'http'] },
        allowProtocolRelative: false,
        transformTags: {
            // A link that opens a new tab gets rel="noopener" so that page can't control ours
            a: (tagName, attribs) => ({
                tagName,
                attribs: attribs.target === '_blank' ? { ...attribs, rel: 'noopener noreferrer' } : attribs,
            }),
        },
    });
