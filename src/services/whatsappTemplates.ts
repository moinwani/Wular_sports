import { Customer, firstName, toDate } from './customers';

/**
 * Pre-written WhatsApp messages for reaching customers from the admin panel.
 * Each template is personalised from the customer's own history.
 */

export interface WaTemplate {
    id: string;
    label: string;
    /** Who this template suits — used to suggest a default */
    suits: (c: Customer) => boolean;
    build: (c: Customer) => string;
}

const lastProduct = (c: Customer) => c.products[0] || 'bat';

/** An order in one of these statuses placed within `days` days */
const hasRecentOrder = (c: Customer, statuses: string[], days: number) =>
    c.orders.some(o => statuses.includes(o.status) &&
        Date.now() - (toDate(o.createdAt)?.getTime() || 0) <= days * 86400000);
const productIdOfLastOrder = (c: Customer) => {
    const o = c.orders.find(x => x.items?.length);
    return o?.items?.[0]?.productId || '';
};

export const WA_TEMPLATES: WaTemplate[] = [
    {
        id: 'checkout_recovery',
        label: 'Finish your order',
        suits: c => c.paidOrders === 0 && (!!c.lead || c.unfinishedCheckouts > 0),
        build: c => {
            const cart = c.lead?.cartSummary || c.orders.find(o => o.status === 'pending')?.items?.map((i: any) => i.productName).join(', ') || 'your bat';
            return `Hi ${firstName(c.name)}! This is Wular Sports 🏏\n\n` +
                `I noticed you were checking out ${cart} but the order didn't go through. ` +
                `Can I help with anything — size, delivery time, or payment? ` +
                `You can also order directly here on WhatsApp.`;
        },
    },
    {
        id: 'thank_you',
        label: 'Thank you / check-in',
        suits: c => c.paidOrders > 0 && (c.daysSinceLastOrder ?? 999) <= 21,
        build: c => `Hi ${firstName(c.name)}! Thank you for choosing Wular Sports 🙏\n\n` +
            `How is your ${lastProduct(c)} playing? If you need anything — oiling tips, knocking-in advice — just message us here.`,
    },
    {
        id: 'order_update',
        label: 'Order being packed',
        suits: c => hasRecentOrder(c, ['confirmed', 'processing'], 30),
        build: c => `Hi ${firstName(c.name)}! Wular Sports here 🏏\n\n` +
            `Your order is confirmed and your ${lastProduct(c)} is being knocked-in and packed. ` +
            `We'll share the tracking details as soon as it ships. Any questions, just reply here!`,
    },
    {
        id: 'review_request',
        label: 'Ask for a review',
        suits: c => hasRecentOrder(c, ['delivered', 'shipped'], 120),
        build: c => `Hi ${firstName(c.name)}! This is Wular Sports 🏏\n\n` +
            `Hope you're loving your ${lastProduct(c)}! Would you take 30 seconds to rate it? ` +
            `It really helps our small Kashmiri workshop:\n\n` +
            `https://wularsports.com/review${productIdOfLastOrder(c) ? `?product=${productIdOfLastOrder(c)}` : ''}\n\nThank you! 🙏`,
    },
    {
        id: 'win_back',
        label: 'Win-back offer',
        suits: c => c.atRisk,
        build: c => `Hi ${firstName(c.name)}! It's been a while 🏏\n\n` +
            `As one of our valued customers, here's ₹100 off per bat on your next order with code WELCOME100. ` +
            `New season Kashmiri willow is in — want me to send you photos of what's available?`,
    },
    {
        id: 'new_arrivals',
        label: 'New stock / launch',
        suits: c => c.paidOrders > 0,
        build: c => `Hi ${firstName(c.name)}! Wular Sports here 🏏\n\n` +
            `Fresh Kashmiri willow stock just landed — Legacy Edition 2.0, Bahubali and AK-47 Honeycomb. ` +
            `Limited pieces this batch. Want me to share photos and weights?\n\nhttps://wularsports.com`,
    },
    {
        id: 'wholesale',
        label: 'Wholesale / bulk order',
        suits: c => c.segment === 'Wholesale',
        build: c => `Hi ${firstName(c.name)}! Wular Sports here 🏏\n\n` +
            `New batch of Kashmiri willow is ready. As a bulk partner you get priority pick and wholesale pricing. ` +
            `How many pieces should I keep aside for you this month?`,
    },
    {
        id: 'referral',
        label: 'Refer a teammate',
        suits: c => c.paidOrders > 0 && (c.segment === 'VIP' || c.segment === 'Repeat'),
        build: c => `Hi ${firstName(c.name)}! Thanks for being a regular at Wular Sports 🙌\n\n` +
            `If your teammates need a bat, send them our way — they get ₹100 off per bat with code WELCOME100, ` +
            `and we'll look after you on your next order too.\n\nhttps://wularsports.com`,
    },
];

/** Which template to suggest first, most specific situation wins */
const DEFAULT_PRIORITY = [
    'checkout_recovery', 'order_update', 'wholesale', 'thank_you',
    'win_back', 'review_request', 'referral', 'new_arrivals',
];

export const defaultTemplateFor = (c: Customer): WaTemplate =>
    DEFAULT_PRIORITY.map(templateById).find(t => t && t.suits(c)) || templateById('new_arrivals')!;

export const templateById = (id: string) => WA_TEMPLATES.find(t => t.id === id);
