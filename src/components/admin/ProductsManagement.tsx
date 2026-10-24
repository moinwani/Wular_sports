import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { fetchAdminCatalog, productAction, AdminCatalog } from '../../services/admin';
import { Category, productImages } from '../../lib/catalog';
import type { ProductFull } from '../../types';
import { ProductEditor } from './ProductEditor';
import { inr } from './format';
import { Icon } from '../common/Icon';

type View = 'products' | 'categories';

const blankCategory = (): Partial<Category> => ({ title: '', navLabel: '', name: '', description: '', bodyText: '', keywords: '', showInNav: true });

export const ProductsManagement: FC = () => {
    const [data, setData] = useState<AdminCatalog | null>(null);
    const [error, setError] = useState('');
    const [view, setView] = useState<View>('products');
    const [editing, setEditing] = useState<ProductFull | 'new' | null>(null);
    const [filter, setFilter] = useState('all');
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
    const [catForm, setCatForm] = useState<{ cat: Partial<Category>; isNew: boolean } | null>(null);

    const load = useCallback(() => {
        setError('');
        fetchAdminCatalog().then(setData).catch(e => setError(e.message || 'Could not load products'));
    }, []);
    useEffect(load, [load]);

    const products = useMemo(() => {
        const list = data?.products || [];
        if (filter === 'all') return list;
        if (filter === 'hidden') return list.filter(p => p.hidden);
        return list.filter(p => p.category.includes(filter));
    }, [data, filter]);

    if (error) {
        return (
            <div className="analytics-dash">
                <div className="management-header"><h1>Products</h1></div>
                <p className="crm-warn" role="alert">{error} <button className="crm-linkbtn" onClick={load}>Try again</button></p>
            </div>
        );
    }
    if (!data) return <div className="admin-loading"><div className="loading-spinner"></div><p>Loading products…</p></div>;

    const setProducts = (fn: (ps: ProductFull[]) => ProductFull[]) => setData(d => (d ? { ...d, products: fn(d.products), managed: true } : d));

    const moveProduct = async (id: string, dir: -1 | 1) => {
        const list = [...data.products];
        const i = list.findIndex(p => p.id === id);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= list.length) return;
        [list[i], list[j]] = [list[j], list[i]];
        const ordered = list.map((p, k) => ({ ...p, order: k + 1 }));
        setProducts(() => ordered);
        const res = await productAction('reorder', { ids: ordered.map(p => p.id) }).catch(() => ({ error: 'Could not save the new order.' }));
        if (res.error) { setMsg({ ok: false, text: res.error }); load(); }
    };

    const toggleHidden = async (p: ProductFull) => {
        setBusy(true);
        const res = await productAction('saveProduct', { isNew: false, product: { ...p, hidden: !p.hidden } }).catch(() => ({ error: 'Could not save.' }));
        setBusy(false);
        if (res.error) return setMsg({ ok: false, text: res.error });
        setProducts(ps => ps.map(x => (x.id === p.id ? res.product : x)));
        setMsg({ ok: true, text: `${p.name.split(' — ')[0]} is now ${p.hidden ? 'on the website' : 'hidden'}` });
    };

    const saveCategory = async () => {
        if (!catForm) return;
        setBusy(true);
        const res = await productAction('saveCategory', { isNew: catForm.isNew, category: catForm.cat }).catch(() => ({ error: 'Could not save.' }));
        setBusy(false);
        if (res.error) return setMsg({ ok: false, text: res.error });
        const saved = res.category as Category;
        const old = data.categories.find(c => c.id === saved.id);
        setData(d => d ? {
            ...d,
            managed: true,
            categories: [...d.categories.filter(c => c.id !== saved.id), saved].sort((a, b) => a.order - b.order),
            // A rename moves its products along
            products: old && old.name !== saved.name ? d.products.map(p => ({ ...p, category: p.category.map(n => (n === old.name ? saved.name : n)) })) : d.products,
        } : d);
        setCatForm(null);
        setMsg({ ok: true, text: `Saved “${saved.title}” — ${saved.showInNav ? 'it’s in the menu' : 'hidden from the menu'}` });
    };

    const deleteCategory = async (c: Category) => {
        if (!confirm(`Delete the “${c.title}” category?`)) return;
        setBusy(true);
        const res = await productAction('deleteCategory', { id: c.id }).catch(() => ({ error: 'Could not delete.' }));
        setBusy(false);
        if (res.error) return setMsg({ ok: false, text: res.error });
        setData(d => d ? { ...d, categories: d.categories.filter(x => x.id !== c.id) } : d);
        setMsg({ ok: true, text: `Deleted “${c.title}”` });
    };

    const count = (c: Category) => data.products.filter(p => p.category.includes(c.name)).length;

    return (
        <div className="analytics-dash">
            <div className="management-header">
                <h1>Products</h1>
                <p className="order-count">{data.products.length} products · {data.categories.length} categories — changes go live on the website within seconds</p>
                <button className="btn" onClick={() => { setView('products'); setEditing('new'); }}><Icon name="fa-plus" /> Add product</button>
            </div>

            {!data.managed && (
                <div className="mk-callout">
                    <Icon name="fa-info-circle" />
                    <p>These are your current website products. Your first change copies them into the admin panel — from then on, everything about your products is edited here.</p>
                </div>
            )}
            {!data.photosReady && (
                <p className="crm-warn">Photo uploads need Vercel Blob storage switched on for the project. Until then you can reorder or remove photos and paste photo links.</p>
            )}
            {msg && <p className={msg.ok ? 'crm-ok' : 'crm-warn'} role="status">{msg.text}</p>}

            <div className="mk-tabs" role="tablist" aria-label="Products sections">
                <button role="tab" aria-selected={view === 'products'} className={`mk-tab ${view === 'products' ? 'active' : ''}`} onClick={() => setView('products')}>Products</button>
                <button role="tab" aria-selected={view === 'categories'} className={`mk-tab ${view === 'categories' ? 'active' : ''}`} onClick={() => setView('categories')}>Categories</button>
            </div>

            {view === 'products' ? (
                <>
                    <div className="crm-chips" role="radiogroup" aria-label="Filter products">
                        {[{ id: 'all', label: `All ${data.products.length}` }, ...data.categories.map(c => ({ id: c.name, label: `${c.title} ${count(c)}` })), { id: 'hidden', label: `Hidden ${data.products.filter(p => p.hidden).length}` }].map(f => (
                            <button key={f.id} role="radio" aria-checked={filter === f.id} className={`crm-chip ${filter === f.id ? 'active' : ''}`} onClick={() => setFilter(f.id)}>{f.label}</button>
                        ))}
                    </div>
                    <ul className="pm-list">
                        {products.map(p => {
                            const img = productImages(p)[0];
                            const pos = data.products.findIndex(x => x.id === p.id);
                            return (
                                <li key={p.id} className={`pm-item ${p.hidden ? 'is-hidden' : ''}`}>
                                    <button className="pm-thumb" onClick={() => setEditing(p)} aria-label={`Edit ${p.name}`}>
                                        {img ? <img src={img} alt="" loading="lazy" /> : <Icon name="fa-box-open" />}
                                    </button>
                                    <div className="pm-info">
                                        <strong>{p.name.split(' — ')[0]}</strong>
                                        <span className="pm-price">{inr(p.price)}{p.originalPrice > p.price && <s>{inr(p.originalPrice)}</s>}</span>
                                        <span className="crm-muted">
                                            {p.category.join(', ')} · {productImages(p).length} photo{productImages(p).length === 1 ? '' : 's'}
                                            {p.hidden && <span className="pm-hidden"> · Hidden</span>}
                                        </span>
                                    </div>
                                    <div className="pm-actions">
                                        {filter === 'all' && (
                                            <span className="pm-order">
                                                <button className="crm-linkbtn" onClick={() => moveProduct(p.id, -1)} disabled={pos === 0} aria-label="Show earlier"><Icon name="fa-chevron-up" /></button>
                                                <button className="crm-linkbtn" onClick={() => moveProduct(p.id, 1)} disabled={pos === data.products.length - 1} aria-label="Show later"><Icon name="fa-chevron-down" /></button>
                                            </span>
                                        )}
                                        <button className="crm-linkbtn" disabled={busy} onClick={() => toggleHidden(p)}>{p.hidden ? 'Show' : 'Hide'}</button>
                                        {!p.hidden && <a className="crm-linkbtn" href={`/product/${p.id}`} target="_blank" rel="noopener noreferrer">View ↗</a>}
                                        <button className="btn" onClick={() => setEditing(p)}>Edit</button>
                                    </div>
                                </li>
                            );
                        })}
                        {!products.length && <li className="an-empty">No products here yet.</li>}
                    </ul>
                </>
            ) : (
                <section className="an-panel">
                    <div className="an-head">
                        <h2>Categories</h2>
                        <button className="btn" onClick={() => setCatForm({ cat: blankCategory(), isNew: true })}><Icon name="fa-plus" /> New category</button>
                    </div>
                    <p className="an-hint">Each category gets its own page and a link in the menu. New ones live at wularsports.com/category/…</p>

                    {catForm && (
                        <div className="mk-form">
                            <div className="mk-grid">
                                <label className="mk-field">
                                    <span>Page title</span>
                                    <input className="mk-input" value={catForm.cat.title || ''} onChange={e => setCatForm({ ...catForm, cat: { ...catForm.cat, title: e.target.value } })} placeholder="e.g. Kids Cricket Bats" autoFocus />
                                </label>
                                <label className="mk-field">
                                    <span>Menu label</span>
                                    <input className="mk-input" value={catForm.cat.navLabel || ''} onChange={e => setCatForm({ ...catForm, cat: { ...catForm.cat, navLabel: e.target.value } })} placeholder="e.g. Kids Bats" />
                                </label>
                                <label className="mk-field mk-span2">
                                    <span>Short description (under the heading, and in Google results)</span>
                                    <input className="mk-input" value={catForm.cat.description || ''} onChange={e => setCatForm({ ...catForm, cat: { ...catForm.cat, description: e.target.value } })} />
                                </label>
                            </div>
                            <details className="mk-more">
                                <summary>More (for Google)</summary>
                                <div className="mk-grid">
                                    <label className="mk-field mk-span2">
                                        <span>Main heading (H1)</span>
                                        <input className="mk-input" value={catForm.cat.h1 || ''} onChange={e => setCatForm({ ...catForm, cat: { ...catForm.cat, h1: e.target.value } })} placeholder="e.g. Kids Cricket Bats by Wular Sports" />
                                    </label>
                                    <label className="mk-field mk-span2">
                                        <span>Longer text on the page</span>
                                        <textarea className="crm-textarea" rows={5} value={catForm.cat.bodyText || ''} onChange={e => setCatForm({ ...catForm, cat: { ...catForm.cat, bodyText: e.target.value } })} />
                                    </label>
                                    <label className="mk-field mk-span2">
                                        <span>Search keywords (comma separated)</span>
                                        <input className="mk-input" value={catForm.cat.keywords || ''} onChange={e => setCatForm({ ...catForm, cat: { ...catForm.cat, keywords: e.target.value } })} />
                                    </label>
                                </div>
                            </details>
                            <label className="crm-check">
                                <input type="checkbox" checked={catForm.cat.showInNav !== false} onChange={e => setCatForm({ ...catForm, cat: { ...catForm.cat, showInNav: e.target.checked } })} /> Show in the website menu
                            </label>
                            <div className="crm-save-row">
                                <button className="btn" onClick={saveCategory} disabled={busy || !catForm.cat.title?.trim()}>{busy ? 'Saving…' : 'Save category'}</button>
                                <button className="crm-linkbtn" onClick={() => setCatForm(null)}>Cancel</button>
                            </div>
                        </div>
                    )}

                    <div className="scroll">
                        <table className="admin-table">
                            <thead><tr><th>Category</th><th>Menu label</th><th>Address</th><th className="num">Products</th><th>In menu</th><th></th></tr></thead>
                            <tbody>
                                {data.categories.map(c => (
                                    <tr key={c.id}>
                                        <td>{c.title}</td>
                                        <td>{c.navLabel}</td>
                                        <td className="mono"><a href={c.path} target="_blank" rel="noopener noreferrer">{c.path}</a></td>
                                        <td className="num">{count(c)}</td>
                                        <td>{c.showInNav ? 'Yes' : <span className="crm-muted">No</span>}</td>
                                        <td className="mk-actions">
                                            <button className="crm-linkbtn" onClick={() => setCatForm({ cat: { ...c }, isNew: false })}>Edit</button>
                                            {!c.builtIn && <button className="crm-linkbtn" onClick={() => deleteCategory(c)} aria-label={`Delete ${c.title}`}><Icon name="fa-trash-alt" /></button>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {editing && (
                <ProductEditor
                    key={editing === 'new' ? 'new' : editing.id}
                    product={editing === 'new' ? null : editing}
                    categories={data.categories}
                    photosReady={data.photosReady}
                    onSaved={p => setProducts(ps => (ps.some(x => x.id === p.id) ? ps.map(x => (x.id === p.id ? p : x)) : [...ps, p]))}
                    onDeleted={id => { setProducts(ps => ps.filter(x => x.id !== id)); setEditing(null); setMsg({ ok: true, text: 'Product deleted' }); }}
                    onClose={() => setEditing(null)}
                />
            )}
        </div>
    );
};
