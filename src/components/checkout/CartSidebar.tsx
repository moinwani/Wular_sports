import { FC, memo } from 'react';
import { Sidebar } from '../common/Sidebar';
import { CartItem } from '../../types';
import { Icon } from '../common/Icon';
import { optimizedImg } from '../../utils/optimizedImg';

export interface CartSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    cart: CartItem[];
    onUpdateQuantity: (id: string, quantity: number, size?: string) => void;
    onRemoveItem: (id: string, size?: string) => void;
    onCheckout: () => void;
    total: number;
}

export const CartSidebar: FC<CartSidebarProps> = memo(({ isOpen, onClose, cart, onUpdateQuantity, onRemoveItem, onCheckout, total }) => {
    return (
        <Sidebar title="Your Cart" isOpen={isOpen} onClose={onClose} footer={
            <>
                {cart.length > 0 && (
                    <div className="cart-cod-notice">
                        <Icon name="fa-truck-fast" />
                        <div className="cod-notice-text">
                            <strong>Cash on Delivery Available!</strong>
                            <p>Pay ₹500/bat now, the rest at your door (+5% COD fee)</p>
                        </div>
                    </div>
                )}
                <div className="cart-total"><span>Total</span><span>₹{total.toLocaleString('en-IN')}</span></div>
                <button className="btn checkout-btn" onClick={onCheckout} disabled={cart.length === 0}>Proceed to Checkout</button>
            </>
        }>
            {cart.length === 0 ? <p className="empty-cart">Your cart is empty.</p> :
                <div className="cart-items">
                    {cart.map(item => (
                        <div className="cart-item" key={`${item.id}-${item.size || 'default'}`}>
                            <img {...optimizedImg(Array.isArray(item.image) ? item.image[0] : item.image, '80px')} alt={item.name} className="cart-item-image" width={80} height={80} />
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
