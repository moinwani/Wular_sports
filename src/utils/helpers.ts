import { WHATSAPP_NUMBER } from '../data/constants';

export const createWhatsAppLink = (message: string) =>
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
