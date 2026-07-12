import { WHATSAPP_NUMBER } from '../data/constants';

/**
 * A stable, anonymous reference code for this visitor (e.g. "WS-4X7KQ2").
 * It is embedded in every WhatsApp message the site pre-fills, and saved on
 * the visitor's lead record — so when a WhatsApp chat turns into a sale, the
 * admin can find the matching lead by its Ref code and mark it sold.
 */
export const getVisitorRef = (): string => {
    if (typeof window === 'undefined') return '';
    try {
        let ref = localStorage.getItem('ws_visitor_ref');
        if (!ref) {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            let code = '';
            for (let i = 0; i < 6; i++) {
                code += chars[Math.floor(Math.random() * chars.length)];
            }
            ref = `WS-${code}`;
            localStorage.setItem('ws_visitor_ref', ref);
        }
        return ref;
    } catch {
        return '';
    }
};

export const createWhatsAppLink = (message: string) => {
    const ref = getVisitorRef();
    const fullMessage = ref ? `${message}\n\n(Ref: ${ref})` : message;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(fullMessage)}`;
};

export const getSpecIcon = (specText: string): string => {
    const text = specText.toLowerCase();
    if (text.includes('weight')) return 'fa-weight-hanging';
    if (text.includes('edge') || text.includes('thickness')) return 'fa-ruler-combined';
    if (text.includes('height') || text.includes('inch')) return 'fa-ruler-vertical';
    if (text.includes('face') || text.includes('width')) return 'fa-expand';
    if (text.includes('handle') || text.includes('grip')) return 'fa-grip-lines';
    if (text.includes('delivery') || text.includes('shipping')) return 'fa-truck-fast';
    if (text.includes('bag')) return 'fa-suitcase';
    if (text.includes('toe guard')) return 'fa-shield-alt';
    if (text.includes('knocked') || text.includes('oiled')) return 'fa-gavel';
    if (text.includes('willow') || text.includes('wood')) return 'fa-tree';
    if (text.includes('grain')) return 'fa-fingerprint';
    return 'fa-check-circle';
};
