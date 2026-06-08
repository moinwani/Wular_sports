import { memo, useState, useEffect } from 'react';
import { Icon } from '../common/Icon';

const factoryVideoUrl = "https://youtube.com/shorts/IZ9Vv-cAVGY?feature=share";

function getYouTubeId(url: string) {
    if (url.includes('/shorts/')) return url.split('/shorts/')[1].split(/[?#]/)[0];
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : (url.split('/').pop()?.split('?')[0] || null);
}

const videoId = getYouTubeId(factoryVideoUrl);

export const About = memo(() => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const toggleModal = () => setIsModalOpen(!isModalOpen);

    useEffect(() => {
        document.body.style.overflow = isModalOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isModalOpen]);

    return (
        <section id="about">
            <div className="container">
                <div className="about-grid">
                    <div className="about-content-text">
                        <h2 className="section-title">About Wular Sports</h2>
                        <p>Wular Sports is committed to crafting high-performance cricket bats for every game – whether you're playing with a leather ball or smashing shots with a tennis ball. Proudly made in Kashmir, our bats are a symbol of quality and power, designed for champions.</p>
                        <div className="location-box">
                            <Icon name="fa-map-marker-alt" aria-hidden="true" />
                            <span>Srinagar, Jammu and Kashmir, India</span>
                        </div>
                    </div>

                    <div className="factory-tour-card" onClick={toggleModal}>
                        {videoId ? (
                            <img
                                src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
                                alt="Factory tour preview"
                                className="factory-tour-thumb"
                                loading="lazy"
                            />
                        ) : (
                            <div className="factory-tour-bg" />
                        )}
                        <div className="factory-tour-gradient" />
                        <div className="factory-tour-content">
                            <span className="factory-tour-kicker">CRAFTED IN KASHMIR</span>
                            <p className="factory-tour-desc">Take a behind-the-scenes look at how every Wular Sports bat is made.</p>
                            <span className="factory-tour-cta">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M8 5v14l11-7z" /></svg>
                                Watch Factory Tour
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="video-modal-overlay" onClick={toggleModal}>
                    <div className="video-modal-inner factory-tour-modal" onClick={e => e.stopPropagation()}>
                        <button className="close-video-modal" onClick={toggleModal} aria-label="Close modal">
                            <Icon name="fa-times" />
                        </button>
                        <div className="video-modal-player-container">
                            {videoId ? (
                                <iframe
                                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0`}
                                    title="Factory Tour Video"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="modal-full-video"
                                    style={{ border: 'none' }}
                                />
                            ) : (
                                <video
                                    src={factoryVideoUrl}
                                    controls
                                    autoPlay
                                    className="modal-full-video"
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
});
