'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Icon from './Icon';
import { useApp } from './Providers';
import { useFetch } from '@/lib/useFetch';
import { ProductGrid } from './ProductCard';
import { Pagination, Breadcrumbs, Skeleton, Stars } from './ui';

const SORTS = ['popular', 'price_asc', 'price_desc', 'rating', 'new', 'discount'];

export function PriceRangeFilter({ min, max, onApply }) {
  const { t } = useApp();
  const [a, setA] = useState(min || '');
  const [b, setB] = useState(max || '');
  useEffect(() => { setA(min || ''); setB(max || ''); }, [min, max]);
  return (
    <form className="filter-group" onSubmit={(e) => { e.preventDefault(); onApply(a, b); }}>
      <h4>{t('price')}</h4>
      <div className="price-inputs">
        <input className="input" type="number" min="0" placeholder={t('from')} value={a} onChange={(e) => setA(e.target.value)} aria-label={t('from')} />
        <input className="input" type="number" min="0" placeholder={t('to')} value={b} onChange={(e) => setB(e.target.value)} aria-label={t('to')} />
      </div>
      <button className="btn btn-ghost btn-sm btn-block" style={{ marginTop: 8 }}>{t('apply')}</button>
    </form>
  );
}

export function FilterSidebar({ meta, loading, params, set, toggle, collapsed }) {
  const { t, cat } = useApp();
  const selCats = params.getAll('category');
  const selBrands = params.getAll('brand');
  const [brandQ, setBrandQ] = useState('');
  if (loading) return <aside className="filters panel"><Skeleton h={200} /><Skeleton h={200} /></aside>;
  const brands = (meta?.brands || []).filter((b) => b.name.toLowerCase().includes(brandQ.toLowerCase()));
  return (
    <aside className={`filters panel ${collapsed ? 'collapsed' : ''}`} aria-label={t('filters')}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0 }}><Icon name="filter" size={18} /> {t('filters')}</h3>
        <button className="btn btn-ghost btn-sm" onClick={() => set({ category: null, brand: null, minPrice: null, maxPrice: null, rating: null, inStock: null, sale: null, q: null })}>{t('reset')}</button>
      </div>
      <div className="filter-group">
        <h4>{t('categories')}</h4>
        <div className="filter-list">
          {meta?.categories.map((c) => (
            <label key={c.slug} className="check"><input type="checkbox" checked={selCats.includes(c.slug)} onChange={() => toggle('category', c.slug)} /><span>{cat(c.slug)}</span><span>{c.count}</span></label>
          ))}
        </div>
      </div>
      <PriceRangeFilter min={params.get('minPrice')} max={params.get('maxPrice')} onApply={(a, b) => set({ minPrice: a || null, maxPrice: b || null })} />
      <div className="filter-group">
        <h4>{t('rating')}</h4>
        {[4.5, 4, 3].map((r) => (
          <label key={r} className="check"><input type="radio" name="rating" checked={params.get('rating') === String(r)} onChange={() => set({ rating: String(r) })} /><Stars value={r} size={14} /><span className="small">{r} {t('andUp')}</span></label>
        ))}
      </div>
      <div className="filter-group">
        <label className="check"><input type="checkbox" checked={params.get('inStock') === '1'} onChange={(e) => set({ inStock: e.target.checked ? '1' : null })} /> {t('onlyInStock')}</label>
        <label className="check"><input type="checkbox" checked={params.get('sale') === '1'} onChange={(e) => set({ sale: e.target.checked ? '1' : null })} /> {t('onlySale')}</label>
      </div>
      <div className="filter-group">
        <h4>{t('brands')}</h4>
        <input className="input" placeholder={t('search')} value={brandQ} onChange={(e) => setBrandQ(e.target.value)} style={{ marginBottom: 8, minHeight: 36 }} />
        <div className="filter-list">
          {brands.map((b) => (
            <label key={b.name} className="check"><input type="checkbox" checked={selBrands.includes(b.name)} onChange={() => toggle('brand', b.name)} /><span>{b.name}</span><span>{b.count}</span></label>
          ))}
        </div>
      </div>
    </aside>
  );
}

export function SortSelect({ value, onChange }) {
  const { t } = useApp();
  return (
    <label className="row small"><span className="muted hide-sm">{t('sortBy')}:</span>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)} aria-label={t('sortBy')}>
        {SORTS.map((s) => <option key={s} value={s}>{t('sort_' + s)}</option>)}
      </select>
    </label>
  );
}

export function ActiveFilters({ params, toggle, set }) {
  const { cat, t, price } = useApp();
  const chips = [];
  if (params.get('q')) chips.push(['q', params.get('q'), `«${params.get('q')}»`]);
  params.getAll('category').forEach((c) => chips.push(['category', c, cat(c)]));
  params.getAll('brand').forEach((b) => chips.push(['brand', b, b]));
  if (params.get('minPrice')) chips.push(['minPrice', null, `${t('from')} ${price(params.get('minPrice'))}`]);
  if (params.get('maxPrice')) chips.push(['maxPrice', null, `${t('to')} ${price(params.get('maxPrice'))}`]);
  if (params.get('rating')) chips.push(['rating', null, `★ ${params.get('rating')}+`]);
  if (params.get('sale')) chips.push(['sale', null, t('onlySale')]);
  if (params.get('inStock')) chips.push(['inStock', null, t('onlyInStock')]);
  if (!chips.length) return null;
  return (
    <div className="chips">
      {chips.map(([k, v, label]) => (
        <button key={k + (v || '')} className="chip" onClick={() => (v && k !== 'q' ? toggle(k, v) : set({ [k]: null }))}>{label} <Icon name="x" size={14} /></button>
      ))}
    </div>
  );
}

export default function Catalog() {
  const { t, cat } = useApp();
  const router = useRouter();
  const params = useSearchParams();
  const [view, setView] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const meta = useFetch('/api/categories');

  const qs = new URLSearchParams(params);
  if (!qs.get('limit')) qs.set('limit', '12');
  const { data, loading, error, reload } = useFetch(`/api/products?${qs}`);

  const push = (p) => { p.delete('page'); router.push(`/catalog?${p}`, { scroll: false }); };
  const set = (obj) => {
    const p = new URLSearchParams(params);
    Object.entries(obj).forEach(([k, v]) => (v === null || v === '' ? p.delete(k) : p.set(k, v)));
    push(p);
  };
  const toggle = (k, v) => {
    const p = new URLSearchParams(params);
    const cur = p.getAll(k);
    p.delete(k);
    (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]).forEach((x) => p.append(k, x));
    push(p);
  };
  const page = Number(params.get('page')) || 1;
  const cats = params.getAll('category');
  const title = params.get('q') ? `${t('search')}: «${params.get('q')}»` : cats.length === 1 ? cat(cats[0]) : params.get('sale') ? t('deals') : t('catalog');

  return (
    <div className="container">
      <div style={{ marginTop: 20 }}><Breadcrumbs items={[{ label: t('home'), href: '/' }, { label: t('catalog'), href: cats.length === 1 ? '/catalog' : undefined }, ...(cats.length === 1 ? [{ label: cat(cats[0]) }] : [])]} /></div>
      <h1 className="page-title">{title}</h1>
      <div className="catalog">
        <FilterSidebar meta={meta.data} loading={meta.loading} params={params} set={set} toggle={toggle} collapsed={!showFilters} />
        <div>
          <div className="toolbar">
            <div className="row">
              <button className="btn btn-ghost filter-toggle" onClick={() => setShowFilters(!showFilters)}><Icon name="filter" size={16} /> {t('filters')}</button>
              <span className="muted">{t('found')}: <b>{data?.total ?? '…'}</b></span>
            </div>
            <div className="row">
              <SortSelect value={params.get('sort') || 'popular'} onChange={(v) => set({ sort: v })} />
              <div className="view-toggle">
                <button className={view === 'grid' ? 'on' : ''} onClick={() => setView('grid')} aria-label={t('grid')}><Icon name="grid" size={18} /></button>
                <button className={view === 'list' ? 'on' : ''} onClick={() => setView('list')} aria-label={t('list')}><Icon name="list" size={18} /></button>
              </div>
            </div>
          </div>
          <ActiveFilters params={params} toggle={toggle} set={set} />
          <ProductGrid items={data?.items} loading={loading} error={error} onRetry={reload} view={view}
            emptyAction={<button className="btn btn-primary" onClick={() => router.push('/catalog')}>{t('reset')}</button>} />
          {data && <Pagination page={page} pages={data.pages} onChange={(n) => { const p = new URLSearchParams(params); p.set('page', n); router.push(`/catalog?${p}`); }} />}
        </div>
      </div>
    </div>
  );
}
