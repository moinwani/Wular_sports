import { FC } from 'react';

interface VideoPreviewProps {
    label?: string;
    compact?: boolean;
    className?: string;
}

export const VideoPreview: FC<VideoPreviewProps> = ({ label, compact = false, className = '' }) => {
    return (
        <div className={`video-preview-card ${compact ? 'video-preview-compact' : ''} ${className}`}>
            <div className="video-preview-bg">
                <div className="video-preview-grain"></div>
                <div className="video-preview-watermark">WULAR</div>
            </div>
            <div className="video-preview-overlay">
                <div className="video-preview-play-btn">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                </div>
                {label && <span className="video-preview-label">{label}</span>}
            </div>
        </div>
    );
};
