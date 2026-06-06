import { memo, useState, useEffect } from 'react';
import { Icon } from '../common/Icon';

export const About = memo(() => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const factoryVideoUrl = "https://youtube.com/shorts/IZ9Vv-cAVGY?feature=share";

    const toggleModal = () => {
        setIsModalOpen(!isModalOpen);
    };

    useEffect(() => {
        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isModalOpen]);

    const getYouTubeId = (url: string) => {
        if (url.includes('/shorts/')) {
            return url.split('/shorts/')[1].split(/[?#]/)[0];
        }
        const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[7].length === 11) ? match[7] : (url.split('/').pop()?.split('?')[0] || null);
    };

    const videoId = getYouTubeId(factoryVideoUrl);

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
                    <div className="factory-video-teaser" onClick={toggleModal}>
                        <div className="teaser-overlay">
                            <div className="play-btn-circle">
                                <Icon name="fa-play" />
                            </div>
                            <span>Take a Factory Tour</span>
                        </div>
                        {videoId ? (
                            <div
                                className="teaser-thumbnail"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    backgroundImage: `url(https://img.youtube.com/vi/${videoId}/maxresdefault.jpg), url(https://img.youtube.com/vi/${videoId}/hqdefault.jpg)`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center'
                                }}
                            />
                        ) : (
                            <video
                                src={factoryVideoUrl}
                                muted
                                loop
                                playsInline
                                autoPlay
                                className="teaser-video"
                            />
                        )}
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
                                ></iframe>
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
