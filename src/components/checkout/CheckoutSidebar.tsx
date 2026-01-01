import React, { FC, memo, useState, useRef, useMemo, ChangeEvent, FormEvent, useEffect } from 'react';
import { Sidebar } from '../common/Sidebar';
import { CustomerDetails, PaymentMethod } from '../../types';
import { INDIAN_STATES } from '../../data/constants';

export interface CheckoutSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onBack: () => void;
    onPlaceOrder: (details: CustomerDetails, paymentMethod: PaymentMethod) => void;
    total: number;
    cartItemCount: number;
}

export const CheckoutSidebar: FC<CheckoutSidebarProps> = memo(({ isOpen, onClose, onBack, onPlaceOrder, total, cartItemCount }) => {
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
                            <hr />
                            <p>Remaining Amount (on delivery): <span>₹{remainingAmount.toLocaleString('en-IN')}</span></p>
                            <p>+ 5% COD Convenience Fee: <span>₹{codConvenienceFee.toLocaleString('en-IN')}</span></p>
                            <hr />
                            <p><strong>Total Payable at Delivery:</strong> <span><strong>₹{totalPayableOnDelivery.toLocaleString('en-IN')}</strong></span></p>

                            <p className="cod-fee-note warning">
                                <i className="fas fa-info-circle"></i>
                                The 5% COD convenience fee goes directly to the delivery service provider (e.g., India Post, DTDC) and **not to Wular Sports**.
                                <br />
                                ✅ If you pay the entire amount online in advance, **this extra 5% fee does NOT apply.**
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </Sidebar>
    );
});
