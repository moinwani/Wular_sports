import { FC, ReactNode, useEffect, useRef, useState } from 'react';
import { uploadProductPhoto } from '../../services/admin';
import { useCatalog } from '../../context/CatalogContext';
import { Icon } from '../common/Icon';

/**
 * A small word-processor for blog articles: headings, bold, lists, quotes,
 * links, photos and links to your bats — no HTML needed (an "HTML" switch is
 * there for fine-tuning). The editing area uses the blog's own styles, so it
 * looks like the published article. The server cleans the HTML on save.
 */

interface Props {
    value: string;
    onChange: (html: string) => void;
    /** Folder name for uploaded photos */
    photoFolder: string;
    photosReady: boolean;
}

export const RichTextEditor: FC<Props> = ({ value, onChange, photoFolder, photosReady }) => {
    const ref = useRef<HTMLDivElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const [htmlMode, setHtmlMode] = useState(false);
    const [busy, setBusy] = useState('');
    const [productPicker, setProductPicker] = useState(false);
    const { products } = useCatalog();
    // Remember where the cursor was before a toolbar click or file picker
    const saved = useRef<Range | null>(null);

    // Fill the editing area once (and when coming back from HTML mode) — not on every keystroke
    useEffect(() => {
        if (!htmlMode && ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [htmlMode]);

    const sync = () => { if (ref.current) onChange(ref.current.innerHTML); };
    const keepSelection = () => {
        const sel = window.getSelection();
        if (sel && sel.rangeCount && ref.current?.contains(sel.anchorNode)) saved.current = sel.getRangeAt(0);
    };
    const restoreSelection = () => {
        ref.current?.focus();
        const sel = window.getSelection();
        if (saved.current && sel) { sel.removeAllRanges(); sel.addRange(saved.current); }
    };
    const run = (cmd: string, arg?: string) => {
        restoreSelection();
        document.execCommand(cmd, false, arg);
        sync();
        keepSelection();
    };

    const addLink = () => {
        const url = window.prompt('Link address (https://… or /product/…)');
        if (!url) return;
        if (!/^(https?:\/\/|\/|mailto:|tel:)/.test(url)) return alert('Links must start with https://, / or mailto:');
        run('createLink', url);
    };

    const insertHtml = (html: string) => run('insertHTML', html);

    const onPhoto = async (file?: File | null) => {
        if (!file) return;
        setBusy('Uploading photo…');
        const r = await uploadProductPhoto(file, photoFolder);
        setBusy('');
        if (r.error || !r.url) return alert(r.error || 'Upload failed');
        const alt = (window.prompt('Describe the photo in a few words (helps Google)', '') || '').replace(/"/g, '&quot;');
        insertHtml(`<p><img src="${r.url}" alt="${alt}" loading="lazy" /></p>`);
    };

    const linkProduct = (id: string) => {
        const p = products.find(x => x.id === id);
        setProductPicker(false);
        if (!p) return;
        const sel = window.getSelection()?.toString();
        const label = sel || p.name.split(' — ')[0];
        insertHtml(`<a href="/product/${p.id}">${label.replace(/</g, '&lt;')}</a>`);
    };

    const B: FC<{ title: string; onClick: () => void; children: ReactNode }> = ({ title, onClick, children }) => (
        <button type="button" title={title} aria-label={title} onMouseDown={e => e.preventDefault()} onClick={onClick} disabled={htmlMode}>{children}</button>
    );

    return (
        <div className="rte">
            <div className="rte__bar" role="toolbar" aria-label="Formatting">
                <B title="Heading" onClick={() => run('formatBlock', '<h2>')}>H2</B>
                <B title="Sub-heading" onClick={() => run('formatBlock', '<h3>')}>H3</B>
                <B title="Normal text" onClick={() => run('formatBlock', '<p>')}>¶</B>
                <span className="rte__sep" />
                <B title="Bold" onClick={() => run('bold')}><strong>B</strong></B>
                <B title="Italic" onClick={() => run('italic')}><em>I</em></B>
                <B title="Bullet list" onClick={() => run('insertUnorderedList')}>• List</B>
                <B title="Numbered list" onClick={() => run('insertOrderedList')}>1. List</B>
                <B title="Quote" onClick={() => run('formatBlock', '<blockquote>')}>“ ”</B>
                <span className="rte__sep" />
                <B title="Add link" onClick={addLink}><Icon name="fa-link" /> Link</B>
                <B title="Link to a bat" onClick={() => { keepSelection(); setProductPicker(v => !v); }}><Icon name="fa-shopping-bag" /> Bat</B>
                <B title="Add photo" onClick={() => { keepSelection(); fileRef.current?.click(); }}><Icon name="fa-plus" /> Photo</B>
                <B title="Remove formatting" onClick={() => run('removeFormat')}>Clear</B>
                <span className="rte__grow" />
                <button type="button" className={`rte__mode ${htmlMode ? 'on' : ''}`} onClick={() => { if (!htmlMode) sync(); setHtmlMode(m => !m); }}>
                    {htmlMode ? 'Back to editor' : 'HTML'}
                </button>
            </div>
            {productPicker && (
                <div className="rte__picker">
                    <span>Link to:</span>
                    {products.map(p => <button type="button" key={p.id} onMouseDown={e => e.preventDefault()} onClick={() => linkProduct(p.id)}>{p.name.split(' — ')[0]}</button>)}
                </div>
            )}
            {busy && <p className="crm-muted">{busy}</p>}
            {!photosReady && <p className="crm-muted">Photo uploads need photo storage switched on — you can still paste photo links in HTML mode.</p>}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/*" hidden onChange={e => { onPhoto(e.target.files?.[0]); e.target.value = ''; }} />
            {htmlMode ? (
                <textarea className="crm-textarea rte__html" value={value} onChange={e => onChange(e.target.value)} rows={20} spellCheck={false} />
            ) : (
                <div
                    ref={ref}
                    className="rte__area blog-content-body"
                    contentEditable
                    suppressContentEditableWarning
                    role="textbox"
                    aria-multiline="true"
                    aria-label="Article"
                    onInput={sync}
                    onBlur={() => { keepSelection(); sync(); }}
                    onKeyUp={keepSelection}
                    onMouseUp={keepSelection}
                />
            )}
        </div>
    );
};
