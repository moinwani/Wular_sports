
export type View = 'home' | 'collection' | 'privacy' | 'return' | 'terms' | 'blog' | 'blog-post';
export type PaymentMethod = 'full' | 'partial' | 'cod';

export interface BlogPost {
    id: string;
    title: string;
    description: string;
    content: string; // Markdown or HTML string
    author: string;
    date: string;
    image: string;
    category: string;
    readTime: string;
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
