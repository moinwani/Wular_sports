import { FC } from 'react';

export const PrivacyPolicyView: FC = () => (
    <div className="view policy-view">
        <div className="container">
            <h2 className="section-title">Privacy Policy</h2>
            <div className="policy-content">
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
        </div>
    </div>
);

export const ReturnPolicyView: FC = () => (
    <div className="view policy-view">
        <div className="container">
            <h2 className="section-title">Return Policy</h2>
            <div className="policy-content">
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
        </div>
    </div>
);

export const TermsAndConditionsView: FC = () => (
    <div className="view policy-view">
        <div className="container">
            <h2 className="section-title">Terms and Conditions</h2>
            <div className="policy-content">
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
        </div>
    </div>
);
