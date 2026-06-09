import { FC, useState } from 'react';
import dynamic from 'next/dynamic';
import { Testimonial } from '../../types';
import { Icon } from '../common/Icon';

const VideoModal = dynamic(() => import('../common/VideoModal').then(m => ({ default: m.VideoModal })));

const testimonials: Testimonial[] = [
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

function getYouTubeId(url: string) {
    if (url.includes('/shorts/')) return url.split('/shorts/')[1].split(/[?#]/)[0];
    return url.split('v=')[1]?.split('&')[0] || url.split('/').pop()?.split('?')[0];
}

function shortQuote(comment: string, max = 55) {
    if (comment.length <= max) return comment;
    const cut = comment.substring(0, max);
    const lastSpace = cut.lastIndexOf(' ');
    return (lastSpace > 30 ? cut.substring(0, lastSpace) : cut) + '…';
}

function playerLabel(t: Testimonial) {
    return t.isRepeatCustomer ? 'Repeat Champion' : 'Verified Customer';
}

export const VideoTestimonials: FC = () => {
    const [isReelOpen, setIsReelOpen] = useState(false);
    const [startIndex, setStartIndex] = useState(0);

    const openReel = (index: number) => {
        window.dataLayer.push({
            event: 'testimonial_opened',
            testimonial_index: index,
            product_id: testimonials[index].productId,
            testimonial_name: testimonials[index].name,
        });
        setStartIndex(index);
        setIsReelOpen(true);
    };

    const featured = testimonials[0];
    const featuredVideoId = getYouTubeId(featured.url);
    const featuredThumb = featuredVideoId
        ? `https://i.ytimg.com/vi/${featuredVideoId}/hqdefault.jpg`
        : '';

    const rest = testimonials.slice(1);

    return (
        <section className="testimonials-section">
            <div className="container">
                <h2 className="testimonials-heading">TRUSTED BY PLAYERS ACROSS INDIA</h2>
                <p className="testimonials-sub">Real players. Real matches. Real feedback.</p>

                {/* FEATURED HERO REVIEW */}
                <div className="featured-hero" onClick={() => openReel(0)}>
                    {featuredThumb ? (
                        <img
                            src={featuredThumb}
                            alt={featured.name}
                            className="featured-hero-thumb"
                            loading="lazy"
                        />
                    ) : (
                        <div className="featured-hero-bg" />
                    )}
                    <div className="featured-hero-gradient" />
                    <div className="featured-hero-play">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                    </div>

                    <div className="featured-hero-content">
                        <p className="featured-hero-quote">{shortQuote(featured.comment, 65)}</p>
                        <div className="featured-hero-player">
                            <span className="featured-hero-name">{featured.name}</span>
                            <span className="featured-hero-label">{playerLabel(featured)}</span>
                        </div>
                        <span className="featured-hero-cta">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M8 5v14l11-7z" /></svg>
                            Watch Story
                        </span>
                    </div>
                </div>

                {/* STORY CARDS STRIP */}
                <div className="stories-strip">
                    {rest.map((t, idx) => {
                        const videoId = getYouTubeId(t.url);
                        const thumb = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '';
                        return (
                            <div
                                key={t.id}
                                className="story-card"
                                onClick={() => openReel(idx + 1)}
                            >
                                <div className="story-thumb-wrap">
                                    {thumb ? (
                                        <img src={thumb} alt={t.name} className="story-thumb" loading="lazy" />
                                    ) : (
                                        <div className="story-thumb-fallback" />
                                    )}
                                    <div className="story-play">
                                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                                    </div>
                                </div>
                                <div className="story-info">
                                    <div className="story-name">{t.name}</div>
                                    <div className="story-label">{playerLabel(t)}</div>
                                    <div className="story-quote">{shortQuote(t.comment, 45)}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {isReelOpen && (
                <VideoModal
                    testimonials={testimonials}
                    initialIndex={startIndex}
                    onClose={() => setIsReelOpen(false)}
                />
            )}
        </section>
    );
};
