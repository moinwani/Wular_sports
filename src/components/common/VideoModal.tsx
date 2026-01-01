import { FC, useRef } from 'react';

export interface VideoModalProps {
    videoUrl: string | null;
    onClose: () => void;
}

export const VideoModal: FC<VideoModalProps> = ({ videoUrl, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    const handleClose = () => {
        if (videoRef.current) {
            videoRef.current.pause();
        }
        onClose();
    };

    if (!videoUrl) return null;

    return (
        <div className="video-modal-overlay" onClick={handleClose}>
            <button className="video-modal-close-btn" aria-label="Close video player" onClick={handleClose}>
                <i className="fas fa-times"></i>
            </button>
            <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
                <video ref={videoRef} src={videoUrl} controls preload="metadata" className="video-modal-player"></video>
            </div>
        </div>
    );
};
