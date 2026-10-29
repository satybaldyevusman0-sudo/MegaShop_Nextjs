'use client';
import Link from 'next/link';
import Icon from './Icon';
import { useApp } from './Providers';
import { PriceTag, Stars, ProductSkeleton, EmptyState, ErrorState } from './ui';

export function FavoriteButton({ id, className = '' }) {
  const { favIds, toggleFav, t } = useApp();
  const on = favIds.includes(id);
  return (
    <button className={`fav-btn ${on ? 'on' : ''} ${className}`} onClick={(e) => { e.preventDefault(); toggleFav(id); }} aria-pressed={on} aria-label={t('favorites')}>
      <Icon name="heart" fill={on ? 'currentColor' : 'none'} />
    </button>
  );
}

export function AddToCartButton({ product, qty = 1, full }) {
  const { addToCart, cart, t } = useApp();
  const inCart = cart.some((i) => i.id === product.id);
  if (product.stock <= 0) return <button className={`btn btn-ghost ${full ? 'btn-block' : ''}`} disabled>{t('outOfStock')}</button>;
  return (
    <button className={`btn ${inCart ? 'btn-success' : 'btn-primary'} ${full ? 'btn-block btn-lg' : ''}`} onClick={(e) => { e.preventDefault(); addToCart(product, qty); }}>
      <Icon name={inCart ? 'check' : 'cart'} size={18} /> {t(inCart ? 'inCart' : 'addToCart')}
    </button>
  );
}

export default function ProductCard({ p, view = 'grid' }) {
  const { cat, t } = useApp();
  return (
    <Link href={`/product/${p.id}`} className={`card pcard ${view === 'list' ? 'pcard-list' : ''}`}>
      <div className="pcard-img">
        <img src={p.thumbnail || p.images?.[0]} alt={p.title} loading="lazy" />
        {p.discount >= 10 && p.oldPrice > p.price && <span className="pcard-tag">−{p.discount}%</span>}
        {p.stock <= 0 && <span className="pcard-tag pcard-tag-out">{t('outOfStock')}</span>}
        <FavoriteButton id={p.id} className="pcard-fav" />
      </div>
      <div className="pcard-body">
        <span className="pcard-cat">{cat(p.category)} · {p.brand}</span>
        <h3 className="pcard-title">{p.title}</h3>
        <Stars value={p.rating} count={p.reviewsCount} size={14} />
        <PriceTag price={p.price} oldPrice={p.oldPrice} />
        {view === 'list' && <p className="muted small clamp-2">{p.description}</p>}
        <AddToCartButton product={p} />
      </div>
    </Link>
  );
}

export function ProductGrid({ items, loading, error, onRetry, view = 'grid', skeletons = 8, emptyAction }) {
  const { t } = useApp();
  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  if (loading) return <div className={`grid ${view === 'list' ? 'grid-list' : ''}`}>{Array.from({ length: skeletons }, (_, i) => <ProductSkeleton key={i} />)}</div>;
  if (!items?.length) return <EmptyState icon="search" title={t('emptyTitle')} text={t('emptyText')} action={emptyAction} />;
  return <div className={`grid ${view === 'list' ? 'grid-list' : ''}`}>{items.map((p) => <ProductCard key={p.id} p={p} view={view} />)}</div>;
}
