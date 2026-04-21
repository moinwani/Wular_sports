
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
