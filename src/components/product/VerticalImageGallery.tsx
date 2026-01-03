import { FC, useState } from 'react';

export interface VerticalImageGalleryProps {
    images: string[];
    altText: string;
    onImageClick: (index: number) => void;
}

export const VerticalImageGallery: FC<VerticalImageGalleryProps> = ({ images, altText, onImageClick }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    return (
        <div className="vertical-image-gallery">
            <div className="vertical-gallery-scroll-container">
                {images.map((src, index) => (
                    <div 
                        key={`${src}-${index}`} 
                        className={`vertical-gallery-image-item ${selectedIndex === index ? 'selected' : ''}`}
                        onClick={() => {
                            setSelectedIndex(index);
                            onImageClick(index);
                        }}
                    >
                        <img 
                            src={src} 
                            alt={`${altText} - View ${index + 1}`} 
                            className="vertical-gallery-image"
                            loading="lazy"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

