import { FC, useEffect, useRef, useState } from 'react';
import { productAction, uploadProductPhoto, discardProductPhoto } from '../../services/admin';
import { Category, productImages, productSizes, slugify } from '../../lib/catalog';
import type { ProductFull } from '../../types';
import { inr } from './format';
import { Icon } from '../common/Icon';

interface Props {
    product: ProductFull | null;      // null = new product
    categories: Category[];
    photosReady: boolean;
    onSaved: (p: ProductFull) => void;
    onDeleted: (id: string) => void;
    onClose: () => void;
}

const SIZE_PRESETS: { label: string; sizes: string[] }[] = [
    { label: '35 & 36 inch', sizes: ['35 inch', '36 inch'] },
    { label: 'Only 35 inch', sizes: ['35 inch'] },
    { label: 'Sizes 4–6 (kids)', sizes: ['Size 4', 'Size 5', 'Size 6'] },
    { label: 'No size', sizes: [] },
];

const move = <T,>(list: T[], i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= list.length) return list;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    return next;
};

export const ProductEditor: FC<Props> = ({ product, categories, photosReady, onSaved, onDeleted, onClose }) => {
    // After a new product's first save, further saves edit it
    const [created, setCreated] = useState<ProductFull | null>(null);
    const saved = product || created;
    const isNew = !saved;
    const [name, setName] = useState(product?.name || '');
    const [id, setId] = useState(product?.id || '');
    const [idTouched, setIdTouched] = useState(false);
    const [sku, setSku] = useState(product?.sku || '');
    const [price, setPrice] = useState(product ? String(product.price) : '');
    const [mrp, setMrp] = useState(product ? String(product.originalPrice) : '');
    const [cats, setCats] = useState<string[]>(product?.category || []);
    const [sizes, setSizes] = useState<string[]>(product ? productSizes(product) : ['35 inch', '36 inch']);
    const [sizeInput, setSizeInput] = useState('');
    const [description, setDescription] = useState(product?.description || '');
    const [specs, setSpecs] = useState<string[]>(product?.specs?.length ? product.specs : ['']);
    const [images, setImages] = useState<string[]>(product ? productImages(product) : []);
    const [imageLink, setImageLink] = useState('');
    const [videoUrl, setVideoUrl] = useState(product?.videoUrl || '');
    const [visible, setVisible] = useState(!product?.hidden);
    const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    // Photos uploaded in this session that aren't saved yet — removed if the editor is abandoned
    const freshUploads = useRef<Set<string>>(new Set());

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // New product: web address follows the name until edited by hand
    useEffect(() => {
        if (isNew && !idTouched) setId(slugify(name));
    }, [name, isNew, idTouched]);

    const close = () => {
        freshUploads.current.forEach(u => discardProductPhoto(u));
        onClose();
    };

    const onFiles = async (files: FileList | null) => {
        if (!files?.length) return;
        setMsg(null);
        const list = Array.from(files).slice(0, 20);
        setUploading({ done: 0, total: list.length });
        const errors: string[] = [];
        for (let i = 0; i < list.length; i++) {
            const r = await uploadProductPhoto(list[i], id || slugify(name) || 'new');
            if (r.url) {
                freshUploads.current.add(r.url);
                setImages(prev => [...prev, r.url!]);
            } else errors.push(`${list[i].name}: ${r.error}`);
            setUploading({ done: i + 1, total: list.length });
        }
        setUploading(null);
        if (errors.length) setMsg({ ok: false, text: errors.join(' · ') });
    };

    const removeImage = (url: string) => {
        setImages(prev => prev.filter(u => u !== url));
        if (freshUploads.current.has(url)) {
            freshUploads.current.delete(url);
            discardProductPhoto(url);
        }
    };

    const addSize = () => {
        const v = sizeInput.trim();
        if (v && !sizes.includes(v)) setSizes([...sizes, v]);
        setSizeInput('');
    };

    const save = async () => {
        setMsg(null);
        if (!images.length) return setMsg({ ok: false, text: 'Add at least one photo.' });
        if (!cats.length) return setMsg({ ok: false, text: 'Pick at least one category.' });
        setBusy(true);
        const res = await productAction('saveProduct', {
            isNew,
            product: {
                ...(saved || {}),
                id, name, sku,
                price: Number(price),
                originalPrice: mrp === '' ? Number(price) : Number(mrp),
                category: cats,
                sizes,
                description,
                specs: specs.map(s => s.trim()).filter(Boolean),
                image: images,
                videoUrl,
                hidden: !visible,
            },
        }).catch(() => ({ error: 'Could not save — check your connection.' }));
        setBusy(false);
        if (res.error) return setMsg({ ok: false, text: res.error });
        freshUploads.current.clear();
        setCreated(res.product);
        onSaved(res.product);
        setMsg({
            ok: true,
            text: res.refreshFailed?.length
                ? 'Saved. Some pages will update within 10 minutes.'
                : visible ? 'Saved — live on the website now.' : 'Saved — hidden from the website.',
        });
    };

    const remove = async () => {
        if (!saved || !confirm(`Delete “${saved.name}” from the website? Past orders keep their details. This can’t be undone.`)) return;
        setBusy(true);
        const res = await productAction('deleteProduct', { id: saved.id }).catch(() => ({ error: 'Could not delete.' }));
        setBusy(false);
        if (res.error) return setMsg({ ok: false, text: res.error });
        onDeleted(saved.id);
    };

    const discount = Number(mrp) > Number(price) && Number(price) > 0 ? Math.round(((Number(mrp) - Number(price)) / Number(mrp)) * 100) : 0;

    return (
        <div className="crm-drawer-overlay" onClick={close}>
            <aside className="crm-drawer pe-drawer" role="dialog" aria-modal="true" aria-label={isNew ? 'Add a product' : `Edit ${saved?.name}`} onClick={e => e.stopPropagation()}>
                <div className="crm-drawer__head">
                    <div>
                        <h2>{isNew ? 'Add a product' : 'Edit product'}</h2>
                        <p className="crm-muted">{isNew ? 'Fill in the details and save — it goes live straight away.' : `wularsports.com/product/${saved?.id}`}</p>
                    </div>
                    <button className="modal-close" onClick={close} aria-label="Close">×</button>
                </div>

                <div className="crm-drawer__body">
                    <section className="crm-section">
                        <h3>Photos</h3>
                        <p className="crm-muted">The first photo is the main one on the shop page. Use the arrows to change the order.</p>
                        <div className="pe-photos">
                            {images.map((url, i) => (
                                <figure key={url} className="pe-photo">
                                    <img src={url} alt={`Photo ${i + 1}`} loading="lazy" />
                                    {i === 0 && <span className="pe-photo__main">Main</span>}
                                    <div className="pe-photo__tools">
                                        <button onClick={() => setImages(move(images, i, -1))} disabled={i === 0} aria-label="Move earlier"><Icon name="fa-chevron-left" /></button>
                                        <button onClick={() => removeImage(url)} aria-label="Remove photo"><Icon name="fa-trash-alt" /></button>
                                        <button onClick={() => setImages(move(images, i, 1))} disabled={i === images.length - 1} aria-label="Move later"><Icon name="fa-chevron-right" /></button>
                                    </div>
                                </figure>
                            ))}
                            <button className="pe-photo pe-photo--add" onClick={() => fileRef.current?.click()} disabled={!photosReady || !!uploading}>
                                <Icon name={uploading ? 'fa-spinner' : 'fa-plus'} />
                                <span>{uploading ? `Uploading ${uploading.done + 1 > uploading.total ? uploading.total : uploading.done + 1} of ${uploading.total}…` : 'Add photos'}</span>
                            </button>
                        </div>
                        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/*" multiple hidden onChange={e => { onFiles(e.target.files); e.target.value = ''; }} />
                        {!photosReady && <p className="crm-warn">Photo uploads aren’t switched on yet — you can still paste a photo link below.</p>}
                        <details className="mk-more">
                            <summary>Add a photo by link</summary>
                            <div className="mk-copy__row">
                                <input className="mk-input" value={imageLink} onChange={e => setImageLink(e.target.value.trim())} placeholder="https://…" />
                                <button className="btn" disabled={!/^https:\/\//.test(imageLink)} onClick={() => { setImages([...images, imageLink]); setImageLink(''); }}>Add</button>
                            </div>
                        </details>
                    </section>

                    <section className="crm-section">
                        <h3>Basics</h3>
                        <div className="mk-grid">
                            <label className="mk-field mk-span2">
                                <span>Product name</span>
                                <input className="mk-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Thunder Edition — Kashmiri Willow Hard Tennis Bat" autoFocus={isNew} />
                            </label>
                            <label className="mk-field mk-span2">
                                <span>Web address {isNew ? '(can’t be changed later)' : '(fixed)'}</span>
                                <div className="pe-url">
                                    <span>wularsports.com/product/</span>
                                    <input className="mk-input" value={id} disabled={!isNew} onChange={e => { setIdTouched(true); setId(slugify(e.target.value)); }} />
                                </div>
                            </label>
                            <label className="mk-field">
                                <span>Selling price ₹</span>
                                <input className="mk-input" inputMode="numeric" value={price} onChange={e => setPrice(e.target.value.replace(/\D/g, ''))} placeholder="3499" />
                            </label>
                            <label className="mk-field">
                                <span>Original price ₹ (shown crossed out)</span>
                                <input className="mk-input" inputMode="numeric" value={mrp} onChange={e => setMrp(e.target.value.replace(/\D/g, ''))} placeholder="4600" />
                            </label>
                            <label className="mk-field">
                                <span>SKU (optional)</span>
                                <input className="mk-input" value={sku} onChange={e => setSku(e.target.value)} placeholder="WS-THUNDER" />
                            </label>
                            <div className="mk-field">
                                <span>On the website</span>
                                <p className="pe-price">
                                    {Number(price) > 0 ? <strong>{inr(Number(price))}</strong> : '—'}
                                    {discount > 0 && <> <s>{inr(Number(mrp))}</s> <em>Save {discount}%</em></>}
                                </p>
                            </div>
                        </div>
                        <label className="crm-check pe-visible">
                            <input type="checkbox" checked={visible} onChange={e => setVisible(e.target.checked)} />
                            Show on the website (untick to hide it without deleting)
                        </label>
                    </section>

                    <section className="crm-section">
                        <h3>Categories</h3>
                        <div className="crm-tpl-row">
                            {categories.map(c => (
                                <button
                                    key={c.id}
                                    role="checkbox"
                                    aria-checked={cats.includes(c.name)}
                                    className={`crm-chip ${cats.includes(c.name) ? 'active' : ''}`}
                                    onClick={() => setCats(cats.includes(c.name) ? cats.filter(x => x !== c.name) : [...cats, c.name])}
                                >
                                    {cats.includes(c.name) && <Icon name="fa-check" />} {c.title}
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="crm-section">
                        <h3>Sizes customers choose from</h3>
                        <div className="crm-tags-edit">
                            {sizes.map(s => (
                                <span key={s} className="crm-tag crm-tag--edit">{s}<button onClick={() => setSizes(sizes.filter(x => x !== s))} aria-label={`Remove ${s}`}>×</button></span>
                            ))}
                            <input
                                value={sizeInput}
                                onChange={e => setSizeInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSize(); } }}
                                onBlur={addSize}
                                placeholder={sizes.length ? 'Add a size + Enter' : 'No size choice — type one + Enter'}
                            />
                        </div>
                        <div className="crm-quicktags">
                            {SIZE_PRESETS.map(p => <button key={p.label} className="crm-linkbtn" onClick={() => setSizes(p.sizes)}>{p.label}</button>)}
                        </div>
                        <p className="crm-muted">{sizes.length > 1 ? 'Customers must pick a size before adding to cart.' : sizes.length === 1 ? `Added to cart as ${sizes[0]} automatically.` : 'No size is asked.'}</p>
                    </section>

                    <section className="crm-section">
                        <h3>Description</h3>
                        <textarea className="crm-textarea" rows={8} value={description} onChange={e => setDescription(e.target.value)} placeholder="What makes this bat special… (leave an empty line between paragraphs)" />
                    </section>

                    <section className="crm-section">
                        <h3>Specifications</h3>
                        <p className="crm-muted">One line each, e.g. “Weight: 980–1100 grams”. Start a line with “Scoop Profile:” to use the scoop filter on category pages.</p>
                        <div className="pe-specs">
                            {specs.map((s, i) => (
                                <div className="pe-spec" key={i}>
                                    <input className="mk-input" value={s} onChange={e => setSpecs(specs.map((x, j) => (j === i ? e.target.value : x)))} placeholder="Label: value" />
                                    <button className="crm-linkbtn" onClick={() => setSpecs(move(specs, i, -1))} disabled={i === 0} aria-label="Move up"><Icon name="fa-chevron-up" /></button>
                                    <button className="crm-linkbtn" onClick={() => setSpecs(move(specs, i, 1))} disabled={i === specs.length - 1} aria-label="Move down"><Icon name="fa-chevron-down" /></button>
                                    <button className="crm-linkbtn" onClick={() => setSpecs(specs.length > 1 ? specs.filter((_, j) => j !== i) : [''])} aria-label="Remove line"><Icon name="fa-trash-alt" /></button>
                                </div>
                            ))}
                        </div>
                        <button className="crm-linkbtn" onClick={() => setSpecs([...specs, ''])}>+ Add a line</button>
                    </section>

                    <section className="crm-section">
                        <h3>Video (optional)</h3>
                        <input className="mk-input" value={videoUrl} onChange={e => setVideoUrl(e.target.value.trim())} placeholder="YouTube link, e.g. https://www.youtube.com/shorts/…" />
                    </section>

                    {msg && <p className={msg.ok ? 'crm-ok' : 'crm-warn'} role="status">{msg.text}</p>}
                    <div className="crm-save-row pe-actions">
                        <button className="btn" onClick={save} disabled={busy || !!uploading}>{busy ? 'Saving…' : isNew ? 'Add product' : 'Save changes'}</button>
                        {!isNew && visible && <a className="crm-linkbtn" href={`/product/${saved!.id}`} target="_blank" rel="noopener noreferrer">View on website ↗</a>}
                        <button className="crm-linkbtn" onClick={close}>Close</button>
                        {!isNew && <button className="crm-linkbtn pe-delete" onClick={remove} disabled={busy}><Icon name="fa-trash-alt" /> Delete product</button>}
                    </div>
                </div>
            </aside>
        </div>
    );
};
