import { blogForPage } from './blogServer';
import { livePosts } from './blog';
import type { Guide } from './seoContent';

/**
 * Blog posts to link from a category page as "Buying guides" (newest first).
 * Server-side only — used in getStaticProps. Links from category pages to the
 * guides, and from the guides back to the bats, help both rank.
 */
export async function guidesFor(pattern: RegExp, max = 4): Promise<Guide[]> {
    const { posts } = await blogForPage();
    return livePosts(posts)
        .filter(p => pattern.test(p.title))
        .slice(0, max)
        .map(p => ({ id: p.id, title: p.title }));
}
