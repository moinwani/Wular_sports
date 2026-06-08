import { useRouter } from 'next/router';
import { CheckoutView } from '../src/views/CheckoutView';
import { useCart } from '../src/context/CartContext';
import { cartStorage } from '../src/utils/localStorage';

export default function CheckoutPage() {
    const router = useRouter();
    const { cart, cartTotal, closeCart } = useCart();

    return (
        <CheckoutView
            cart={cart}
            total={cartTotal}
            onPlaceOrder={(orderDetails: any) => {
                cartStorage.clear();
                router.push(`/order-success?id=${orderDetails.id || ''}`);
            }}
        />
    );
}
