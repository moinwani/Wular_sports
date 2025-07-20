
import React, { useState, FC, useRef, useMemo, ChangeEvent, FormEvent, ReactNode, memo, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

const WHATSAPP_NUMBER = '919320622451';
const INSTAGRAM_LINK = "https://www.instagram.com/wular.sports?igsh=MXV5MjNyZGplYXh6aQ%3D%3D&utm_source=qr";
const YOUTUBE_LINK = "https://youtube.com/@wularsports?si=56ACjfcWinQRjcVg";
const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
    "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
    "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
    "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
    "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands",
    "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi",
    "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

// --- Interfaces & Types ---
type View = 'home' | 'collection' | 'privacy' | 'return' | 'terms';
type PaymentMethod = 'full' | 'partial';

interface ProductFull {
    id: string;
    name: string;
    category: ('Hard Tennis' | 'Soft Tennis' | 'Leather Ball')[];
    description: string;
    image: string | string[];
    price: number;
    originalPrice: number;
    specs: string[];
    reviewLink?: string;
    videoUrl?: string;
}

interface CartItem extends ProductFull {
    quantity: number;
    size?: string;
}

interface CustomerDetails {
    fullName: string;
    email: string;
    phone: string;
    pinCode: string;
    city: string;
    state: string;
    address: string;
    landmark: string;
}

// --- Prop Types ---
interface LightboxProps {
    gallery: {
        images: string[];
        startIndex: number;
    } | null;
    onClose: () => void;
}

interface VideoModalProps {
    videoUrl: string | null;
    onClose: () => void;
}

interface ImageGalleryProps {
    images: string[];
    altText: string;
    onImageClick: (index: number) => void;
}

interface HeaderProps {
    onCartClick: () => void;
    cartItemCount: number;
    onNavigate: (view: View) => void;
}

interface HeroProps {
    onShopCollectionClick: () => void;
}

interface ProductCardProps {
    product: ProductFull;
    onAddToCart: (product: ProductFull, size: string | null) => void;
    onImageClick: (images: string[], startIndex: number) => void;
    onWatchVideo: (url: string, ref: React.RefObject<HTMLButtonElement>) => void;
}

interface CatalogProps {
    onAddToCart: (product: ProductFull, size: string | null) => void;
    onImageClick: (images: string[], startIndex: number) => void;
    onWatchVideo: (url: string, ref: React.RefObject<HTMLButtonElement>) => void;
}

interface SidebarProps {
    title: string;
    isOpen: boolean;
    onClose: () => void;
    onBack?: () => void;
    children: ReactNode;
    footer: ReactNode;
}

interface CartSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    cart: CartItem[];
    onUpdateQuantity: (id: string, quantity: number, size?: string) => void;
    onRemoveItem: (id: string, size?: string) => void;
    onCheckout: () => void;
    total: number;
}

interface CheckoutSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onBack: () => void;
    onPlaceOrder: (details: CustomerDetails, paymentMethod: PaymentMethod) => void;
    total: number;
    cartItemCount: number;
}

interface ToastProps {
    message: string;
    isVisible: boolean;
}

interface FooterProps {
    onNavigate: (view: View) => void;
}

// --- Data ---
const products: ProductFull[] = [
  {
    id: "legacy-edition",
    name: "Legacy Edition",
    category: ["Hard Tennis"],
    description: "A premium hard tennis bat for the serious player. Comes with a full professional kit to get you started.",
    image: [
      "https://res.cloudinary.com/ddahm5ebv/image/upload/v1752142178/photo_6098247283192742268_y_1_v2n8js.jpg",
      "https://res.cloudinary.com/ddahm5ebv/image/upload/v1752139516/photo_6098247283192742264_y_1_afafxh.jpg",
      "https://res.cloudinary.com/ddahm5ebv/image/upload/v1752141979/photo_6098247283192742267_y_1_lkeruv.jpg",
      "https://res.cloudinary.com/ddahm5ebv/image/upload/v1752142077/photo_6098247283192742266_y_1_qpfjsl.jpg",
      "https://res.cloudinary.com/ddahm5ebv/image/upload/v1752142267/photo_6098247283192742269_y_hpkuvf.jpg",
      "https://res.cloudinary.com/ddahm5ebv/image/upload/v1752142328/photo_6098247283192742270_y_fxeei5.jpg",
    ],
    price: 2700,
    originalPrice: 4000,
    specs: [
      "Weight: 850-1050 grams",
      "Edge: 48 to 52 mm",
      "Height: Available in 35 and 36 inches",
      "Face: 4.4 inches",
      "Handle: Singapore cane handle",
      "Free delivery",
        "Free bat bag",
        "Premium toe guard",
        "Fully knocked and oiled",
        "Extra grip provided"
    ],
    reviewLink: "https://www.instagram.com/reel/DJQ7NfHxRze/?igsh=NWpnMnZsZDRkZTBn"
  },
  {
    id: "bahubali-edition",
    name: "Bahubali Edition",
    category: ["Hard Tennis"],
    description: "Unleash raw power with the Bahubali Edition. Themed in wine red and black, this bat is designed for aggressive players who dominate the game.",
    image: [
      "https://res.cloudinary.com/ddahm5ebv/image/upload/v1752218596/photo_6305555205562943192_w_wo3lkr.jpg",
      "https://res.cloudinary.com/ddahm5ebv/image/upload/v1752218597/photo_6305555205562943193_w_lcmcnd.jpg",
      "https://res.cloudinary.com/ddahm5ebv/image/upload/v1752218593/photo_6305555205562943198_w_e1jmj5.jpg",
      "https://res.cloudinary.com/ddahm5ebv/image/upload/v1752218593/photo_6305555205562943194_w_qrlxpr.jpg",
      "https://res.cloudinary.com/ddahm5ebv/image/upload/v1752218593/photo_6305555205562943196_w_uosoj9.jpg"
    ],
    price: 2400,
    originalPrice: 3500,
    specs: [
        "Weight: 800-1000 grams",
        "Edge: 45-50 mm",
        "Height: Available in 35 and 36 inches",
        "Face: 4.4 inches",
        "Free delivery",
        "Free bat bag",
        "Premium toe guard",
        "Fully knocked and oiled",
        "Extra grip provided"
    ],
    reviewLink: "https://www.instagram.com/reel/DKZnVF1xcB2/?igsh=MXh6bmI0MTNienV5aA=="
  },
  {
    id: "ak-47-edition",
    name: "AK-47 Edition (Diamond Scoop)",
    category: ["Soft Tennis"],
    description: "Limited-time offer! This bat is lightweight, balanced, and ideal for soft tennis gameplay.",
    image: [
      "https://res.cloudinary.com/ddahm5ebv/image/upload/v1752142646/photo_6305588890991445185_y_m66gex.jpg",
      "https://res.cloudinary.com/ddahm5ebv/image/upload/v1752142648/photo_6305588890991445179_y_n32occ.jpg",
      "https://res.cloudinary.com/ddahm5ebv/image/upload/v1752142646/photo_6305588890991445184_y_ublivz.jpg",
      "https://res.cloudinary.com/ddahm5ebv/image/upload/v1752142647/photo_6305588890991445183_y_kcmq91.jpg",
      "https://res.cloudinary.com/ddahm5ebv/image/upload/v1752142647/photo_6305588890991445182_y_yv6yyk.jpg",
      "https://res.cloudinary.com/ddahm5ebv/image/upload/v1752142648/photo_6305588890991445180_y_x6l052.jpg"
    ],
    price: 1700,
    originalPrice: 2800,
     specs: [
        "Weight Range: 800 to 900 grams",
        "Edge Thickness: 38 to 43 mm",
        "Height Options: 35 and 36 inches available",
        "Face Width: 4.3 inches",
        "Free delivery",
        "Free bat bag",
        "Premium toe guard",
        "Fully knocked and oiled",
        "Extra grip provided"
    ],
    reviewLink: "https://www.instagram.com/reel/DJtVYapR7B2/?igsh=MTk1cm5tMzVpbXRlNA=="
  },
  {
    id: "ak-47-honeycomb",
    name: "AK-47 Edition (Honeycomb Scoop)",
    category: ["Hard Tennis", "Soft Tennis"],
    description: "Experience explosive hitting with the honeycomb scoop design. Lightweight yet powerful, it's engineered for dominating both hard and soft tennis ball games.",
    image: [
      "https://res.cloudinary.com/ddahm5ebv/image/upload/v1752932038/6332452326584994781_oau6do.jpg",
      "https://res.cloudinary.com/ddahm5ebv/image/upload/v1752932037/6332452326584994786_xlbkir.jpg",
      "https://res.cloudinary.com/ddahm5ebv/image/upload/v1752932038/6332452326584994782_oe26s1.jpg",
      "https://res.cloudinary.com/ddahm5ebv/image/upload/v1752932037/6332452326584994783_ayqctc.jpg",
      "https://res.cloudinary.com/ddahm5ebv/image/upload/v1752932037/6332452326584994784_vfrqzg.jpg",
      "https://res.cloudinary.com/ddahm5ebv/image/upload/v1752932037/6332452326584994785_ovfohm.jpg"
    ],
    price: 1850,
    originalPrice: 3000,
    specs: [
        "Weight: 900g – 1100g",
        "Edge Thickness: 44mm – 48mm",
        "Height: 35–36 inches",
        "Face Width: 4.4 inches",
        "Free Delivery",
        "Free Bat Bag",
        "Premium Toe Guard",
        "Fully Knocked & Oiled",
        "Extra Grip Provided"
    ],
  },
  {
    id: "standard-leather-bat",
    name: "Leather Bat",
    category: ["Leather Ball"],
    description: "Professional-grade bat crafted for leather ball matches.",
    image: [
        "https://res.cloudinary.com/ddahm5ebv/image/upload/v1752143104/photo_6305588890991445188_w_fh2idz.jpg",
        "https://res.cloudinary.com/ddahm5ebv/image/upload/v1752143103/photo_6305588890991445191_w_rodv8k.jpg",
        "https://res.cloudinary.com/ddahm5ebv/image/upload/v1752143102/photo_6305588890991445190_w_qxvqd7.jpg",
        "https://res.cloudinary.com/ddahm5ebv/image/upload/v1752143102/photo_6305588890991445189_w_amhn0n.jpg"
    ],
    price: 4000,
    originalPrice: 6500,
    specs: [
        "Grade A+ Kashmir Willow",
        "Weight: 1150-1250 grams",
        "Designed for professional leather ball cricket",
        "Grains: 5-12 clear grains",
        "Free delivery",
        "Free bat bag",
        "Premium toe guard",
        "Fully knocked and oiled",
        "Extra grip provided"
    ],
    reviewLink: "https://www.instagram.com/reel/DIglzIVR0j5/?igsh=MTd3dWg1d3k2OXpxdA==",
    videoUrl: "https://res.cloudinary.com/ddahm5ebv/video/upload/v1752937006/IMG_3616_x93dod.mp4",
  },
];

const createWhatsAppLink = (message: string) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

// --- Global Components ---
const Lightbox: FC<LightboxProps> = ({ gallery, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isZoomed, setIsZoomed] = useState(false);
    const interactionStartRef = useRef(0);
    const wasDraggedRef = useRef(false);

    const images = useMemo(() => gallery?.images ?? [], [gallery]);

    const goToPrev = useCallback(() => {
        if (isZoomed) return;
        setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
        setIsZoomed(false); // Unzoom when changing image
    }, [isZoomed, images.length]);

    const goToNext = useCallback(() => {
        if (isZoomed) return;
        setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
        setIsZoomed(false); // Unzoom when changing image
    }, [isZoomed, images.length]);

    useEffect(() => {
        if (gallery) {
            setCurrentIndex(gallery.startIndex);
            setIsZoomed(false);
        }
    }, [gallery]);
    
    useEffect(() => {
        if (!gallery) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') goToNext();
            if (e.key === 'ArrowLeft') goToPrev();
            if (e.key === 'Escape') onClose();
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [gallery, goToNext, goToPrev, onClose]);

    if (!gallery) return null;

    const handleTouchStart = (e: React.TouchEvent) => {
        if (isZoomed) return;
        interactionStartRef.current = e.targetTouches[0].clientX;
        wasDraggedRef.current = false;
    };
    
    const handleTouchMove = (e: React.TouchEvent) => {
        if (isZoomed) return;
        if (Math.abs(interactionStartRef.current - e.targetTouches[0].clientX) > 10) {
            e.preventDefault();
            wasDraggedRef.current = true;
        }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (isZoomed) return;
        const delta = interactionStartRef.current - e.changedTouches[0].clientX;
        if (delta > 50) goToNext();
        else if (delta < -50) goToPrev();
    };

    const handleImageClick = () => {
        if (!wasDraggedRef.current) {
            setIsZoomed(!isZoomed);
        }
    };
    
    const handleCloseClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onClose();
    };

    return (
        <div className="lightbox-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="lightbox-counter">
            <button className="lightbox-close-btn" aria-label="Close image gallery" onClick={handleCloseClick}>
                <i className="fas fa-times"></i>
            </button>
            
            <div className="lightbox-content-container">
                {images.length > 1 && (
                    <>
                        <button onClick={(e) => { e.stopPropagation(); goToPrev(); }} className="lightbox-nav-btn prev" aria-label="Previous image" disabled={isZoomed}><i className="fas fa-chevron-left"></i></button>
                        <button onClick={(e) => { e.stopPropagation(); goToNext(); }} className="lightbox-nav-btn next" aria-label="Next image" disabled={isZoomed}><i className="fas fa-chevron-right"></i></button>
                    </>
                )}

                <div 
                    className="lightbox-content" 
                    onClick={e => e.stopPropagation()}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <div className="lightbox-filmstrip" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
                        {images.map((src, index) => (
                            <div key={src} className="lightbox-image-wrapper">
                                <img
                                    src={src}
                                    alt={`Full screen product view ${index + 1} of ${images.length}`}
                                    className={`lightbox-image ${isZoomed ? 'zoomed' : ''}`}
                                    onClick={handleImageClick}
                                    draggable="false"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {images.length > 1 && (
                <div className="lightbox-footer">
                    <span id="lightbox-counter" className="lightbox-counter">{currentIndex + 1} / {images.length}</span>
                </div>
            )}
        </div>
    );
};

const Toast: FC<ToastProps> = ({ message, isVisible }) => {
    return <div className={`toast ${isVisible ? 'show' : ''}`}>{message}</div>;
};

// --- View-Specific Components ---
const ImageGallery: FC<ImageGalleryProps> = ({ images, altText, onImageClick }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const interactionStartRef = useRef(0);
    const wasDraggedRef = useRef(false);
    const filmstripRef = useRef<HTMLDivElement>(null);

    const goToPrev = () => setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
    const goToNext = () => setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));

    // Touch handlers
    const handleTouchStart = (e: React.TouchEvent) => {
        interactionStartRef.current = e.targetTouches[0].clientX;
        wasDraggedRef.current = false;
    };
    const handleTouchMove = (e: React.TouchEvent) => {
        if (Math.abs(interactionStartRef.current - e.targetTouches[0].clientX) > 10) {
            e.preventDefault();
            wasDraggedRef.current = true;
        }
    };
    const handleTouchEnd = (e: React.TouchEvent) => {
        const delta = interactionStartRef.current - e.changedTouches[0].clientX;
        if (delta > 50) goToNext();
        else if (delta < -50) goToPrev();
    };
    
    // Mouse handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        wasDraggedRef.current = false;
        interactionStartRef.current = e.clientX;
        if (filmstripRef.current) {
            filmstripRef.current.style.cursor = 'grabbing';
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        if (Math.abs(interactionStartRef.current - e.clientX) > 10) {
            wasDraggedRef.current = true;
        }
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setIsDragging(false);
        if (filmstripRef.current) {
            filmstripRef.current.style.cursor = 'pointer';
        }
        const delta = interactionStartRef.current - e.clientX;
        if (delta > 50) goToNext();
        else if (delta < -50) goToPrev();
    };

    const handleMouseLeave = (e: React.MouseEvent) => {
        if (isDragging) {
            handleMouseUp(e);
        }
    };
    
    const handleImageWrapperClick = (index: number) => {
        if (!wasDraggedRef.current) {
            onImageClick(index);
        }
    };

    return (
        <div className="image-gallery">
            <div className="gallery-main-container">
                <div 
                    ref={filmstripRef}
                    className="gallery-filmstrip" 
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                    onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
                    onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
                >
                    {images.map((src, index) => (
                        <div key={src} className="gallery-image-wrapper" onClick={() => handleImageWrapperClick(index)}>
                            <img src={src} alt={altText} className="gallery-main-image" loading="lazy" draggable="false" />
                        </div>
                    ))}
                </div>
                <button onClick={goToPrev} className="gallery-nav-btn prev" aria-label="Previous image"><i className="fas fa-chevron-left"></i></button>
                <button onClick={goToNext} className="gallery-nav-btn next" aria-label="Next image"><i className="fas fa-chevron-right"></i></button>
            </div>
            <div className="gallery-thumbnails">
                {images.map((src, index) => (
                    <img key={src} src={src} alt={`Thumbnail ${index + 1}`} className={`gallery-thumbnail ${index === currentIndex ? 'active' : ''}`} onClick={() => setCurrentIndex(index)} loading="lazy" />
                ))}
            </div>
        </div>
    );
};

const Header: FC<HeaderProps> = memo(({ onCartClick, cartItemCount, onNavigate }) => {
    const [isLogoDimmed, setIsLogoDimmed] = useState(false);

    const handleLogoClick = (e: React.MouseEvent) => {
        e.preventDefault();
        
        // Dim the logo
        setIsLogoDimmed(true);
        
        // After a short delay, un-dim it
        setTimeout(() => {
            setIsLogoDimmed(false);
        }, 300); // This duration should feel snappy

        // Navigate to home
        onNavigate('home');
    };

    return (
        <header className="header">
            <nav className="nav">
                <a href="#" onClick={handleLogoClick} className="nav-brand-centered" aria-label="Go to homepage">
                    <img 
                        src="https://res.cloudinary.com/ddahm5ebv/image/upload/v1752992278/6334704126398678409-removebg-preview_dvxsud.png" 
                        alt="Wular Sports Logo" 
                        className={`nav-logo-centered ${isLogoDimmed ? 'dimming' : ''}`} 
                    />
                </a>
                <div className="nav-section-right">
                    <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('collection'); }} className="nav-link">Shop Collection</a>
                    <div className="nav-cart" onClick={onCartClick} role="button" aria-label="Open cart">
                        <i className="fas fa-shopping-cart" aria-hidden="true"></i>
                        {cartItemCount > 0 && <span className="cart-badge">{cartItemCount}</span>}
                        <span className="cart-text">Cart</span>
                    </div>
                </div>
            </nav>
        </header>
    );
});


const Hero: FC<HeroProps> = memo(({ onShopCollectionClick }) => {
    const [isAnimating, setIsAnimating] = useState(false);

    const handleTitleClick = () => {
        if (isAnimating) return; // Prevent re-triggering while animating
        setIsAnimating(true);
        setTimeout(() => {
            setIsAnimating(false);
        }, 1500); // Match animation duration in CSS
    };

    return (
        <section className="hero" id="home">
            <div className="container">
                <h1 
                    className={`hero-title ${isAnimating ? 'is-animating' : ''}`}
                    onClick={handleTitleClick}
                >
                    Unleash Your Power
                </h1>
                <p className="hero-subtitle">Crafted for Champions. Built for Victory.</p>
                <div className="hero-cta-box">
                    <p>We support Cash on Delivery. Only ₹300 advance booking required!</p>
                    <button onClick={onShopCollectionClick} className="btn">Shop Collection</button>
                </div>
            </div>
        </section>
    );
});


const ProductCard: FC<ProductCardProps> = memo(({ product, onAddToCart, onImageClick, onWatchVideo }) => {
    const videoButtonRef = useRef<HTMLButtonElement>(null);
    const hasSizeOptions = useMemo(() => {
        return product.specs.some(spec => 
            spec.toLowerCase().includes('35') && 
            spec.toLowerCase().includes('36') && 
            spec.toLowerCase().includes('inch')
        );
    }, [product.specs]);

    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [showSizeError, setShowSizeError] = useState(false);
    
    let imageElement;
    if (Array.isArray(product.image) && product.image.length > 0) {
        imageElement = <ImageGallery images={product.image} altText={product.name} onImageClick={(index) => onImageClick(product.image as string[], index)} />;
    } else if (typeof product.image === 'string') {
        const imageUrl = product.image;
        imageElement = <img src={imageUrl} alt={product.name} className="product-image" onClick={() => onImageClick([imageUrl], 0)} />;
    }

    const handleAddToCartClick = () => {
        if (hasSizeOptions && !selectedSize) {
            setShowSizeError(true);
            return;
        }
        onAddToCart(product, selectedSize);
    };

    const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedSize(e.target.value);
        if (showSizeError) {
            setShowSizeError(false);
        }
    };
    
    return (
        <div className="product-card">
            <div className="product-tags">
                <span className="tag category-tag">{product.category.join(' / ')}</span>
                {product.originalPrice && <span className="tag sale-tag">Sale</span>}
            </div>
            {imageElement}
            {product.videoUrl && (
                <div className="product-video-button-container">
                    <button ref={videoButtonRef} className="btn video-btn" onClick={() => onWatchVideo(product.videoUrl!, videoButtonRef)}>
                        ▶ Watch Bat in Action
                    </button>
                </div>
            )}
            <h3 className="product-name">{product.name}</h3>
            <p className="product-description">{product.description}</p>
            
            {hasSizeOptions && (
                <div className="product-size-selector">
                    <div className="size-selector-header">
                        <label className="size-selector-label">Select Bat Size</label>
                    </div>
                    <div className="size-radio-group">
                        <div className="size-radio-option">
                            <input type="radio" id={`size-35-${product.id}`} name={`size-${product.id}`} value="35 inch" checked={selectedSize === "35 inch"} onChange={handleSizeChange} />
                            <label htmlFor={`size-35-${product.id}`}>35 inch</label>
                        </div>
                        <div className="size-radio-option">
                            <input type="radio" id={`size-36-${product.id}`} name={`size-${product.id}`} value="36 inch" checked={selectedSize === "36 inch"} onChange={handleSizeChange} />
                            <label htmlFor={`size-36-${product.id}`}>36 inch</label>
                        </div>
                    </div>
                    {showSizeError && <p className="error-message size-error">Please select a bat size.</p>}
                </div>
            )}

            <ul className="product-specs">
                {product.specs.map((spec, i) => <li key={i}><i className="fas fa-check-circle" aria-hidden="true"></i> {spec}</li>)}
            </ul>
            <div className="product-footer">
                <div className="product-price">
                    <span className="current-price">₹{product.price.toLocaleString('en-IN')}</span>
                    {product.originalPrice && <span className="original-price">₹{product.originalPrice.toLocaleString('en-IN')}</span>}
                </div>
                <button className="btn add-to-cart-btn" onClick={handleAddToCartClick}>
                    <i className="fas fa-shopping-cart" aria-hidden="true"></i> Add to Cart
                </button>
            </div>
            {product.reviewLink && (
                <div className="product-review-section">
                    <a href={product.reviewLink} target="_blank" rel="noopener noreferrer" className="btn review-btn">
                        <i className="fab fa-instagram"></i> Watch Customer Review
                    </a>
                </div>
            )}
        </div>
    );
});

const Catalog = memo(React.forwardRef<HTMLElement, CatalogProps>(({ onAddToCart, onImageClick, onWatchVideo }, ref) => (
    <section id="catalog" ref={ref}>
        <div className="container">
            <h2 className="section-title">Featured Bats</h2>
            <div className="catalog-grid">
                {products.map(product => (
                    <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} onImageClick={onImageClick} onWatchVideo={onWatchVideo} />
                ))}
            </div>
        </div>
    </section>
)));
Catalog.displayName = "Catalog";

const Sidebar: FC<SidebarProps> = memo(({ title, isOpen, onClose, onBack, children, footer }) => (
    <>
        <div className={`overlay ${isOpen ? 'show' : ''}`} onClick={onClose}></div>
        <aside className={`sidebar ${isOpen ? 'open' : ''}`} role="dialog" aria-modal="true" aria-labelledby="sidebar-title">
            <div className="sidebar-header">
                {onBack && <button onClick={onBack} className="back-btn"><i className="fas fa-arrow-left" aria-hidden="true"></i> Back to Cart</button>}
                <h3 className="sidebar-title" id="sidebar-title">{title}</h3>
                <button onClick={onClose} className="close-btn" aria-label="Close sidebar"><i className="fas fa-times" aria-hidden="true"></i></button>
            </div>
            <div className="sidebar-content">{children}</div>
            <div className="sidebar-footer">{footer}</div>
        </aside>
    </>
));

const CartSidebar: FC<CartSidebarProps> = memo(({ isOpen, onClose, cart, onUpdateQuantity, onRemoveItem, onCheckout, total }) => {
    return (
        <Sidebar title="Your Cart" isOpen={isOpen} onClose={onClose} footer={
            <>
                <div className="cart-total"><span>Total</span><span>₹{total.toLocaleString('en-IN')}</span></div>
                <button className="btn checkout-btn" onClick={onCheckout} disabled={cart.length === 0}>Proceed to Checkout</button>
            </>
        }>
            {cart.length === 0 ? <p className="empty-cart">Your cart is empty.</p> :
                <div className="cart-items">
                    {cart.map(item => (
                        <div className="cart-item" key={`${item.id}-${item.size || 'default'}`}>
                            <img src={Array.isArray(item.image) ? item.image[0] : item.image} alt={item.name} className="cart-item-image" />
                            <div className="cart-item-details">
                                <p className="cart-item-name">
                                    {item.name}
                                    {item.size && <span className="cart-item-size">- {item.size}</span>}
                                </p>
                                <p className="cart-item-price">₹{item.price.toLocaleString('en-IN')}</p>
                                <button className="remove-btn" onClick={() => onRemoveItem(item.id, item.size)}>Remove</button>
                            </div>
                            <div className="quantity-control">
                                <button onClick={() => onUpdateQuantity(item.id, item.quantity - 1, item.size)} disabled={item.quantity <= 1}>-</button>
                                <span>{item.quantity}</span>
                                <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1, item.size)}>+</button>
                            </div>
                        </div>
                    ))}
                </div>
            }
        </Sidebar>
    );
});

const CheckoutSidebar: FC<CheckoutSidebarProps> = memo(({ isOpen, onClose, onBack, onPlaceOrder, total, cartItemCount }) => {
    const [details, setDetails] = useState<CustomerDetails>({ fullName: '', email: '', phone: '', pinCode: '', city: '', state: '', address: '', landmark: '' });
    const [errors, setErrors] = useState<Partial<Record<keyof CustomerDetails, string>>>({});
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('full');
    const [showDeliveryEstimate, setShowDeliveryEstimate] = useState(false);
    const [isEmailTooltipVisible, setEmailTooltipVisible] = useState(false);
    const emailTooltipTimeoutRef = useRef<number | null>(null);

    const advanceAmount = useMemo(() => 300 * cartItemCount, [cartItemCount]);
    const remainingAmount = useMemo(() => total - advanceAmount, [total, advanceAmount]);
    
    const codConvenienceFee = useMemo(() => {
        if (paymentMethod === 'partial' && remainingAmount > 0) {
            return Math.round(remainingAmount * 0.05);
        }
        return 0;
    }, [paymentMethod, remainingAmount]);

    const totalPayableOnDelivery = useMemo(() => remainingAmount + codConvenienceFee, [remainingAmount, codConvenienceFee]);


    const validate = () => {
        const newErrors: Partial<Record<keyof CustomerDetails, string>> = {};
        if (!details.fullName.trim()) newErrors.fullName = "Please enter your full name.";
        
        if (details.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) {
            newErrors.email = "Please enter a valid email address.";
        }
        
        if (!details.phone.trim()) newErrors.phone = "Please enter your phone number.";
        else if (!/^\d{10}$/.test(details.phone)) newErrors.phone = "Phone number must be exactly 10 digits.";
        if (!details.pinCode.trim()) newErrors.pinCode = "Please enter your PIN code.";
        else if (!/^\d{6}$/.test(details.pinCode)) newErrors.pinCode = "Please enter a valid 6-digit PIN code.";
        if (!details.city.trim()) newErrors.city = "Please enter your city.";
        if (!details.state) newErrors.state = "Please select your state.";
        if (!details.address.trim()) newErrors.address = "Please enter your full address.";
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setDetails(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onPlaceOrder(details, paymentMethod);
        }
    };
    
    const handleShowEmailTooltip = () => {
        if (emailTooltipTimeoutRef.current) clearTimeout(emailTooltipTimeoutRef.current);
        setEmailTooltipVisible(true);
        emailTooltipTimeoutRef.current = window.setTimeout(() => {
            setEmailTooltipVisible(false);
        }, 4000);
    };

    const handleHideEmailTooltip = () => {
        if (emailTooltipTimeoutRef.current) clearTimeout(emailTooltipTimeoutRef.current);
        setEmailTooltipVisible(false);
    };

    useEffect(() => {
        if (isOpen) {
            setErrors({});
            setDetails({ fullName: '', email: '', phone: '', pinCode: '', city: '', state: '', address: '', landmark: '' });
            setPaymentMethod('full');
            setShowDeliveryEstimate(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (/^\d{6}$/.test(details.pinCode)) {
            setShowDeliveryEstimate(true);
        } else {
            setShowDeliveryEstimate(false);
        }
    }, [details.pinCode]);

    return (
        <Sidebar 
            title="Delivery & Payment" 
            isOpen={isOpen} 
            onClose={onClose} 
            onBack={onBack} 
            footer={
                <button className="btn pay-btn" form="checkout-form" type="submit" disabled={cartItemCount === 0}>
                    <i className="fab fa-whatsapp"></i> Place Order via WhatsApp
                </button>
            }
        >
            <form id="checkout-form" className="checkout-form" onSubmit={handleSubmit} noValidate>
                <div className="form-field">
                    <input type="text" name="fullName" placeholder="Full Name" value={details.fullName} onChange={handleChange} autoComplete="name" required />
                    {errors.fullName && <p className="error-message">{errors.fullName}</p>}
                </div>
                 <div className="form-field with-tooltip">
                    <input 
                        type="email" 
                        name="email" 
                        placeholder="Email (Optional)" 
                        value={details.email} 
                        onChange={handleChange} 
                        autoComplete="email" 
                        onFocus={handleShowEmailTooltip}
                        onBlur={handleHideEmailTooltip}
                        onMouseEnter={handleShowEmailTooltip}
                    />
                    {errors.email && <p className="error-message">{errors.email}</p>}
                    {isEmailTooltipVisible && (
                        <div className="email-tooltip">
                            <i className="fas fa-info-circle"></i>
                            By sharing your email, you’ll receive early access to new launches, exclusive discounts, and important updates from our team.
                        </div>
                    )}
                </div>
                <div className="form-field">
                    <input type="tel" name="phone" placeholder="Phone Number" value={details.phone} onChange={handleChange} autoComplete="tel" required />
                    {errors.phone && <p className="error-message">{errors.phone}</p>}
                </div>
                <div className="form-field">
                    <input type="text" name="pinCode" placeholder="PIN Code" value={details.pinCode} onChange={handleChange} autoComplete="postal-code" required />
                    {errors.pinCode && <p className="error-message">{errors.pinCode}</p>}
                </div>

                {showDeliveryEstimate && (
                    <div className="delivery-estimate-note">
                        <i className="fas fa-truck" aria-hidden="true"></i>
                        <span>Estimated delivery time to this pin code is 7–8 days.</span>
                    </div>
                )}

                <div className="form-field">
                    <input type="text" name="city" placeholder="City" value={details.city} onChange={handleChange} autoComplete="address-level2" required />
                    {errors.city && <p className="error-message">{errors.city}</p>}
                </div>
                <div className="form-field">
                    <select name="state" value={details.state} onChange={handleChange} autoComplete="address-level1" required>
                        <option value="" disabled>Select State</option>
                        {INDIAN_STATES.map(state => <option key={state} value={state}>{state}</option>)}
                    </select>
                    {errors.state && <p className="error-message">{errors.state}</p>}
                </div>
                <div className="form-field">
                    <textarea name="address" placeholder="Full Address (House No, Building, Street)" value={details.address} onChange={handleChange} rows={3} autoComplete="street-address" required></textarea>
                    {errors.address && <p className="error-message">{errors.address}</p>}
                </div>
                <div className="form-field">
                    <input type="text" name="landmark" placeholder="Nearby Landmark (Optional)" value={details.landmark} onChange={handleChange} />
                </div>
            </form>

            <div className="payment-options-container">
                <h4>Select Payment Option</h4>
                <div className="payment-option">
                    <input type="radio" id="fullPayment" name="paymentMethod" value="full" checked={paymentMethod === 'full'} onChange={() => setPaymentMethod('full')} />
                    <label htmlFor="fullPayment">
                        <strong>Full Payment</strong>
                        <span>Pay full amount: ₹{total.toLocaleString('en-IN')}</span>
                    </label>
                </div>
                <div className="payment-option">
                    <input type="radio" id="partialPayment" name="paymentMethod" value="partial" checked={paymentMethod === 'partial'} onChange={() => setPaymentMethod('partial')} disabled={cartItemCount === 0} />
                    <label htmlFor="partialPayment">
                        <strong>Partial Payment (Advance + COD)</strong>
                        <span>Pay ₹300 advance per bat. Total advance: ₹{advanceAmount.toLocaleString('en-IN')}</span>
                    </label>
                </div>

                <div className="payment-details-breakdown">
                    {paymentMethod === 'full' && cartItemCount > 0 && (
                        <div className="payment-option-details">
                            <strong>Total Amount to Pay Now: ₹{total.toLocaleString('en-IN')}</strong>
                             <p className="cod-fee-note success">
                                ✅ This total amount includes no additional charges—full online payments are free from COD convenience fees.
                            </p>
                        </div>
                    )}
                    {paymentMethod === 'partial' && cartItemCount > 0 && (
                        <div className="payment-option-details">
                            <strong>Advance to Pay Now: ₹{advanceAmount.toLocaleString('en-IN')}</strong>
                            <hr/>
                            <p>Remaining Amount (on delivery): <span>₹{remainingAmount.toLocaleString('en-IN')}</span></p>
                            <p>+ 5% COD Convenience Fee: <span>₹{codConvenienceFee.toLocaleString('en-IN')}</span></p>
                            <hr/>
                            <p><strong>Total Payable at Delivery:</strong> <span><strong>₹{totalPayableOnDelivery.toLocaleString('en-IN')}</strong></span></p>

                            <p className="cod-fee-note warning">
                                <i className="fas fa-info-circle"></i> 
                                The 5% COD convenience fee goes directly to the delivery service provider (e.g., India Post, DTDC) and **not to Wular Sports**.
                                <br/>
                                ✅ If you pay the entire amount online in advance, **this extra 5% fee does NOT apply.**
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </Sidebar>
    );
});

// Helper component for radio buttons in the customization form
interface CustomizationRadioGroupProps {
    name: string;
    label: string;
    options: string[];
    selectedValue: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    error?: string;
}

const CustomizationRadioGroup: FC<CustomizationRadioGroupProps> = memo(({ name, label, options, selectedValue, onChange, error }) => (
    <div className="form-group">
        <label className="form-label">{label}</label>
        <div className="radio-group">
            {options.map(option => (
                <div key={option} className="radio-option">
                    <input
                        type="radio"
                        id={`${name}-${option.replace(/\s+/g, '-')}`}
                        name={name}
                        value={option}
                        checked={selectedValue === option}
                        onChange={onChange}
                        required
                    />
                    <label htmlFor={`${name}-${option.replace(/\s+/g, '-')}`}>{option}</label>
                </div>
            ))}
        </div>
        {error && <p className="error-message">{error}</p>}
    </div>
));


const Customization = memo(() => {
    const [batType, setBatType] = useState<'tennis' | 'leather' | null>(null);
    const [formData, setFormData] = useState<any>({});
    const [errors, setErrors] = useState<any>({});
    const [isSubmitted, setIsSubmitted] = useState(false);

    const tennisOptionFields = ['bladeType', 'nameEngraving', 'toeGuard', 'finish', 'sticker', 'bag'];
    const leatherOptionFields = ['weight', 'nameEngraving', 'sticker', 'toeGuard', 'bag'];
    
    const options = {
        bladeType: ['Single Blade', 'Double Blade'],
        nameEngraving: ['Yes', 'No'],
        toeGuard: ['Premium Toe Guard', 'Normal Toe Guard'],
        finish: ['Ultra Finish', 'Normal Finish'],
        sticker: ['Wular Sports Sticker', 'Other Brand Sticker', 'No Sticker'],
        bag: ['Cushioned Premium Bag', 'Normal Bag'],
        weight: ['1100–1200 grams', '1200–1300 grams', '1300–1400 grams'],
    };

    const handleBatTypeSelect = (type: 'tennis' | 'leather') => {
        setBatType(type);
        setFormData({});
        setErrors({});
        setIsSubmitted(false);
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev: any) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const validate = (): boolean => {
        const newErrors: any = {};
        const requiredFields = batType === 'tennis' ? tennisOptionFields : leatherOptionFields;

        requiredFields.forEach(field => {
            if (!formData[field]) {
                newErrors[field] = 'Please make a selection for this option.';
            }
        });

        if (formData.nameEngraving === 'Yes' && (!formData.engravedName || formData.engravedName.trim() === '')) {
            newErrors.engravedName = 'Please enter the name to engrave.';
        }
        if (formData.sticker === 'Other Brand Sticker' && (!formData.otherStickerBrand || formData.otherStickerBrand.trim() === '')) {
            newErrors.otherStickerBrand = 'Please enter the sticker brand.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        let message = `*Custom Bat Request: ${batType === 'tennis' ? 'Tennis Bat' : 'Leather Bat'}*\n\n--- OPTIONS ---\n`;
        
        const fieldLabels: {[key: string]: string} = {
            bladeType: "Blade Type",
            finish: "Finish Type",
            weight: "Weight Range",
            nameEngraving: "Name Engraving",
            engravedName: "  - Name",
            toeGuard: "Toe Guard Type",
            sticker: "Sticker Type",
            otherStickerBrand: "  - Sticker Brand",
            bag: "Bag Type",
        };

        const fieldOrder = batType === 'tennis' 
            ? ['bladeType', 'finish', 'nameEngraving', 'engravedName', 'toeGuard', 'sticker', 'otherStickerBrand', 'bag']
            : ['weight', 'nameEngraving', 'engravedName', 'toeGuard', 'sticker', 'otherStickerBrand', 'bag'];

        fieldOrder.forEach(key => {
            if (formData[key]) {
                message += `*${fieldLabels[key]}:* ${formData[key]}\n`;
            }
        });
        
        window.open(createWhatsAppLink(message.trim()), '_blank');
        setIsSubmitted(true);
    };
    
    const renderFormSpecificOptions = () => {
        if (!batType) return null;
        
        if (batType === 'tennis') {
            return (
                <>
                    <CustomizationRadioGroup name="bladeType" label="Blade Type" options={options.bladeType} selectedValue={formData.bladeType} onChange={handleChange} error={errors.bladeType} />
                    <CustomizationRadioGroup name="finish" label="Finish Type" options={options.finish} selectedValue={formData.finish} onChange={handleChange} error={errors.finish} />
                </>
            );
        }
        
        if (batType === 'leather') {
            return <CustomizationRadioGroup name="weight" label="Weight Range" options={options.weight} selectedValue={formData.weight} onChange={handleChange} error={errors.weight} />;
        }
    };
    
    return (
        <section id="customize">
            <div className="container">
                <h2 className="section-title">Customize Your Bat</h2>

                {isSubmitted && (
                    <div className="success-message">
                        <p>✅ Your customization request has been sent to Wular Sports on WhatsApp. We will contact you shortly to finalize your order.</p>
                        <button className="btn" onClick={() => { setIsSubmitted(false); setBatType(null); }}>Start a New Customization</button>
                    </div>
                )}
                
                {!batType && !isSubmitted && (
                    <div className="bat-type-selector">
                        <p>First, select the type of bat you want to customize.</p>
                        <div>
                            <button className="btn bat-type-btn" onClick={() => handleBatTypeSelect('tennis')}>🏏 Tennis Bat</button>
                            <button className="btn bat-type-btn" onClick={() => handleBatTypeSelect('leather')}>🏏 Leather Bat</button>
                        </div>
                    </div>
                )}
                
                {batType && !isSubmitted && (
                    <form className="customization-form" onSubmit={handleSubmit} noValidate>
                        <button type="button" className="btn back-to-type" onClick={() => setBatType(null)}>Change Bat Type</button>
                        <h3 className="customization-heading">Customizing: {batType === 'tennis' ? 'Tennis Bat' : 'Leather Bat'}</h3>
                        
                        {renderFormSpecificOptions()}

                        <CustomizationRadioGroup name="nameEngraving" label="Name Engraving" options={options.nameEngraving} selectedValue={formData.nameEngraving} onChange={handleChange} error={errors.nameEngraving} />
                        {formData.nameEngraving === 'Yes' && (
                            <div className="form-group indented">
                                <label className="form-label" htmlFor="engravedName">Enter the name to engrave (max 10 characters)</label>
                                <input type="text" id="engravedName" name="engravedName" value={formData.engravedName || ''} onChange={handleChange} maxLength={10} required />
                                {errors.engravedName && <p className="error-message">{errors.engravedName}</p>}
                            </div>
                        )}
                        
                        <CustomizationRadioGroup name="toeGuard" label="Toe Guard Type" options={options.toeGuard} selectedValue={formData.toeGuard} onChange={handleChange} error={errors.toeGuard} />
                        <CustomizationRadioGroup name="sticker" label="Sticker Type" options={options.sticker} selectedValue={formData.sticker} onChange={handleChange} error={errors.sticker} />
                        {formData.sticker === 'Other Brand Sticker' && (
                             <div className="form-group indented">
                                <label className="form-label" htmlFor="otherStickerBrand">Enter the sticker brand (e.g., SG, SS, TON)</label>
                                <input type="text" id="otherStickerBrand" name="otherStickerBrand" value={formData.otherStickerBrand || ''} onChange={handleChange} required />
                                {errors.otherStickerBrand && <p className="error-message">{errors.otherStickerBrand}</p>}
                            </div>
                        )}

                        <CustomizationRadioGroup name="bag" label="Bag Type" options={options.bag} selectedValue={formData.bag} onChange={handleChange} error={errors.bag} />

                        <button type="submit" className="btn submit-customization">Submit Customization</button>
                    </form>
                )}
            </div>
        </section>
    );
});


const About = memo(() => (
    <section id="about">
        <div className="container">
            <h2 className="section-title">About Wular Sports</h2>
            <p>Wular Sports is committed to crafting high-performance cricket bats for every game – whether you're playing with a leather ball or smashing shots with a tennis ball. Proudly made in Kashmir, our bats are a symbol of quality and power, designed for champions.</p>
            <div className="location-box">
                <i className="fas fa-map-marker-alt" aria-hidden="true"></i>
                <span>Srinagar, Jammu and Kashmir, India</span>
            </div>
        </div>
    </section>
));

const Contact = memo(() => (
    <section id="contact"><div className="container"><h2 className="section-title">Get In Touch</h2><p>Have questions? Reach out to us directly!</p><a href={createWhatsAppLink("Hello, I have a question.")} target="_blank" rel="noopener noreferrer" className="btn">Chat on WhatsApp</a><div className="social-icons"><a href={INSTAGRAM_LINK} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><i className="fab fa-instagram"></i></a><a href={YOUTUBE_LINK} target="_blank" rel="noopener noreferrer" aria-label="YouTube"><i className="fab fa-youtube"></i></a></div><div className="contact-email"><p>or email us at: <a href="mailto:wularsports@gmail.com">wularsports@gmail.com</a></p></div></div></section>
));

const Footer: FC<FooterProps> = memo(({ onNavigate }) => (
    <footer className="footer">
        <div className="container">
            <div className="footer-links">
                <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('privacy'); }}>Privacy Policy</a> | 
                <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('return'); }}>Return Policy</a> | 
                <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('terms'); }}>Terms & Conditions</a>
            </div>
            <p className="footer-copyright">© 2025 Wular Sports. All rights reserved.</p>
        </div>
    </footer>
));

const FloatingButtons = memo(() => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className={`fab-container ${isOpen ? 'open' : ''}`}>
            <div className="fab-options">
                <a href={createWhatsAppLink('Hello!')} target="_blank" rel="noopener noreferrer" className="fab-option" aria-label="WhatsApp"><i className="fab fa-whatsapp"></i></a>
                <a href={YOUTUBE_LINK} target="_blank" rel="noopener noreferrer" className="fab-option" aria-label="YouTube"><i className="fab fa-youtube"></i></a>
                <a href={INSTAGRAM_LINK} target="_blank" rel="noopener noreferrer" className="fab-option" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
            </div>
            <button className="fab-main" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle contact options" aria-expanded={isOpen}><i className={`fas ${isOpen ? 'fa-times' : 'fa-comment-dots'}`}></i></button>
        </div>
    );
});

const FloatingCallButton = memo(() => (
    <a href="tel:+919320622451" className="fab-call" aria-label="Call us">
        <i className="fas fa-phone"></i>
    </a>
));


// --- View Components ---

const VideoModal: FC<VideoModalProps> = ({ videoUrl, onClose }) => {
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

const HomeView: FC<{
    onShopCollectionClick: () => void;
    onAddToCart: (product: ProductFull, size: string | null) => void;
    onImageClick: (images: string[], startIndex: number) => void;
    onWatchVideo: (url: string, ref: React.RefObject<HTMLButtonElement>) => void;
}> = ({ onShopCollectionClick, onAddToCart, onImageClick, onWatchVideo }) => {
    const catalogRef = useRef<HTMLElement>(null);
    return (
        <main>
            <Hero onShopCollectionClick={onShopCollectionClick} />
            <Catalog ref={catalogRef} onAddToCart={onAddToCart} onImageClick={onImageClick} onWatchVideo={onWatchVideo} />
            <Customization />
            <About />
            <Contact />
        </main>
    );
};

const CollectionView: FC<{ 
    products: ProductFull[]; 
    onImageClick: (images: string[], startIndex: number) => void;
    onAddToCart: (product: ProductFull, size: string | null) => void;
    onWatchVideo: (url: string, ref: React.RefObject<HTMLButtonElement>) => void;
}> = ({ products, onImageClick, onAddToCart, onWatchVideo }) => {
    const categories = {
        "Hard Tennis Bats": products.filter(p => p.category.includes("Hard Tennis")),
        "Soft Tennis Bats": products.filter(p => p.category.includes("Soft Tennis")),
        "Leather Bat Collection": products.filter(p => p.category.includes("Leather Ball")),
    };
    
    return (
        <div className="view collection-view">
            <section>
                <div className="container">
                    <h2 className="section-title">Our Collection</h2>
                    <div className="collection-categories">
                        {Object.entries(categories).map(([title, productsInCategory]) => (
                            productsInCategory.length > 0 && (
                                <div key={title} className="collection-category">
                                    <h3 className="collection-category-title">{title}</h3>
                                    <div className="collection-grid">
                                        {productsInCategory.map(product => (
                                            <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} onImageClick={onImageClick} onWatchVideo={onWatchVideo} />
                                        ))}
                                    </div>
                                </div>
                            )
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

const PrivacyPolicyView = () => (
    <div className="view policy-view">
        <h2 className="section-title">Privacy Policy</h2>
        <p><strong>Effective Date:</strong> 17/07/2025</p>
        <p>At Wular Sports, your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your personal information when you use our website.</p>
        <h3>Information We Collect:</h3>
        <ul>
            <li>Name, phone number, address, and other order-related information</li>
            <li>Payment details (only processed via secure third-party gateways like Razorpay)</li>
            <li>Browsing behavior and analytics (for site improvement)</li>
        </ul>
        <h3>How We Use It:</h3>
        <ul>
            <li>To process orders and deliver products</li>
            <li>For customer service and support</li>
            <li>To improve user experience and website functionality</li>
            <li>For promotional emails or WhatsApp messages (only if opted-in)</li>
        </ul>
        <h3>Data Security:</h3>
        <p>We implement strict measures to secure your data and never share your information with unauthorized third parties.</p>
        <h3>Third-Party Services:</h3>
        <p>We use trusted services like Razorpay for payment processing and WhatsApp for order communication. These services have their own privacy policies.</p>
        <h3>Your Rights:</h3>
        <p>You may request access, correction, or deletion of your personal data at any time.</p>
    </div>
);

const ReturnPolicyView = () => (
    <div className="view policy-view">
        <h2 className="section-title">Return Policy</h2>
        <p><strong>Effective Date:</strong> 17/07/2025</p>
        <p>We at Wular Sports aim to provide high-quality cricket bats and gear. However, if you're not satisfied, here's our return policy:</p>
        <h3>Return Eligibility:</h3>
        <ul>
            <li>Return requests must be raised within 3 days of delivery.</li>
            <li>Product must be unused, in original condition, and with all tags and packaging intact.</li>
            <li>Customized bats (name engraved or special finishes) cannot be returned unless damaged or defective.</li>
        </ul>
        <h3>Refund Process:</h3>
        <ul>
            <li>Once the return is approved and product is received, refund will be initiated within 5–7 business days.</li>
            <li>Refunds will be made to the original payment method or UPI account as applicable.</li>
            <li>Shipping and handling charges are non-refundable.</li>
        </ul>
        <h3>Damaged Products:</h3>
        <p>If the product is damaged during delivery, please contact us immediately with photos, and we will replace or refund as per the case.</p>
        <h3>How to Initiate a Return:</h3>
        <p>Contact us via WhatsApp or email with Tracking ID and reason for return.</p>
    </div>
);

const TermsAndConditionsView = () => (
    <div className="view policy-view">
        <h2 className="section-title">Terms and Conditions</h2>
        <p><strong>Effective Date:</strong> 17/07/2025</p>
        <p>By accessing and using Wular Sports, you agree to the following terms:</p>
        <h3>1. Use of Website:</h3>
        <p>You must be at least 18 years old or have parental supervision to use our site and make purchases.</p>
        <h3>2. Product Accuracy:</h3>
        <p>We strive to display accurate descriptions and images. However, natural wood variations may cause slight differences in actual bats.</p>
        <h3>3. Pricing:</h3>
        <p>All prices are listed in INR. We reserve the right to change prices without prior notice.</p>
        <h3>4. Orders & Payment:</h3>
        <p>Orders are confirmed only after full or partial payment is made. We reserve the right to cancel any order due to unforeseen issues like stock unavailability or payment problems.</p>
        <h3>5. Intellectual Property:</h3>
        <p>All content, including logos, images, and product descriptions, belongs to Wular Sports and cannot be copied or reused without permission.</p>
        <h3>6. Limitation of Liability:</h3>
        <p>We are not liable for any indirect or incidental damages arising from use of the website or products.</p>
        <h3>7. Governing Law:</h3>
        <p>These terms are governed by the laws of India, and any disputes shall be settled under the jurisdiction of Srinagar.</p>
    </div>
);


// --- Main App Component ---
const App = () => {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [toast, setToast] = useState({ message: '', isVisible: false });
    const [lightboxGallery, setLightboxGallery] = useState<{images: string[], startIndex: number} | null>(null);
    const [videoModalUrl, setVideoModalUrl] = useState<string | null>(null);
    const [videoTriggerRef, setVideoTriggerRef] = useState<React.RefObject<HTMLButtonElement> | null>(null);
    const [activeView, setActiveView] = useState<View>('home');
    const toastTimeoutRef = useRef<number | null>(null);
    
    const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
    const cartItemCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

    // Effect to lock body scroll when a sidebar or modal is open
    useEffect(() => {
        const body = document.body;
        if (isCartOpen || isCheckoutOpen || lightboxGallery || videoModalUrl) {
            body.classList.add('body-no-scroll');
        } else {
            body.classList.remove('body-no-scroll');
        }

        return () => {
            body.classList.remove('body-no-scroll');
        };
    }, [isCartOpen, isCheckoutOpen, lightboxGallery, videoModalUrl]);

    const showToast = (message: string) => {
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        setToast({ message, isVisible: true });
        toastTimeoutRef.current = window.setTimeout(() => { setToast({ message: '', isVisible: false }); }, 4000);
    };

    const handleAddToCart = (product: ProductFull, size: string | null) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id && item.size === size);
            if (existingItem) {
                return prevCart.map(item =>
                    item.id === product.id && item.size === size ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prevCart, { ...product, quantity: 1, size: size || undefined }];
        });
        setIsCartOpen(true);
        const sizeText = size ? ` (${size})` : '';
        showToast(`${product.name}${sizeText} added to cart!`);
    };

    const handleUpdateQuantity = (productId: string, quantity: number, size?: string) => {
        if (quantity < 1) return;
        setCart(prevCart => prevCart.map(item => 
            item.id === productId && item.size === size ? { ...item, quantity } : item
        ));
    };

    const handleRemoveItem = (productId: string, size?: string) => { 
        setCart(prevCart => prevCart.filter(item => !(item.id === productId && item.size === size))); 
    };
    const handleCheckout = () => { setIsCartOpen(false); setIsCheckoutOpen(true); };
    const handleBackToCart = () => { setIsCheckoutOpen(false); setIsCartOpen(true); };
    
    const handleLightboxOpen = (images: string[], startIndex: number) => {
        setLightboxGallery({ images, startIndex });
    };

    const handleLightboxClose = useCallback(() => {
        setLightboxGallery(null);
    }, []);


    const handleWatchVideo = (url: string, ref: React.RefObject<HTMLButtonElement>) => {
        setVideoModalUrl(url);
        setVideoTriggerRef(ref);
    };

    const handleCloseVideoModal = () => {
        setVideoModalUrl(null);
        if (videoTriggerRef?.current) {
            videoTriggerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        setVideoTriggerRef(null);
    };
    
    const handlePlaceOrder = (customerDetails: CustomerDetails, paymentMethod: PaymentMethod) => {
        const productSummary = cart.map(item => `- ${item.name}${item.size ? ` (${item.size})` : ''} (x${item.quantity})`).join('\n');
        const advanceAmount = cartItemCount * 300;

        const customerInfo = [
            `👤 *Name:* ${customerDetails.fullName}`,
            customerDetails.email ? `✉️ *Email:* ${customerDetails.email}` : null,
            `📞 *Phone:* +91${customerDetails.phone}`,
            `📍 *Address:* ${customerDetails.address}, ${customerDetails.city}, ${customerDetails.state} - ${customerDetails.pinCode}`,
            customerDetails.landmark ? `🏠 *Landmark:* ${customerDetails.landmark}` : null
        ].filter(Boolean).join('\n');

        let paymentDetailsText = '';
        if (paymentMethod === 'full') {
            paymentDetailsText = `
*Payment Method:* Full Payment
*Total Amount:* ₹${cartTotal.toLocaleString('en-IN')}

_This total amount includes no additional charges—full online payments are free from COD convenience fees._
            `.trim().replace(/^\s+/gm, '');
        } else {
            const remainingAmount = cartTotal - advanceAmount;
            const codFee = Math.round(remainingAmount * 0.05);
            const totalOnDelivery = remainingAmount + codFee;

            paymentDetailsText = `
*Payment Method:* Partial (Advance + COD)
*Advance to Pay:* ₹${advanceAmount.toLocaleString('en-IN')}

---
*Amount Due on Delivery*
---
Remaining Amount: ₹${remainingAmount.toLocaleString('en-IN')}
+ 5% COD Convenience Fee: ₹${codFee.toLocaleString('en-IN')}
---------------------------------
*Total to Pay at Delivery: ₹${totalOnDelivery.toLocaleString('en-IN')}*

⚠️ *Important Note:* The 5% COD convenience fee goes directly to the delivery service provider (e.g., India Post, DTDC) and **not to Wular Sports**.
✅ _If you pay the entire amount online in advance, this extra 5% fee does NOT apply._
            `.trim().replace(/^\s+/gm, '');
        }

        const message = `
✨ *New Order from Wular Sports Website* ✨

---
*Customer Details*
---
${customerInfo}

---
*Order Summary*
---
${productSummary}

---
*Payment Information*
---
${paymentDetailsText}

Please confirm my order and provide payment instructions. Thank you!
        `.trim().replace(/^\s+/gm, '');

        const whatsappUrl = createWhatsAppLink(message);
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

        showToast("Confirm your order on WhatsApp!");
        setCart([]);
        setIsCheckoutOpen(false);
    };

    const handleNavigate = (view: View) => {
        setActiveView(view);
        window.scrollTo(0, 0);
    };

    return (
        <>
            <Lightbox gallery={lightboxGallery} onClose={handleLightboxClose} />
            <VideoModal videoUrl={videoModalUrl} onClose={handleCloseVideoModal} />
            <Toast message={toast.message} isVisible={toast.isVisible} />
            <Header onCartClick={() => setIsCartOpen(true)} cartItemCount={cartItemCount} onNavigate={handleNavigate} />
            
            <div className="view-container">
              {activeView === 'home' && (
                  <HomeView 
                      onShopCollectionClick={() => handleNavigate('collection')}
                      onAddToCart={handleAddToCart}
                      onImageClick={handleLightboxOpen}
                      onWatchVideo={handleWatchVideo}
                  />
              )}
              {activeView === 'collection' && <CollectionView products={products} onImageClick={handleLightboxOpen} onAddToCart={handleAddToCart} onWatchVideo={handleWatchVideo} />}
              {activeView === 'privacy' && <PrivacyPolicyView />}
              {activeView === 'return' && <ReturnPolicyView />}
              {activeView === 'terms' && <TermsAndConditionsView />}
            </div>

            <Footer onNavigate={handleNavigate} />
            <FloatingButtons />
            <FloatingCallButton />

            <CartSidebar 
                isOpen={isCartOpen} 
                onClose={() => setIsCartOpen(false)} 
                cart={cart} 
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onCheckout={handleCheckout}
                total={cartTotal}
            />
            <CheckoutSidebar
                isOpen={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
                onBack={handleBackToCart}
                onPlaceOrder={handlePlaceOrder}
                total={cartTotal}
                cartItemCount={cartItemCount}
            />
        </>
    );
};

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}