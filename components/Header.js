'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import Icon from './Icon';
import { useApp } from './Providers';
import { api, site } from '@/lib/client';
import { LANGS, CATEGORY_SLUGS } from '@/lib/i18n';
import { SocialLinks } from './ui';

export function Logo() {
  return (
    <Link href="/" className="logo" aria-label="MegaShop">
      <span className="logo-mark">M</span>
      <span className="logo-text">Mega<b>Shop</b></span>
    </Link>
  );
}

export function SearchBar({ onDone }) {
  const { t, price } = useApp();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const box = useRef(null);

  useEffect(() => {
    if (q.trim().length < 2) { setItems([]); return; }
    setLoading(true);
    const id = setTimeout(() => {
      api(`/api/products?q=${encodeURIComponent(q.trim())}&limit=6`)
        .then((d) => setItems(d.items)).catch(() => setItems([])).finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(id);
  }, [q]);

  useEffect(() => {
    const on = (e) => box.current && !box.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', on);
    return () => document.removeEventListener('mousedown', on);
  }, []);

  const submit = (e) => {
    e.preventDefault();
    setOpen(false);
    router.push(`/catalog?q=${encodeURIComponent(q.trim())}`);
    onDone?.();
  };

  return (
    <form className="search" onSubmit={submit} ref={box} role="search">
      <Icon name="search" size={18} className="search-icon" />
      <input value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} placeholder={t('searchPlaceholder')} aria-label={t('search')} />
      <button className="btn btn-primary search-btn" type="submit">{t('search')}</button>
      {open && q.trim().length >= 2 && (
        <div className="suggest">
          {loading && !items.length ? <div className="suggest-empty">{t('loading')}</div> :
            !items.length ? <div className="suggest-empty">{t('noSuggestions')}</div> : (
              <>
                {items.map((p) => (
                  <Link key={p.id} href={`/product/${p.id}`} className="suggest-item" onClick={() => { setOpen(false); onDone?.(); }}>
                    <img src={p.thumbnail} alt={p.title} width="44" height="44" />
                    <span className="suggest-title">{p.title}</span>
                    <b>{price(p.price)}</b>
                  </Link>
                ))}
                <button type="submit" className="suggest-all">{t('showAll')} →</button>
              </>
            )}
        </div>
      )}
    </form>
  );
}

export function LangSwitcher() {
  const { lang, setLang, t } = useApp();
  return (
    <div className="lang" role="group" aria-label={t('language')}>
      {LANGS.map((l) => (
        <button key={l.code} className={lang === l.code ? 'active' : ''} onClick={() => setLang(l.code)} title={l.label} aria-pressed={lang === l.code}>{l.short}</button>
      ))}
    </div>
  );
}

export function ThemeToggle() {
  const { theme, setTheme, t } = useApp();
  const dark = theme === 'dark';
  return (
    <button className="icon-btn" onClick={() => setTheme(dark ? 'light' : 'dark')} aria-label={t(dark ? 'themeLight' : 'themeDark')} title={t(dark ? 'themeLight' : 'themeDark')}>
      <Icon name={dark ? 'sun' : 'moon'} />
    </button>
  );
}

export function UserMenu() {
  const { user, logout, t } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const on = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', on);
    return () => document.removeEventListener('mousedown', on);
  }, []);
  if (!user) return <Link href="/login" className="icon-btn hdr-link" aria-label={t('login')}><Icon name="user" /><span className="hide-sm">{t('login')}</span></Link>;
  return (
    <div className="dropdown" ref={ref}>
      <button className="icon-btn hdr-link" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="avatar">{user.name[0]?.toUpperCase()}</span><span className="hide-sm">{user.name.split(' ')[0]}</span>
      </button>
      {open && (
        <div className="dropdown-menu" onClick={() => setOpen(false)}>
          <Link href="/profile"><Icon name="user" size={16} /> {t('profile')}</Link>
          <Link href="/profile?tab=orders"><Icon name="package" size={16} /> {t('myOrders')}</Link>
          <Link href="/favorites"><Icon name="heart" size={16} /> {t('favorites')}</Link>
          {user.role === 'admin' && <Link href="/admin"><Icon name="settings" size={16} /> {t('admin')}</Link>}
          <button onClick={logout}><Icon name="logout" size={16} /> {t('logout')}</button>
        </div>
      )}
    </div>
  );
}

export function CategoryNav() {
  const { cat } = useApp();
  const top = ['smartphones', 'laptops', 'tablets', 'mobile-accessories', 'mens-watches', 'womens-dresses', 'womens-bags', 'fragrances', 'furniture', 'kitchen-accessories', 'sports-accessories', 'groceries'];
  return (
    <nav className="catnav" aria-label="categories">
      <div className="container catnav-inner">
        {top.map((s) => <Link key={s} href={`/catalog?category=${s}`}>{cat(s)}</Link>)}
      </div>
    </nav>
  );
}

export function MobileMenu({ open, onClose }) {
  const { t, cat, user } = useApp();
  const path = usePathname();
  useEffect(() => { onClose(); }, [path]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!open) return null;
  return (
    <div className="drawer-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="drawer" aria-label={t('menu')}>
        <div className="drawer-head"><Logo /><button className="icon-btn" onClick={onClose} aria-label={t('close')}><Icon name="x" /></button></div>
        <SearchBar onDone={onClose} />
        <div className="drawer-row"><LangSwitcher /><ThemeToggle /></div>
        <nav className="drawer-nav">
          <Link href="/">{t('home')}</Link>
          <Link href="/catalog">{t('catalog')}</Link>
          <Link href="/catalog?sale=1&sort=discount">{t('deals')}</Link>
          <Link href="/favorites">{t('favorites')}</Link>
          <Link href="/cart">{t('cart')}</Link>
          {user ? <Link href="/profile">{t('profile')}</Link> : <Link href="/login">{t('login')}</Link>}
          {user?.role === 'admin' && <Link href="/admin">{t('admin')}</Link>}
        </nav>
        <h4 className="drawer-sub">{t('categories')}</h4>
        <nav className="drawer-nav drawer-cats">
          {CATEGORY_SLUGS.map((s) => <Link key={s} href={`/catalog?category=${s}`}>{cat(s)}</Link>)}
        </nav>
        <SocialLinks />
      </aside>
    </div>
  );
}

export default function Header() {
  const { t, cartCount, favIds } = useApp();
  const [menu, setMenu] = useState(false);
  return (
    <header className="header">
      <div className="topbar">
        <div className="container topbar-inner">
          <span className="hide-sm"><Icon name="phone" size={14} /> {site.phone}</span>
          <span className="hide-sm"><Icon name="truck" size={14} /> {t('featShipping')} — {t('featShippingText')}</span>
          <SocialLinks size={16} />
        </div>
      </div>
      <div className="container header-main">
        <button className="icon-btn show-md" onClick={() => setMenu(true)} aria-label={t('menu')}><Icon name="menu" /></button>
        <Logo />
        <Link href="/catalog" className="btn btn-primary hide-md catalog-btn"><Icon name="grid" size={18} /> {t('catalog')}</Link>
        <div className="hide-md header-search"><SearchBar /></div>
        <div className="header-actions">
          <span className="hide-md"><LangSwitcher /></span>
          <span className="hide-md"><ThemeToggle /></span>
          <Link href="/favorites" className="icon-btn badge-host" aria-label={t('favorites')}>
            <Icon name="heart" />{favIds.length > 0 && <span className="count">{favIds.length}</span>}
          </Link>
          <Link href="/cart" className="icon-btn badge-host" aria-label={t('cart')}>
            <Icon name="cart" />{cartCount > 0 && <span className="count">{cartCount}</span>}
          </Link>
          <UserMenu />
        </div>
      </div>
      <div className="container show-md mobile-search"><SearchBar /></div>
      <CategoryNav />
      <MobileMenu open={menu} onClose={() => setMenu(false)} />
    </header>
  );
}
