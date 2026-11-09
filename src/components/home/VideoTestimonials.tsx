import { FC, useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Testimonial } from '../../types';
import { TESTIMONIALS, getYouTubeId } from '../../data/testimonials';
import { Icon } from '../common/Icon';

const VideoModal = dynamic(() => import('../common/VideoModal').then(m => ({ default: m.VideoModal })));

const testimonials = TESTIMONIALS;


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
                        <Image
                            src={featuredThumb}
                            alt={featured.name}
                            className="featured-hero-thumb"
                            fill
                            sizes="(max-width: 768px) 100vw, 800px"
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
                        <div className="featured-hero-actions" style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                            <span className="featured-hero-cta">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M8 5v14l11-7z" /></svg>
                                Watch Story
                            </span>
                            <Link href={`/product/${featured.productId}`} className="featured-hero-cta" onClick={(e) => e.stopPropagation()} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Icon name="fa-shopping-bag" style={{ fontSize: '0.75rem' }} />
                                Shop This Bat
                            </Link>
                        </div>
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
                                        <Image src={thumb} alt={t.name} className="story-thumb" fill sizes="(max-width: 768px) 140px, 200px" />
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
                                    <Link
                                        href={`/product/${t.productId}`}
                                        className="story-buy-btn"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        Buy This Bat →
                                    </Link>
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
