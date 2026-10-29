'use client';
import Link from 'next/link';
import { useApp } from './Providers';
import { Logo } from './Header';
import { SocialLinks, SOCIAL, BrandIcon } from './ui';
import Icon from './Icon';
import { site } from '@/lib/client';

export default function Footer() {
  const { t, cat } = useApp();
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <Logo />
          <p className="muted footer-about">{t('aboutText')}</p>
          <SocialLinks size={22} />
        </div>
        <div>
          <h4>{t('catalog')}</h4>
          {['smartphones', 'laptops', 'fragrances', 'furniture', 'womens-dresses', 'sports-accessories'].map((s) => (
            <Link key={s} href={`/catalog?category=${s}`}>{cat(s)}</Link>
          ))}
        </div>
        <div>
          <h4>{t('customers')}</h4>
          <Link href="/profile?tab=orders">{t('myOrders')}</Link>
          <Link href="/profile?tab=reservations">{t('myReservations')}</Link>
          <Link href="/favorites">{t('favorites')}</Link>
          <Link href="/cart">{t('cart')}</Link>
          <Link href="/catalog?sale=1&sort=discount">{t('deals')}</Link>
        </div>
        <div>
          <h4>{t('contacts')}</h4>
          <a href={`tel:${site.phone.replace(/\s/g, '')}`}><Icon name="phone" size={14} /> {site.phone}</a>
          <span className="muted"><Icon name="pin" size={14} /> Бишкек, пр. Чуй 155</span>
          {SOCIAL.map((s) => (
            <a key={s.key} href={s.href()} target="_blank" rel="noopener noreferrer"><BrandIcon name={s.key} size={14} /> {s.label}</a>
          ))}
        </div>
      </div>
      <div className="container footer-bottom muted small">© {new Date().getFullYear()} MegaShop. {t('rights')}.</div>
    </footer>
  );
}
