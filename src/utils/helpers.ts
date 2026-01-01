import { WHATSAPP_NUMBER } from '../data/constants';

export const createWhatsAppLink = (message: string) =>
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

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
