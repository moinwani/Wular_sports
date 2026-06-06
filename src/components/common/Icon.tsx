import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon, FontAwesomeIconProps } from '@fortawesome/react-fontawesome';

import { faArrowLeft, faArrowRight, faBars, faBoxOpen, faChartLine, faCheck, faCheckCircle, faChevronDown, faChevronLeft, faChevronRight, faChevronUp, faDownload, faEnvelope, faExclamationCircle, faExternalLinkAlt, faEye, faGlobe, faInbox, faInfoCircle, faLightbulb, faLink, faLock, faMapMarkerAlt, faMoneyBillWave, faNewspaper, faPhone, faPlay, faRedoAlt, faRupeeSign, faSearch, faShieldAlt, faShippingFast, faShoppingBag, faShoppingCart, faSignOutAlt, faSpinner, faStar, faTimes, faTruckFast, faUndoAlt, faUserCircle, faUsers, faVideo } from '@fortawesome/free-solid-svg-icons';
import { faInstagram, faWhatsapp, faYoutube } from '@fortawesome/free-brands-svg-icons';
import { faCalendar, faClock } from '@fortawesome/free-regular-svg-icons';

const iconMap: Record<string, IconDefinition> = {
    'fa-arrow-left': faArrowLeft,
    'fa-arrow-right': faArrowRight,
    'fa-bars': faBars,
    'fa-box-open': faBoxOpen,
    'fa-chart-line': faChartLine,
    'fa-check': faCheck,
    'fa-check-circle': faCheckCircle,
    'fa-chevron-down': faChevronDown,
    'fa-chevron-left': faChevronLeft,
    'fa-chevron-right': faChevronRight,
    'fa-chevron-up': faChevronUp,
    'fa-download': faDownload,
    'fa-envelope': faEnvelope,
    'fa-exclamation-circle': faExclamationCircle,
    'fa-external-link-alt': faExternalLinkAlt,
    'fa-eye': faEye,
    'fa-globe': faGlobe,
    'fa-inbox': faInbox,
    'fa-info-circle': faInfoCircle,
    'fa-lightbulb': faLightbulb,
    'fa-link': faLink,
    'fa-lock': faLock,
    'fa-map-marker-alt': faMapMarkerAlt,
    'fa-money-bill-wave': faMoneyBillWave,
    'fa-newspaper': faNewspaper,
    'fa-phone': faPhone,
    'fa-play': faPlay,
    'fa-redo-alt': faRedoAlt,
    'fa-rupee-sign': faRupeeSign,
    'fa-search': faSearch,
    'fa-shield-alt': faShieldAlt,
    'fa-shipping-fast': faShippingFast,
    'fa-shopping-bag': faShoppingBag,
    'fa-shopping-cart': faShoppingCart,
    'fa-sign-out-alt': faSignOutAlt,
    'fa-spinner': faSpinner,
    'fa-star': faStar,
    'fa-times': faTimes,
    'fa-truck-fast': faTruckFast,
    'fa-undo-alt': faUndoAlt,
    'fa-user-circle': faUserCircle,
    'fa-users': faUsers,
    'fa-video': faVideo,
    'fa-instagram': faInstagram,
    'fa-whatsapp': faWhatsapp,
    'fa-youtube': faYoutube,
    'fa-calendar': faCalendar,
    'fa-clock': faClock,
};

interface IconProps extends Omit<FontAwesomeIconProps, 'icon'> {
    name: string;
}

export function Icon({ name, ...props }: IconProps) {
    const icon = iconMap[name];
    if (!icon) return null;
    return <FontAwesomeIcon icon={icon} {...props} />;
}
