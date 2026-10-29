'use client';
import { useState } from 'react';
import Link from 'next/link';
import Icon from './Icon';
import { useApp } from './Providers';
import { useFetch } from '@/lib/useFetch';
import { api } from '@/lib/client';
import { FavoriteButton, AddToCartButton, ProductGrid } from './ProductCard';
import { BackButton, Breadcrumbs, Loader, ErrorState, Stars, StarInput, PriceTag, QuantitySelector, Tabs, Modal, Field, ShareButtons, Badge, SectionHeader } from './ui';

export function Gallery({ images, title }) {
  const [i, setI] = useState(0);
  return (
    <div className="gallery">
      <div className="gallery-main"><img key={i} src={images[i]} alt={`${title} — ${i + 1}`} /></div>
      {images.length > 1 && (
        <div className="thumbs">
          {images.map((src, k) => <button key={k} className={k === i ? 'on' : ''} onClick={() => setI(k)} aria-label={`${k + 1}`}><img src={src} alt="" /></button>)}
        </div>
      )}
    </div>
  );
}

export function ReviewForm({ productId, onAdded }) {
  const { user, t, errText, toast } = useApp();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  if (!user) return <div className="alert alert-info"><Link href="/login"><b>{t('loginToReview')}</b> →</Link></div>;
  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (!rating) return setErr(t('err_invalid_rating'));
    setBusy(true);
    try {
      const d = await api(`/api/products/${productId}/reviews`, { method: 'POST', body: { rating, comment } });
      setRating(0); setComment('');
      toast(t('reviewSent'));
      onAdded(d);
    } catch (e2) { setErr(errText(e2)); } finally { setBusy(false); }
  };
  return (
    <form className="panel stack" onSubmit={submit}>
      <h3 style={{ margin: 0 }}>{t('writeReview')}</h3>
      <Field label={t('yourRating')}><StarInput value={rating} onChange={setRating} /></Field>
      <Field label={t('yourComment')}><textarea value={comment} onChange={(e) => setComment(e.target.value)} required minLength={3} maxLength={1000} /></Field>
      {err && <div className="alert">{err}</div>}
      <div><button className="btn btn-primary" disabled={busy}>{busy ? t('loading') : t('send')}</button></div>
    </form>
  );
}

export function ReviewList({ reviews, onDelete }) {
  const { t, date, user } = useApp();
  if (!reviews.length) return <p className="muted">{t('noReviews')}</p>;
  return (
    <div>
      {reviews.map((r) => (
        <div key={r.id} className="review">
          <div className="review-head">
            <div className="row"><span className="avatar">{r.userName[0]}</span><b>{r.userName}</b><Stars value={r.rating} size={14} /></div>
            <div className="row"><span className="muted small">{date(r.createdAt)}</span>
              {user && (user.role === 'admin' || user.id === r.userId) && <button className="icon-btn" onClick={() => onDelete(r.id)} aria-label={t('delete')}><Icon name="trash" size={16} /></button>}
            </div>
          </div>
          <p>{r.comment}</p>
        </div>
      ))}
    </div>
  );
}

export function ReserveModal({ product, open, onClose }) {
  const { t, errText, toast, user } = useApp();
  const stores = useFetch(open ? '/api/stores' : null);
  const today = new Date();
  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const max = new Date(); max.setDate(max.getDate() + 14);
  const [form, setForm] = useState({ storeId: '', date: fmt(new Date(Date.now() + 864e5)), time: '12:00', qty: 1 });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      await api('/api/reservations', { method: 'POST', body: { ...form, productId: product.id } });
      toast(t('reserved'));
      onClose();
    } catch (e2) { setErr(errText(e2)); } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title={t('reserveTitle')}>
      {!user ? <div className="alert alert-info"><Link href="/login"><b>{t('loginRequired')}</b> →</Link></div> : (
        <form className="stack" onSubmit={submit}>
          <div className="mini-item"><img src={product.thumbnail} alt={product.title} /><span>{product.title}</span></div>
          <Field label={t('store')}>
            <select required value={form.storeId} onChange={(e) => setForm({ ...form, storeId: e.target.value })}>
              <option value="">—</option>
              {stores.data?.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.address}</option>)}
            </select>
          </Field>
          <div className="form-grid">
            <Field label={t('date')}><input type="date" required min={fmt(today)} max={fmt(max)} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
            <Field label={t('time')}><input type="time" required min="09:00" max="21:00" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></Field>
          </div>
          <Field label={t('quantity')}><QuantitySelector value={form.qty} onChange={(q) => setForm({ ...form, qty: q })} max={product.stock} /></Field>
          {err && <div className="alert">{err}</div>}
          <div className="row-end"><button type="button" className="btn btn-ghost" onClick={onClose}>{t('cancel')}</button><button className="btn btn-primary" disabled={busy}>{t('confirm')}</button></div>
        </form>
      )}
    </Modal>
  );
}

export default function ProductPage({ id }) {
  const { t, cat, toast, errText, date } = useApp();
  const { data, setData, loading, error, reload } = useFetch(`/api/products/${id}`);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState('desc');
  const [reserve, setReserve] = useState(false);

  if (loading) return <div className="container"><BackButton fallback="/catalog" /><Loader /></div>;
  if (error) return <div className="container"><BackButton fallback="/catalog" /><ErrorState error={error} onRetry={error.status === 404 ? undefined : reload} /></div>;
  const { product: p, reviews, related } = data;

  const onReviewAdded = (d) => setData({ ...data, reviews: [d.review, ...reviews], product: { ...p, rating: d.rating, reviewsCount: d.reviewsCount } });
  const onDelete = async (rid) => {
    try { await api(`/api/reviews/${rid}`, { method: 'DELETE' }); toast(t('deleted')); reload(); } catch (e) { toast(errText(e), 'error'); }
  };

  return (
    <div className="container">
      <BackButton fallback="/catalog" />
      <Breadcrumbs items={[{ label: t('home'), href: '/' }, { label: t('catalog'), href: '/catalog' }, { label: cat(p.category), href: `/catalog?category=${p.category}` }, { label: p.title }]} />
      <div className="product">
        <Gallery images={p.images?.length ? p.images : [p.thumbnail]} title={p.title} />
        <div className="pinfo">
          <span className="muted">{p.brand}</span>
          <h1>{p.title}</h1>
          <div className="pinfo-meta">
            <Stars value={p.rating} count={p.reviewsCount} />
            {p.stock > 0 ? <Badge tone={p.stock < 10 ? 'warn' : 'success'}>{t('inStock')}{p.stock < 10 ? ` · ${p.stock} ${t('left')}` : ''}</Badge> : <Badge tone="danger">{t('outOfStock')}</Badge>}
            {p.sku && <span className="muted small">SKU: {p.sku}</span>}
          </div>
          <div className="card buy-box">
            <PriceTag price={p.price} oldPrice={p.oldPrice} discount={p.discount} large />
            {p.stock > 0 && <div className="row"><span className="muted">{t('quantity')}:</span><QuantitySelector value={qty} onChange={setQty} max={p.stock} /></div>}
            <div className="buy-row">
              <AddToCartButton product={p} qty={qty} full />
              <FavoriteButton id={p.id} />
            </div>
            {p.stock > 0 && <button className="btn btn-ghost btn-block" onClick={() => setReserve(true)}><Icon name="store" size={18} /> {t('reserve')}</button>}
            <ShareButtons title={p.title} />
          </div>
          <div className="row small muted"><Icon name="truck" size={16} /> {p.shipping || t('featShippingText')}</div>
          <div className="row small muted" style={{ marginTop: 6 }}><Icon name="shield" size={16} /> {p.warranty || '—'}</div>
        </div>
      </div>

      <section className="section">
        <Tabs value={tab} onChange={setTab} tabs={[{ value: 'desc', label: t('description') }, { value: 'specs', label: t('specs') }, { value: 'reviews', label: t('reviews'), count: reviews.length }]} />
        {tab === 'desc' && <div className="panel"><p style={{ margin: 0 }}>{p.description}</p>{p.tags?.length > 0 && <div className="tags" style={{ marginTop: 14 }}>{p.tags.map((tg) => <Badge key={tg}>#{tg}</Badge>)}</div>}</div>}
        {tab === 'specs' && (
          <div className="panel"><table className="specs"><tbody>
            <tr><td>{t('brand')}</td><td>{p.brand || '—'}</td></tr>
            <tr><td>{t('category')}</td><td>{cat(p.category)}</td></tr>
            <tr><td>{t('stock')}</td><td>{p.stock}</td></tr>
            <tr><td>{t('warranty')}</td><td>{p.warranty || '—'}</td></tr>
            <tr><td>{t('shipping')}</td><td>{p.shipping || '—'}</td></tr>
            {p.sku && <tr><td>SKU</td><td>{p.sku}</td></tr>}
            {p.priceSource && <tr><td>{t('priceSource')}</td><td><a className="link-more" href={p.priceSource} target="_blank" rel="noopener noreferrer">{p.priceNote}</a> · {date(p.priceCheckedAt)}</td></tr>}
          </tbody></table></div>
        )}
        {tab === 'reviews' && (
          <div className="two-col">
            <div className="panel">
              <div className="reviews-summary"><span className="big-rating">{p.rating ? p.rating.toFixed(1) : '—'}</span><div><Stars value={p.rating} size={20} /><div className="muted">{p.reviewsCount} {t('reviewsN')}</div></div></div>
              <ReviewList reviews={reviews} onDelete={onDelete} />
            </div>
            <ReviewForm productId={p.id} onAdded={onReviewAdded} />
          </div>
        )}
      </section>

      {related.length > 0 && (
        <section className="section">
          <SectionHeader title={t('related')} href={`/catalog?category=${p.category}`} linkText={t('showAll')} />
          <ProductGrid items={related} />
        </section>
      )}
      <ReserveModal product={p} open={reserve} onClose={() => setReserve(false)} />
    </div>
  );
}
