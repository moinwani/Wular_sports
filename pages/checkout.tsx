import { useRouter } from 'next/router';
import { CheckoutView } from '../src/views/CheckoutView';
import { useCart } from '../src/context/CartContext';
import { cartStorage } from '../src/utils/localStorage';

export default function CheckoutPage() {
    const router = useRouter();
    const { cart, cartTotal, clearCart } = useCart();

    return (
        <CheckoutView
            cart={cart}
            total={cartTotal}
            onPlaceOrder={(orderDetails: any) => {
                clearCart();
                cartStorage.clear();
                router.push(`/order-success?id=${orderDetails.id || ''}`);
            }}
        />
    );
}
