import { FC, useState } from 'react';
import { VideoModal } from '../common/VideoModal';

const testimonials = [
    {
        id: 1,
        url: 'https://res.cloudinary.com/ddahm5ebv/video/upload/v1768968198/IMG_8104_qcdcfi.mp4',
        name: 'Arjun P.',
        comment: 'The balance and ping of Wular bats are exceptional. Truly handcrafted for champions.',
        rating: 5
    },
    {
        id: 2,
        url: 'https://res.cloudinary.com/ddahm5ebv/video/upload/v1768968188/IMG_8110_kuipvj.mp4',
        name: 'Zaid K.',
        comment: 'Fast shipping and even better quality. Kashmiri willow at its finest!',
        rating: 5
    },
    {
        id: 3,
        url: 'https://res.cloudinary.com/ddahm5ebv/video/upload/v1768968188/IMG_7408_rrroyv.mp4',
        name: 'Rahul M.',
        comment: 'Wular Sports never disappoints. The customization options are a game changer.',
        rating: 5
    }
];

export const VideoTestimonials: FC = () => {
    const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

    return (
        <section className="video-testimonials">
            <div className="container">
                <h2 className="section-title">Champion Reviews</h2>
                <p className="section-subtitle">Real feedback from real players across the country</p>

                <div className="testimonials-grid">
                    {testimonials.map((t) => (
                        <div
                            key={t.id}
                            className="testimonial-card"
                            onClick={() => setSelectedVideo(t.url)}
                        >
                            <div className="video-container">
                                <video
                                    src={t.url}
                                    controls={false}
                                    muted
                                    playsInline
                                    autoPlay
                                    loop
                                    className="testimonial-video"
                                />
                                <div className="play-overlay">
                                    <i className="fas fa-play"></i>
                                </div>
                            </div>
                            <div className="testimonial-info">
                                <div className="rating">
                                    {[...Array(t.rating)].map((_, i) => (
                                        <i key={i} className="fas fa-star"></i>
                                    ))}
                                </div>
                                <p className="comment">"{t.comment}"</p>
                                <h4 className="customer-name">{t.name}</h4>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <VideoModal
                videoUrl={selectedVideo}
                onClose={() => setSelectedVideo(null)}
            />
        </section>
    );
};
