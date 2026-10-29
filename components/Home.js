'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Icon from './Icon';
import { useApp } from './Providers';
import { useFetch } from '@/lib/useFetch';
import { ProductGrid } from './ProductCard';
import { SectionHeader, Skeleton, ErrorState } from './ui';

const SLIDES = [
  { title: 'heroTitle1', text: 'heroText1', cta: 'shopNow', href: '/catalog', img: 'https://cdn.dummyjson.com/product-images/smartphones/iphone-13-pro/1.webp', cls: 'hero-a' },
  { title: 'heroTitle2', text: 'heroText2', cta: 'viewDeals', href: '/catalog?sale=1&sort=discount', img: 'https://cdn.dummyjson.com/product-images/laptops/apple-macbook-pro-14-inch-space-grey/1.webp', cls: 'hero-b' },
  { title: 'heroTitle3', text: 'heroText3', cta: 'shopNow', href: '/catalog?category=mens-watches', img: 'https://cdn.dummyjson.com/product-images/mens-watches/rolex-submariner-watch/1.webp', cls: 'hero-c' },
];

export function HeroSlider() {
  const { t } = useApp();
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % SLIDES.length), 6000);
    return () => clearInterval(id);
  }, []);
  const s = SLIDES[i];
  return (
    <section className={`hero ${s.cls}`} aria-roledescription="carousel">
      <div className="hero-text" key={i}>
        <h1>{t(s.title)}</h1>
        <p>{t(s.text)}</p>
        <Link href={s.href} className="btn btn-light btn-lg">{t(s.cta)} <Icon name="right" size={18} /></Link>
      </div>
      <img className="hero-img" src={s.img} alt="" key={'img' + i} />
      <button className="hero-nav hero-prev" onClick={() => setI((i + SLIDES.length - 1) % SLIDES.length)} aria-label={t('prev')}><Icon name="left" /></button>
      <button className="hero-nav hero-next" onClick={() => setI((i + 1) % SLIDES.length)} aria-label={t('next')}><Icon name="right" /></button>
      <div className="hero-dots">{SLIDES.map((_, k) => <button key={k} className={k === i ? 'on' : ''} onClick={() => setI(k)} aria-label={`${k + 1}`} />)}</div>
    </section>
  );
}

export function FeatureBar() {
  const { t } = useApp();
  const items = [['truck', 'featShipping', 'featShippingText'], ['refresh', 'featReturn', 'featReturnText'], ['shield', 'featSecure', 'featSecureText'], ['headset', 'featSupport', 'featSupportText']];
  return (
    <section className="features">
      {items.map(([ic, a, b]) => (
        <div key={a} className="feature"><span className="feature-icon"><Icon name={ic} size={24} /></span><div><b>{t(a)}</b><span className="muted small">{t(b)}</span></div></div>
      ))}
    </section>
  );
}

export function CategoryGrid({ categories, loading }) {
  const { t, cat } = useApp();
  return (
    <section className="section">
      <SectionHeader title={t('popularCategories')} href="/catalog" linkText={t('allCategories')} />
      <div className="cat-grid">
        {loading ? Array.from({ length: 12 }, (_, i) => <Skeleton key={i} h={150} r={16} />) :
          categories.map((c) => (
            <Link key={c.slug} href={`/catalog?category=${c.slug}`} className="cat-tile">
              <img src={c.image} alt={cat(c.slug)} loading="lazy" />
              <span className="cat-name">{cat(c.slug)}</span>
              <span className="muted small">{c.count} {t('products')}</span>
            </Link>
          ))}
      </div>
    </section>
  );
}

export function BrandStrip({ brands }) {
  const { t } = useApp();
  if (!brands?.length) return null;
  return (
    <section className="section">
      <SectionHeader title={t('brands')} />
      <div className="brand-strip">
        {brands.slice(0, 18).map((b) => <Link key={b.name} href={`/catalog?brand=${encodeURIComponent(b.name)}`} className="brand-chip">{b.name}</Link>)}
      </div>
    </section>
  );
}

export function Newsletter() {
  const { t, toast } = useApp();
  const [email, setEmail] = useState('');
  return (
    <section className="newsletter">
      <div><h2>{t('newsletterTitle')}</h2><p>{t('newsletterText')}</p></div>
      <form onSubmit={(e) => { e.preventDefault(); if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast(t('subscribed')); setEmail(''); } else toast(t('err_invalid_email'), 'error'); }}>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" aria-label="Email" required />
        <button className="btn btn-light">{t('subscribe')}</button>
      </form>
    </section>
  );
}

export function ProductRow({ title, query, href, linkText }) {
  const { data, loading, error, reload } = useFetch(`/api/products?${query}&limit=8`);
  return (
    <section className="section">
      <SectionHeader title={title} href={href} linkText={linkText} />
      <ProductGrid items={data?.items} loading={loading} error={error} onRetry={reload} skeletons={4} />
    </section>
  );
}

export default function HomePage() {
  const { t } = useApp();
  const { data, loading, error, reload } = useFetch('/api/categories');
  return (
    <div className="container">
      <HeroSlider />
      <FeatureBar />
      {error ? <ErrorState error={error} onRetry={reload} /> : <CategoryGrid categories={data?.categories || []} loading={loading} />}
      <ProductRow title={t('hotDeals')} query="sale=1&sort=discount" href="/catalog?sale=1&sort=discount" linkText={t('showAll')} />
      <ProductRow title={t('topRated')} query="sort=rating&category=smartphones&category=laptops&category=tablets&category=mens-watches" href="/catalog?sort=rating" linkText={t('showAll')} />
      <Newsletter />
      <ProductRow title={t('newArrivals')} query="sort=new" href="/catalog?sort=new" linkText={t('showAll')} />
      <BrandStrip brands={data?.brands} />
    </div>
  );
}
