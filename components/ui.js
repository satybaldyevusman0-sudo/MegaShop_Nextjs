'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Icon from './Icon';
import { useApp } from './Providers';
import { BRAND_PATHS } from '@/lib/brandIcons';
import { site } from '@/lib/client';

export function Spinner({ size = 36 }) {
  return <span className="spinner" style={{ width: size, height: size }} aria-hidden="true" />;
}

export function Loader({ text }) {
  const { t } = useApp();
  return <div className="state" role="status"><Spinner /><p>{text || t('loading')}</p></div>;
}

export function Skeleton({ h = 16, w = '100%', r = 8 }) {
  return <span className="skeleton" style={{ height: h, width: w, borderRadius: r }} />;
}

export function ProductSkeleton() {
  return (
    <div className="card pcard" aria-hidden="true">
      <Skeleton h={220} r={12} />
      <div style={{ padding: 14, display: 'grid', gap: 10 }}><Skeleton h={14} w="60%" /><Skeleton h={18} /><Skeleton h={22} w="40%" /></div>
    </div>
  );
}

export function EmptyState({ icon = 'package', title, text, action }) {
  return (
    <div className="state">
      <div className="state-icon"><Icon name={icon} size={40} /></div>
      <h3>{title}</h3>
      {text && <p className="muted">{text}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  const { t, errText } = useApp();
  return (
    <div className="state state-error" role="alert">
      <div className="state-icon"><Icon name="alert" size={40} /></div>
      <h3>{t('errorTitle')}</h3>
      <p className="muted">{error?.message && error.message !== 'server_error' && error.message !== 'network' ? errText(error) : t('errorText')}</p>
      {onRetry && <button className="btn btn-primary" onClick={onRetry}><Icon name="refresh" size={16} /> {t('retry')}</button>}
    </div>
  );
}

export function Stars({ value = 0, size = 16, count }) {
  return (
    <span className="stars" aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className="star-wrap" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox="0 0 24 24" className="star-bg"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
          <svg width={size} height={size} viewBox="0 0 24 24" className="star-fg" style={{ clipPath: `inset(0 ${100 - Math.max(0, Math.min(1, value - i + 1)) * 100}% 0 0)` }}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
        </span>
      ))}
      {count !== undefined && <span className="muted small">&nbsp;{value ? value.toFixed(1) : '—'} ({count})</span>}
    </span>
  );
}

export function StarInput({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="star-input" onMouseLeave={() => setHover(0)} role="radiogroup">
      {[1, 2, 3, 4, 5].map((i) => (
        <button type="button" key={i} role="radio" aria-checked={value === i} aria-label={`${i}`}
          className={(hover || value) >= i ? 'on' : ''} onMouseEnter={() => setHover(i)} onClick={() => onChange(i)}>★</button>
      ))}
    </div>
  );
}

export function PriceTag({ price, oldPrice, discount, large }) {
  const { price: fmt } = useApp();
  return (
    <div className={`price ${large ? 'price-lg' : ''}`}>
      <span className="price-now">{fmt(price)}</span>
      {oldPrice > price && <span className="price-old">{fmt(oldPrice)}</span>}
      {discount > 0 && oldPrice > price && <span className="badge badge-sale">−{discount}%</span>}
    </div>
  );
}

export function Badge({ children, tone = 'neutral' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

const TONES = { new: 'info', confirmed: 'info', shipped: 'warn', delivered: 'success', cancelled: 'danger', active: 'success', completed: 'neutral' };
export function StatusBadge({ status }) {
  const { t } = useApp();
  return <Badge tone={TONES[status] || 'neutral'}>{t('st_' + status)}</Badge>;
}

export function Modal({ open, onClose, title, children, wide }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head"><h3>{title}</h3><button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="x" /></button></div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, text, onConfirm, onClose }) {
  const { t } = useApp();
  return (
    <Modal open={open} onClose={onClose} title={t('areYouSure')}>
      <p>{text}</p>
      <div className="row-end"><button className="btn btn-ghost" onClick={onClose}>{t('no')}</button><button className="btn btn-danger" onClick={() => { onConfirm(); onClose(); }}>{t('yes')}</button></div>
    </Modal>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((tb) => (
        <button key={tb.value} role="tab" aria-selected={value === tb.value} className={value === tb.value ? 'active' : ''} onClick={() => onChange(tb.value)}>
          {tb.icon && <Icon name={tb.icon} size={16} />} {tb.label}{tb.count !== undefined && <span className="tab-count">{tb.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Pagination({ page, pages, onChange }) {
  const { t } = useApp();
  if (pages <= 1) return null;
  const nums = [];
  for (let i = 1; i <= pages; i++) if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i); else if (nums[nums.length - 1] !== '…') nums.push('…');
  return (
    <nav className="pagination" aria-label={t('page')}>
      <button className="btn btn-ghost" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label={t('prev')}><Icon name="left" size={16} /></button>
      {nums.map((n, i) => n === '…' ? <span key={'e' + i} className="muted">…</span> : (
        <button key={n} className={`btn ${n === page ? 'btn-primary' : 'btn-ghost'}`} onClick={() => onChange(n)} aria-current={n === page ? 'page' : undefined}>{n}</button>
      ))}
      <button className="btn btn-ghost" disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label={t('next')}><Icon name="right" size={16} /></button>
    </nav>
  );
}

export function BackButton({ fallback = '/' }) {
  const router = useRouter();
  const { t } = useApp();
  return (
    <button className="btn btn-ghost back-btn" onClick={() => (window.history.length > 1 ? router.back() : router.push(fallback))}>
      {t('back')}
    </button>
  );
}

export function Breadcrumbs({ items }) {
  return (
    <nav className="breadcrumbs" aria-label="breadcrumbs">
      {items.map((it, i) => (
        <span key={i}>
          {i > 0 && <Icon name="right" size={14} />}
          {it.href ? <Link href={it.href}>{it.label}</Link> : <span aria-current="page">{it.label}</span>}
        </span>
      ))}
    </nav>
  );
}

export function QuantitySelector({ value, onChange, max = 99 }) {
  return (
    <div className="qty">
      <button type="button" onClick={() => onChange(Math.max(1, value - 1))} disabled={value <= 1} aria-label="−"><Icon name="minus" size={16} /></button>
      <input type="number" min="1" max={max} value={value} onChange={(e) => onChange(Math.max(1, Math.min(max, Number(e.target.value) || 1)))} aria-label="qty" />
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="+"><Icon name="plus" size={16} /></button>
    </div>
  );
}

export function BrandIcon({ name, size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={BRAND_PATHS[name]} /></svg>;
}

export const SOCIAL = [
  { key: 'whatsapp', label: 'WhatsApp', href: () => `https://wa.me/${site.whatsapp}` },
  { key: 'instagram', label: 'Instagram', href: () => `https://www.instagram.com/${site.instagram}/` },
  { key: 'telegram', label: 'Telegram', href: () => `https://t.me/${site.telegram}` },
];

export function SocialLinks({ size = 20 }) {
  return (
    <div className="socials">
      {SOCIAL.map((s) => (
        <a key={s.key} href={s.href()} target="_blank" rel="noopener noreferrer" className={`social social-${s.key}`} aria-label={s.label} title={s.label}>
          <BrandIcon name={s.key} size={size} />
        </a>
      ))}
    </div>
  );
}

export function ShareButtons({ title }) {
  const { t } = useApp();
  const [url, setUrl] = useState('');
  useEffect(() => setUrl(window.location.href), []);
  const text = encodeURIComponent(`${title} — ${url}`);
  return (
    <div className="share">
      <span className="muted small">{t('share')}:</span>
      <a className="social social-whatsapp" href={`https://wa.me/?text=${text}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><BrandIcon name="whatsapp" size={18} /></a>
      <a className="social social-telegram" href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`} target="_blank" rel="noopener noreferrer" aria-label="Telegram"><BrandIcon name="telegram" size={18} /></a>
    </div>
  );
}

export function ScrollToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 600);
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  if (!show) return null;
  return <button className="to-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Top"><Icon name="up" /></button>;
}

export function WhatsAppFloat() {
  const { t } = useApp();
  return (
    <a className="wa-float" href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noopener noreferrer" aria-label={t('writeUs')} title={t('writeUs')}>
      <BrandIcon name="whatsapp" size={28} />
    </a>
  );
}

export function SectionHeader({ title, href, linkText }) {
  return (
    <div className="section-head">
      <h2>{title}</h2>
      {href && <Link href={href} className="link-more">{linkText} <Icon name="right" size={16} /></Link>}
    </div>
  );
}

export function Field({ label, error, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}
