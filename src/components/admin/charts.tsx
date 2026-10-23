import { FC, useState } from 'react';

/**
 * Small, dependency-free chart pieces for the admin panel (dark surface).
 * Colours are validated for the #141414 surface: --viz-1 amber, --viz-2 blue.
 * Marks follow fixed specs: ≤24px bars, 4px rounded data-end, 2px gaps,
 * hairline gridlines, values in text colours, hover + keyboard tooltips.
 */

const niceMax = (max: number) => {
    if (max <= 0) return 1;
    const pow = 10 ** Math.floor(Math.log10(max));
    const n = max / pow;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * pow;
};

/* ───────────── Column chart (one series over time) ───────────── */

export interface ColumnDatum { label: string; tooltipLabel: string; value: number; detail?: string; }

interface ColumnChartProps {
    data: ColumnDatum[];
    format: (n: number) => string;
    axisFormat: (n: number) => string;
    ariaLabel: string;
    valueName: string;
}

export const ColumnChart: FC<ColumnChartProps> = ({ data, format, axisFormat, ariaLabel, valueName }) => {
    const [hover, setHover] = useState<number | null>(null);
    const [asTable, setAsTable] = useState(false);
    const max = niceMax(Math.max(0, ...data.map(d => d.value)));
    const ticks = [max, max / 2, 0];
    const every = Math.max(1, Math.ceil(data.length / 8));
    const h = hover != null ? data[hover] : null;

    return (
        <div className="viz">
            <div className="viz__toolbar">
                <button className="crm-linkbtn" onClick={() => setAsTable(v => !v)} aria-pressed={asTable}>
                    {asTable ? 'Show chart' : 'Show table'}
                </button>
            </div>
            {asTable ? (
                <div className="viz__table scroll">
                    <table className="admin-table">
                        <thead><tr><th>Period</th><th className="num">{valueName}</th><th>Details</th></tr></thead>
                        <tbody>
                            {data.map(d => (
                                <tr key={d.tooltipLabel}><td>{d.tooltipLabel}</td><td className="num">{format(d.value)}</td><td>{d.detail}</td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="viz-col" role="group" aria-label={ariaLabel}>
                    <div className="viz-col__axis" aria-hidden="true">
                        {ticks.map(t => <span key={t}>{axisFormat(t)}</span>)}
                    </div>
                    <div className="viz-col__plot">
                        {ticks.map((t, i) => <div key={t} className="viz-col__grid" style={{ top: `${(i / 2) * 100}%` }} aria-hidden="true" />)}
                        <div className="viz-col__bars">
                            {data.map((d, i) => (
                                <button
                                    key={`${d.tooltipLabel}-${i}`}
                                    className={`viz-col__slot ${hover === i ? 'is-hover' : ''}`}
                                    onMouseEnter={() => setHover(i)}
                                    onMouseLeave={() => setHover(null)}
                                    onFocus={() => setHover(i)}
                                    onBlur={() => setHover(null)}
                                    aria-label={`${d.tooltipLabel}: ${format(d.value)}${d.detail ? `, ${d.detail}` : ''}`}
                                >
                                    <span className="viz-col__bar" style={{ height: `${(d.value / max) * 100}%` }} />
                                </button>
                            ))}
                        </div>
                        {h && hover != null && (
                            <div
                                className="viz-tip"
                                style={{
                                    left: `${((hover + 0.5) / data.length) * 100}%`,
                                    bottom: `calc(${(h.value / max) * 100}% + 10px)`,
                                }}
                                role="status"
                            >
                                <strong>{format(h.value)}</strong>
                                <span>{h.tooltipLabel}</span>
                                {h.detail && <span>{h.detail}</span>}
                            </div>
                        )}
                    </div>
                    <div className="viz-col__labels" aria-hidden="true">
                        {data.map((d, i) => (
                            <span key={`${d.label}-${i}`}>{i % every === 0 || i === data.length - 1 ? d.label : ''}</span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

/* ───────────── Ranked horizontal bars ───────────── */

export interface BarListRow { label: string; value: number; sub?: string; }

export const BarList: FC<{ rows: BarListRow[]; format: (n: number) => string; ariaLabel: string }> = ({ rows, format, ariaLabel }) => {
    const max = Math.max(1, ...rows.map(r => r.value));
    if (!rows.length) return <p className="an-empty">No sales in this period.</p>;
    return (
        <ul className="viz-bars" aria-label={ariaLabel}>
            {rows.map(r => (
                <li key={r.label} title={`${r.label}: ${format(r.value)}${r.sub ? ` · ${r.sub}` : ''}`}>
                    <span className="viz-bars__label">{r.label}</span>
                    <span className="viz-bars__track">
                        <span className="viz-bars__bar" style={{ width: `${Math.max((r.value / max) * 100, 1.5)}%` }} />
                    </span>
                    <span className="viz-bars__value">{format(r.value)}{r.sub && <small>{r.sub}</small>}</span>
                </li>
            ))}
        </ul>
    );
};

/* ───────────── Two-part split (part-to-whole) ───────────── */

export interface SplitDatum { label: string; value: number; count: number; }

export const SplitBar: FC<{ title: string; parts: [SplitDatum, SplitDatum]; format: (n: number) => string; countName: string }> = ({ title, parts, format, countName }) => {
    const total = parts[0].value + parts[1].value;
    const pct = (v: number) => (total > 0 ? Math.round((v / total) * 100) : 0);
    return (
        <div className="viz-split">
            <h3>{title}</h3>
            {total === 0 ? <p className="an-empty">No sales in this period.</p> : (
                <>
                    <div className="viz-split__bar" role="img" aria-label={`${parts[0].label} ${pct(parts[0].value)}%, ${parts[1].label} ${pct(parts[1].value)}%`}>
                        {parts.map((p, i) => p.value > 0 && (
                            <span
                                key={p.label}
                                className={`viz-split__seg viz-split__seg--${i + 1}`}
                                style={{ flexGrow: p.value }}
                                title={`${p.label}: ${format(p.value)} (${pct(p.value)}%) · ${p.count} ${countName}`}
                            />
                        ))}
                    </div>
                    <ul className="viz-legend">
                        {parts.map((p, i) => (
                            <li key={p.label}>
                                <span className={`viz-legend__key viz-legend__key--${i + 1}`} aria-hidden="true" />
                                <span className="viz-legend__label">{p.label}</span>
                                <strong>{pct(p.value)}%</strong>
                                <span className="viz-legend__sub">{format(p.value)} · {p.count} {countName}</span>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    );
};
