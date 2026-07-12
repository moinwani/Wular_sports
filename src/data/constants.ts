export const WHATSAPP_NUMBER = '919320622451';

// The store owner's email — the only account allowed into /admin.
// Enforced both in the UI (AdminRoute) and in Firestore security rules.
export const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'moinwani91@gmail.com';

export const CATEGORY_SLUGS: Record<string, string> = {
    'Hard Tennis': 'hard-tennis-bats',
    'Soft Tennis': 'soft-tennis-bats',
    'Leather Ball': 'leather-cricket-bats',
};
export const INSTAGRAM_LINK = "https://www.instagram.com/wular.sports?igsh=MXV5MjNyZGplYXh6aQ%3D%3D&utm_source=qr";
export const YOUTUBE_LINK = "https://youtube.com/@wularsports?si=56ACjfcWinQRjcVg";

export const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
    "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
    "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
    "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
    "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands",
    "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi",
    "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];
