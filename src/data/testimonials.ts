import type { Testimonial } from '../types';

/**
 * Customer video reviews (YouTube Shorts). Shown on the homepage reel and on
 * each bat's own page — the star ratings Google reads for a bat are worked out
 * from the reviews shown on that bat's page (Google only allows ratings that
 * the page itself shows).
 */
export const TESTIMONIALS: Testimonial[] = [
    {
        id: 1,
        url: 'https://www.youtube.com/shorts/rOqK2kZQzTI',
        name: 'Arjun P.',
        comment: 'Super fast 4-day delivery (expected 8 days)! The balance and ping with the 130-140g heavy tennis ball are absolutely incredible.',
        rating: 5,
        productId: 'legacy-edition',
        isRepeatCustomer: true,
    },
    {
        id: 2,
        url: 'https://www.youtube.com/shorts/APmTiKN8dG8',
        name: 'Prashant M.',
        comment: 'Absolutely love the bat! Exactly what was shown online was delivered. Kashmiri willow at its finest!',
        rating: 5,
        productId: 'legacy-edition-2.0',
    },
    {
        id: 3,
        url: 'https://www.youtube.com/shorts/rf8CkJKKfsg',
        name: 'Omkar P.',
        comment: 'Absolutely love the wood quality and the perfect shape and balance of the bat. It even has a beautiful curve! Everything shown was provided, including the bat cover and extra grip.',
        rating: 5,
        productId: 'legacy-edition',
    },
    {
        id: 4,
        url: 'https://www.youtube.com/shorts/GABV4WB2NBU',
        name: 'Shalinder',
        comment: "As a professional tournament player, I've used bats from many companies, but the quality of this Legacy Edition is unmatched. The shape, balance, and ping are exceptional. It's tournament-ready and I love playing with it!",
        rating: 5,
        productId: 'legacy-edition',
    },
    {
        id: 5,
        url: 'https://www.youtube.com/shorts/dJ3IaZCmPJQ',
        name: 'Karthik R.',
        comment: 'Excellent customer service and top-notch quality bats.',
        rating: 5,
        productId: 'legacy-edition',
    },
    {
        id: 6,
        url: 'https://www.youtube.com/shorts/Xo_ncNgEgjc',
        name: 'Shadh Hussain',
        comment: "Absolutely incredible wood quality. I didn't expect this much excellence—this truly feels like A+ grade Kashmiri willow. Everything from the grain to the finish is top-notch.",
        rating: 5,
        productId: 'legacy-edition',
    },
    {
        id: 7,
        url: 'https://www.youtube.com/shorts/tUGmUsV5azM',
        name: 'Romman',
        comment: 'The Bahubali Edition is a beast! The power in this bat is incredible, yet the balance makes it feel so light in the hands. Truly a game-changer for heavy tennis ball cricket.',
        rating: 5,
        productId: 'bahubali-edition',
    },
    {
        id: 8,
        url: 'https://youtube.com/shorts/51_M34PKL_I',
        name: 'Arjun P.',
        comment: 'Repeat customer! This time I got the AK-47 Edition (Honeycomb Scoop). The lightweight design and precision engineering make it a beast on the field.',
        rating: 5,
        productId: 'ak-47-honeycomb',
        isRepeatCustomer: true,
    },
];

/** YouTube video id from a Shorts / watch / youtu.be link */
export function getYouTubeId(url: string) {
    if (url.includes('/shorts/')) return url.split('/shorts/')[1].split(/[?#]/)[0];
    return url.split('v=')[1]?.split('&')[0] || url.split('/').pop()?.split('?')[0];
}

/** Reviews of one bat, and their average (null when it has none) */
export function testimonialsFor(productId: string): { reviews: Testimonial[]; rating: { ratingValue: string; reviewCount: number } | null } {
    const reviews = TESTIMONIALS.filter(t => t.productId === productId);
    if (!reviews.length) return { reviews, rating: null };
    const avg = reviews.reduce((sum, t) => sum + t.rating, 0) / reviews.length;
    return { reviews, rating: { ratingValue: avg.toFixed(1), reviewCount: reviews.length } };
}
