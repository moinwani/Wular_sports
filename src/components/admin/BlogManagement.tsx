import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { blogAction, fetchAdminBlog, uploadProductPhoto, discardProductPhoto } from '../../services/admin';
import { DEFAULT_AUTHOR, ManagedPost, displayDate, readTimeFor, slugify } from '../../lib/blog';
import { RichTextEditor } from './RichTextEditor';
import { Icon } from '../common/Icon';

type Filter = 'all' | 'live' | 'draft';
const today = () => new Date(Date.now() + 5.5 * 3600000).toISOString().slice(0, 10);

/* ───────────── Editor ───────────── */

const PostEditor: FC<{
    post: ManagedPost | null;
    categories: string[];
    onSaved: (p: ManagedPost) => void;
    onDeleted: (id: string) => void;
    onClose: () => void;
}> = ({ post, categories, onSaved, onDeleted, onClose }) => {
    const [created, setCreated] = useState<ManagedPost | null>(null);
    const saved = post || created;
    const isNew = !saved;
    const [title, setTitle] = useState(post?.title || '');
    const [id, setId] = useState(post?.id || '');
    const [idTouched, setIdTouched] = useState(false);
    const [description, setDescription] = useState(post?.description || '');
    const [category, setCategory] = useState(post?.category || 'Guides');
    const [author, setAuthor] = useState(post?.author || DEFAULT_AUTHOR);
    const [publishedAt, setPublishedAt] = useState(post?.publishedAt || today());
    const [image, setImage] = useState(post?.image || '');
    const [content, setContent] = useState(post?.content || '');
    const [faq, setFaq] = useState<{ question: string; answer: string }[]>(post?.faq || []);
    const [published, setPublished] = useState(post ? post.published !== false : true);
    const [busy, setBusy] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
    const [freshCover, setFreshCover] = useState<string | null>(null);

    useEffect(() => { if (isNew && !idTouched) setId(slugify(title)); }, [title, isNew, idTouched]);
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const close = () => {
        if (freshCover) discardProductPhoto(freshCover);
        onClose();
    };

    const onCover = async (file?: File | null) => {
        if (!file) return;
        setUploading(true);
        const r = await uploadProductPhoto(file, `blog-${id || 'new'}`);
        setUploading(false);
        if (r.error || !r.url) return setMsg({ ok: false, text: r.error || 'Upload failed' });
        if (freshCover) discardProductPhoto(freshCover);
        setFreshCover(r.url);
        setImage(r.url);
    };

    const save = async () => {
        setMsg(null);
        setBusy(true);
        const res = await blogAction('savePost', {
            isNew,
            post: { id, title, description, category, author, publishedAt, image, content, faq, published },
        }).catch(() => ({ error: 'Could not save — check your connection.' }));
        setBusy(false);
        if (res.error) return setMsg({ ok: false, text: res.error });
        setFreshCover(null);
        setCreated(res.post);
        setContent(res.post.content); // the server's cleaned version
        onSaved(res.post);
        setMsg({ ok: true, text: res.post.published ? 'Saved — live on the blog now.' : 'Saved as a draft (not on the website).' });
    };

    const remove = async () => {
        if (!saved || !confirm(`Delete “${saved.title}”? This can’t be undone.`)) return;
        setBusy(true);
        const res = await blogAction('deletePost', { id: saved.id }).catch(() => ({ error: 'Could not delete.' }));
        setBusy(false);
        if (res.error) return setMsg({ ok: false, text: res.error });
        onDeleted(saved.id);
    };

    return (
        <div className="crm-drawer-overlay" onClick={close}>
            <aside className="crm-drawer pe-drawer be-drawer" role="dialog" aria-modal="true" aria-label={isNew ? 'Write a post' : `Edit ${saved?.title}`} onClick={e => e.stopPropagation()}>
                <div className="crm-drawer__head">
                    <div>
                        <h2>{isNew ? 'Write a post' : 'Edit post'}</h2>
                        <p className="crm-muted">{isNew ? 'Save as a draft or publish straight away.' : `wularsports.com/blog/${saved?.id}`}</p>
                    </div>
                    <button className="modal-close" onClick={close} aria-label="Close">×</button>
                </div>
                <div className="crm-drawer__body">
                    <section className="crm-section">
                        <label className="mk-field">
                            <span>Title <em className="be-count">{title.length}/60 ideal for Google</em></span>
                            <input className="mk-input be-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. How to Knock In a Kashmir Willow Bat" autoFocus={isNew} />
                        </label>
                        <label className="mk-field">
                            <span>Web address {isNew ? '(can’t be changed later)' : '(fixed)'}</span>
                            <div className="pe-url">
                                <span>wularsports.com/blog/</span>
                                <input className="mk-input" value={id} disabled={!isNew} onChange={e => { setIdTouched(true); setId(slugify(e.target.value)); }} />
                            </div>
                        </label>
                        <label className="mk-field">
                            <span>Summary <em className="be-count">{description.length}/160 — shown on Google and the blog page</em></span>
                            <textarea className="crm-textarea" rows={2} value={description} onChange={e => setDescription(e.target.value)} />
                        </label>
                        <div className="mk-grid">
                            <label className="mk-field">
                                <span>Category</span>
                                <input className="mk-input" list="blog-categories" value={category} onChange={e => setCategory(e.target.value)} />
                                <datalist id="blog-categories">{categories.map(c => <option key={c} value={c} />)}</datalist>
                            </label>
                            <label className="mk-field">
                                <span>Author</span>
                                <input className="mk-input" value={author} onChange={e => setAuthor(e.target.value)} />
                            </label>
                            <label className="mk-field">
                                <span>Date shown</span>
                                <input className="mk-input" type="date" value={publishedAt} onChange={e => setPublishedAt(e.target.value)} />
                            </label>
                            <div className="mk-field">
                                <span>Read time</span>
                                <p className="pe-price">{readTimeFor(content)} <span className="crm-muted">(automatic)</span></p>
                            </div>
                        </div>
                    </section>

                    <section className="crm-section">
                        <h3>Cover photo</h3>
                        <div className="be-cover">
                            {image ? <img src={image} alt="" /> : <div className="be-cover__empty"><Icon name="fa-plus" /></div>}
                            <div className="be-cover__actions">
                                <label className="btn mk-file">
                                    {uploading ? 'Uploading…' : image ? 'Change photo' : 'Upload photo'}
                                    <input type="file" accept="image/jpeg,image/png,image/webp,image/*" onChange={e => { onCover(e.target.files?.[0]); e.target.value = ''; }} />
                                </label>
                                <input className="mk-input" value={image} onChange={e => setImage(e.target.value.trim())} placeholder="…or paste a photo link (https://…)" />
                            </div>
                        </div>
                    </section>

                    <section className="crm-section">
                        <h3>Article</h3>
                        <p className="crm-muted">Use “Heading” for each main section — Google reads them. Link to your bats with the “Bat” button.</p>
                        <RichTextEditor value={content} onChange={setContent} photoFolder={`blog-${id || 'new'}`} photosReady={true} />
                    </section>

                    <section className="crm-section">
                        <h3>Questions & answers (optional)</h3>
                        <p className="crm-muted">Shown to Google as an FAQ, which can win extra space in search results.</p>
                        {faq.map((f, i) => (
                            <div className="be-faq" key={i}>
                                <input className="mk-input" value={f.question} placeholder="Question" onChange={e => setFaq(faq.map((x, j) => (j === i ? { ...x, question: e.target.value } : x)))} />
                                <textarea className="crm-textarea" rows={2} value={f.answer} placeholder="Answer" onChange={e => setFaq(faq.map((x, j) => (j === i ? { ...x, answer: e.target.value } : x)))} />
                                <button className="crm-linkbtn" onClick={() => setFaq(faq.filter((_, j) => j !== i))}><Icon name="fa-trash-alt" /> Remove</button>
                            </div>
                        ))}
                        <button className="crm-linkbtn" onClick={() => setFaq([...faq, { question: '', answer: '' }])}>+ Add a question</button>
                    </section>

                    <label className="crm-check">
                        <input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)} />
                        Published on the website (untick to keep it as a draft)
                    </label>

                    {msg && <p className={msg.ok ? 'crm-ok' : 'crm-warn'} role="status">{msg.text}</p>}
                    <div className="crm-save-row pe-actions">
                        <button className="btn" onClick={save} disabled={busy || uploading}>{busy ? 'Saving…' : published ? (isNew ? 'Publish' : 'Save & publish') : 'Save draft'}</button>
                        {saved && saved.published !== false && <a className="crm-linkbtn" href={`/blog/${saved.id}`} target="_blank" rel="noopener noreferrer">View on website ↗</a>}
                        <button className="crm-linkbtn" onClick={close}>Close</button>
                        {saved && <button className="crm-linkbtn pe-delete" onClick={remove} disabled={busy}><Icon name="fa-trash-alt" /> Delete post</button>}
                    </div>
                </div>
            </aside>
        </div>
    );
};

/* ───────────── List ───────────── */

export const BlogManagement: FC = () => {
    const [posts, setPosts] = useState<ManagedPost[] | null>(null);
    const [managed, setManaged] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState<Filter>('all');
    const [search, setSearch] = useState('');
    const [editing, setEditing] = useState<ManagedPost | 'new' | null>(null);
    const [msg, setMsg] = useState('');

    const load = useCallback(() => {
        setError('');
        fetchAdminBlog().then(d => { setPosts(d.posts); setManaged(d.managed); }).catch(e => setError(e.message || 'Could not load posts'));
    }, []);
    useEffect(load, [load]);

    const categories = useMemo(() => [...new Set((posts || []).map(p => p.category).filter(Boolean))].sort(), [posts]);
    const shown = useMemo(() => {
        const q = search.trim().toLowerCase();
        return (posts || [])
            .filter(p => (filter === 'all' ? true : filter === 'live' ? p.published !== false : p.published === false))
            .filter(p => !q || p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }, [posts, filter, search]);

    if (error) {
        return (
            <div className="analytics-dash">
                <div className="management-header"><h1>Blog</h1></div>
                <p className="crm-warn" role="alert">{error} <button className="crm-linkbtn" onClick={load}>Try again</button></p>
            </div>
        );
    }
    if (!posts) return <div className="admin-loading"><div className="loading-spinner"></div><p>Loading posts…</p></div>;

    const live = posts.filter(p => p.published !== false).length;
    const upsert = (p: ManagedPost) => {
        setManaged(true);
        setPosts(ps => {
            const list = ps || [];
            const next = list.some(x => x.id === p.id) ? list.map(x => (x.id === p.id ? p : x)) : [p, ...list];
            return next.sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)));
        });
    };

    return (
        <div className="analytics-dash">
            <div className="management-header">
                <h1>Blog</h1>
                <p className="order-count">{live} published · {posts.length - live} draft{posts.length - live === 1 ? '' : 's'} — changes go live within seconds</p>
                <button className="btn" onClick={() => setEditing('new')}><Icon name="fa-plus" /> Write a post</button>
            </div>
            {!managed && (
                <div className="mk-callout">
                    <Icon name="fa-info-circle" />
                    <p>These are your current blog posts. Your first change copies them into the admin panel — from then on every post is written and edited here.</p>
                </div>
            )}
            {msg && <p className="crm-ok" role="status">{msg}</p>}
            <div className="crm-toolbar">
                <div className="crm-search">
                    <Icon name="fa-search" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search posts…" aria-label="Search posts" />
                </div>
                <div className="crm-chips" role="radiogroup" aria-label="Filter posts" style={{ margin: 0 }}>
                    {([['all', `All ${posts.length}`], ['live', `Published ${live}`], ['draft', `Drafts ${posts.length - live}`]] as [Filter, string][]).map(([f, label]) => (
                        <button key={f} role="radio" aria-checked={filter === f} className={`crm-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{label}</button>
                    ))}
                </div>
            </div>
            <ul className="pm-list">
                {shown.map(p => (
                    <li key={p.id} className={`pm-item ${p.published === false ? 'is-hidden' : ''}`}>
                        <button className="pm-thumb" onClick={() => setEditing(p)} aria-label={`Edit ${p.title}`}>
                            {p.image ? <img src={p.image} alt="" loading="lazy" /> : <Icon name="fa-newspaper" />}
                        </button>
                        <div className="pm-info">
                            <strong>{p.title}</strong>
                            <span className="crm-muted">
                                {p.category} · {p.publishedAt ? displayDate(p.publishedAt) : p.date} · {p.readTime}
                                {p.published === false && <span className="pm-hidden"> · Draft</span>}
                            </span>
                        </div>
                        <div className="pm-actions">
                            {p.published !== false && <a className="crm-linkbtn" href={`/blog/${p.id}`} target="_blank" rel="noopener noreferrer">View ↗</a>}
                            <button className="btn" onClick={() => setEditing(p)}>Edit</button>
                        </div>
                    </li>
                ))}
                {!shown.length && <li className="an-empty">No posts here.</li>}
            </ul>

            {editing && (
                <PostEditor
                    key={editing === 'new' ? 'new' : editing.id}
                    post={editing === 'new' ? null : editing}
                    categories={categories}
                    onSaved={upsert}
                    onDeleted={id => { setPosts(ps => (ps || []).filter(x => x.id !== id)); setEditing(null); setMsg('Post deleted'); }}
                    onClose={() => setEditing(null)}
                />
            )}
        </div>
    );
};
