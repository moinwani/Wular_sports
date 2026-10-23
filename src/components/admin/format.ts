export const inr = (n: number) => '₹' + Math.round(n || 0).toLocaleString('en-IN');

/** ₹1.2L / ₹45K style for tight spaces */
export const inrShort = (n: number) => {
    const v = Math.round(n || 0);
    if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)}Cr`;
    if (v >= 100000) return `₹${(v / 100000).toFixed(2)}L`;
    if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
    return `₹${v}`;
};

export const daysAgo = (d: Date | string | null | undefined, now = Date.now()): string => {
    if (!d) return '—';
    const t = typeof d === 'string' ? new Date(d).getTime() : d.getTime();
    if (isNaN(t)) return '—';
    const days = Math.floor((now - t) / 86400000);
    if (days <= 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 30) return `${days}d ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${(days / 365).toFixed(1)}y ago`;
};

export const shortDate = (d: Date | null | undefined) =>
    d ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

/** % change from prev to cur; null when there is no baseline */
export const pctChange = (cur: number, prev: number): number | null =>
    prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null;
