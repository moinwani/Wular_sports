
export type View = 'home' | 'collection' | 'hard-tennis' | 'soft-tennis' | 'leather-bats' | 'privacy' | 'return' | 'terms' | 'blog' | 'blog-post' | 'about';
export type PaymentMethod = 'full' | 'cod';

export interface BlogPost {
    id: string;
    title: string;
    description: string;
    content: string;
    author: string;
    date: string;
    image: string;
    category: string;
    readTime: string;
    faq?: { question: string; answer: string }[];
}

export interface ProductFull {
    id: string;
    sku?: string;
    name: string;
    /** Category names, e.g. ['Hard Tennis'] — managed in Admin → Products */
    category: string[];
    description: string;
    image: string | string[];
    price: number;
    originalPrice: number;
    specs: string[];
    aggregateRating?: {
        ratingValue: string;
        reviewCount: number;
        bestRating: number;
        worstRating: number;
    };
    reviewLink?: string;
    videoUrl?: string;
    /** Sizes the customer picks from; one size = added automatically, empty = no size */
    sizes?: string[];
    /** Hidden products stay in the admin panel but not on the website */
    hidden?: boolean;
    /** Position in lists (lower first) */
    order?: number;
}

export interface CartItem extends ProductFull {
    quantity: number;
    size?: string;
}

export interface CustomerDetails {
    fullName: string;
    email: string;
    phone: string;
    pinCode: string;
    city: string;
    state: string;
    address: string;
    landmark: string;
}

export interface Testimonial {
    id: number;
    url: string;
    thumbnail?: string;
    name: string;
    comment: string;
    rating: number;
    productId: string;
    isRepeatCustomer?: boolean;
}
