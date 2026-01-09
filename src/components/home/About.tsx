import { memo, useState, useRef, useEffect } from 'react';

export const About = memo(() => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const factoryVideoUrl = "https://res.cloudinary.com/ddahm5ebv/video/upload/v1767934550/Factory_1_qtj64g.mp4";

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

    return (
        <section id="about">
            <div className="container">
                <div className="about-grid">
                    <div className="about-content-text">
                        <h2 className="section-title">About Wular Sports</h2>
                        <p>Wular Sports is committed to crafting high-performance cricket bats for every game – whether you're playing with a leather ball or smashing shots with a tennis ball. Proudly made in Kashmir, our bats are a symbol of quality and power, designed for champions.</p>
                        <div className="location-box">
                            <i className="fas fa-map-marker-alt" aria-hidden="true"></i>
                            <span>Srinagar, Jammu and Kashmir, India</span>
                        </div>
                    </div>
                    <div className="factory-video-teaser" onClick={toggleModal}>
                        <div className="teaser-overlay">
                            <div className="play-btn-circle">
                                <i className="fas fa-play"></i>
                            </div>
                            <span>Take a Factory Tour</span>
                        </div>
                        <video
                            src={factoryVideoUrl}
                            muted
                            loop
                            playsInline
                            autoPlay
                            className="teaser-video"
                        />
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="video-modal-overlay" onClick={toggleModal}>
                    <div className="video-modal-inner" onClick={e => e.stopPropagation()}>
                        <button className="close-video-modal" onClick={toggleModal} aria-label="Close modal">
                            <i className="fas fa-times"></i>
                        </button>
                        <div className="video-modal-player-container">
                            <video
                                ref={videoRef}
                                src={factoryVideoUrl}
                                controls
                                autoPlay
                                className="modal-full-video"
                            />
                        </div>
                        <div className="video-modal-details">
                            <h3>Inside the Wular Sports Factory</h3>
                            <p>Witness the journey from raw willow to a masterpiece. Our craftsmen ensure every bat meets the professional standards required for elite performance.</p>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
});
