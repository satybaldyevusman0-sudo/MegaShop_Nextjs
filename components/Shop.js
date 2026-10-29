'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Icon from './Icon';
import { useApp } from './Providers';
import { api } from '@/lib/client';
import { useFetch } from '@/lib/useFetch';
import { ProductGrid } from './ProductCard';
import { BackButton, Loader, EmptyState, ErrorState, QuantitySelector, Field, StatusBadge, Tabs, ConfirmDialog } from './ui';

const FREE_FROM = 5000;
const SHIPPING = 250;

export function AuthGuard({ children, admin }) {
  const { user, authLoading, t } = useApp();
  const router = useRouter();
  useEffect(() => {
    if (!authLoading && !user) router.replace(`/login?next=${encodeURIComponent(location.pathname + location.search)}`);
  }, [authLoading, user, router]);
  if (authLoading || !user) return <div className="container"><Loader /></div>;
  if (admin && user.role !== 'admin') return <div className="container"><EmptyState icon="shield" title={t('err_forbidden')} action={<Link className="btn btn-primary" href="/">{t('home')}</Link>} /></div>;
  return children;
}

export function CartItem({ item }) {
  const { setQty, removeFromCart, price, t } = useApp();
  return (
    <div className="cart-item">
      <Link href={`/product/${item.id}`}><img src={item.thumbnail} alt={item.title} /></Link>
      <div>
        <Link href={`/product/${item.id}`} className="cart-item-title">{item.title}</Link>
        <div className="muted small">{price(item.price)} × {item.qty}</div>
      </div>
      <div className="cart-item-side">
        <QuantitySelector value={item.qty} onChange={(q) => setQty(item.id, q)} max={item.stock ?? 99} />
        <b>{price(item.price * item.qty)}</b>
        <button className="btn btn-ghost btn-sm" onClick={() => removeFromCart(item.id)}><Icon name="trash" size={14} /> {t('remove')}</button>
      </div>
    </div>
  );
}

export function OrderSummary({ delivery = 'courier', children }) {
  const { cart, cartTotal, price, t } = useApp();
  const shipping = delivery === 'pickup' || cartTotal >= FREE_FROM ? 0 : SHIPPING;
  return (
    <aside className="card summary panel">
      <h3 style={{ margin: 0 }}>{t('total')}</h3>
      <div className="mini-items">
        {cart.map((i) => <div key={i.id} className="mini-item"><img src={i.thumbnail} alt="" /><span>{i.title} × {i.qty}</span><b>{price(i.price * i.qty)}</b></div>)}
      </div>
      <div className="summary-row"><span className="muted">{t('subtotal')}</span><span>{price(cartTotal)}</span></div>
      <div className="summary-row"><span className="muted">{t('shipping')}</span><span>{shipping ? price(shipping) : t('free')}</span></div>
      {delivery === 'courier' && cartTotal < FREE_FROM && (
        <div className="stack" style={{ gap: 6 }}><span className="small muted">{t('freeShipLeft')}: <b>{price(FREE_FROM - cartTotal)}</b></span><div className="progress"><span style={{ width: `${(cartTotal / FREE_FROM) * 100}%` }} /></div></div>
      )}
      <div className="summary-row summary-total"><span>{t('total')}</span><span>{price(cartTotal + shipping)}</span></div>
      {children}
    </aside>
  );
}

export function CartPage() {
  const { cart, clearCart, t } = useApp();
  const router = useRouter();
  return (
    <div className="container">
      <BackButton fallback="/catalog" />
      <h1 className="page-title">{t('cart')}</h1>
      {!cart.length ? (
        <EmptyState icon="cart" title={t('cartEmpty')} text={t('cartEmptyText')} action={<Link href="/catalog" className="btn btn-primary">{t('goCatalog')}</Link>} />
      ) : (
        <div className="two-col">
          <div className="panel">
            {cart.map((i) => <CartItem key={i.id} item={i} />)}
            <div className="row-end"><button className="btn btn-ghost" onClick={clearCart}><Icon name="trash" size={16} /> {t('clearCart')}</button></div>
          </div>
          <OrderSummary><button className="btn btn-primary btn-lg btn-block" onClick={() => router.push('/checkout')}>{t('checkout')} <Icon name="right" size={18} /></button></OrderSummary>
        </div>
      )}
    </div>
  );
}

export function CheckoutPage() {
  const { cart, clearCart, user, t, errText } = useApp();
  const router = useRouter();
  const stores = useFetch('/api/stores');
  const [f, setF] = useState({ name: user?.name || '', phone: user?.phone || '', address: user?.address || '', delivery: 'courier', storeId: '', payment: 'cash', comment: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const up = (k) => (e) => setF({ ...f, [k]: e.target.value });

  if (!cart.length) return <div className="container"><BackButton fallback="/cart" /><EmptyState icon="cart" title={t('cartEmpty')} action={<Link href="/catalog" className="btn btn-primary">{t('goCatalog')}</Link>} /></div>;

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      const order = await api('/api/orders', { method: 'POST', body: { ...f, items: cart.map((i) => ({ id: i.id, qty: i.qty })) } });
      clearCart();
      router.push(`/order/${order.id}?success=1`);
    } catch (e2) { setErr(errText(e2)); setBusy(false); }
  };
  const radio = (name, value, label, icon) => (
    <label className={`radio-card ${f[name] === value ? 'on' : ''}`}><input type="radio" name={name} value={value} checked={f[name] === value} onChange={up(name)} />{icon && <Icon name={icon} size={18} />}{label}</label>
  );
  return (
    <div className="container">
      <BackButton fallback="/cart" />
      <h1 className="page-title">{t('checkout')}</h1>
      <form className="two-col" onSubmit={submit}>
        <div className="stack">
          <div className="panel stack">
            <h3 style={{ margin: 0 }}>{t('contactInfo')}</h3>
            <div className="form-grid">
              <Field label={t('name')}><input required minLength={2} value={f.name} onChange={up('name')} autoComplete="name" /></Field>
              <Field label={t('phone')}><input required type="tel" placeholder="+996 700 123 456" value={f.phone} onChange={up('phone')} autoComplete="tel" /></Field>
            </div>
          </div>
          <div className="panel stack">
            <h3 style={{ margin: 0 }}>{t('delivery')}</h3>
            <div className="radio-cards">{radio('delivery', 'courier', t('courier'), 'truck')}{radio('delivery', 'pickup', t('pickup'), 'store')}</div>
            {f.delivery === 'courier' ? (
              <Field label={t('address')}><input required minLength={5} value={f.address} onChange={up('address')} autoComplete="street-address" /></Field>
            ) : (
              <Field label={t('store')}>
                <select required value={f.storeId} onChange={up('storeId')}><option value="">—</option>{stores.data?.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.address}</option>)}</select>
              </Field>
            )}
          </div>
          <div className="panel stack">
            <h3 style={{ margin: 0 }}>{t('payment')}</h3>
            <div className="radio-cards">{['cash', 'card', 'mbank', 'elsom'].map((p) => <span key={p}>{radio('payment', p, t('pay_' + p))}</span>)}</div>
            <Field label={t('comment')}><textarea value={f.comment} onChange={up('comment')} maxLength={500} /></Field>
          </div>
          {err && <div className="alert">{err}</div>}
        </div>
        <OrderSummary delivery={f.delivery}>
          <button className="btn btn-primary btn-lg btn-block" disabled={busy}>{busy ? t('loading') : t('placeOrder')}</button>
        </OrderSummary>
      </form>
    </div>
  );
}

export function OrderCard({ o }) {
  const { t, price, date } = useApp();
  return (
    <Link href={`/order/${o.id}`} className="card order-card">
      <div className="order-card-head"><b>{t('orderNo')}{o.id}</b><StatusBadge status={o.status} /></div>
      <div className="thumbs-row">{o.items.slice(0, 6).map((i) => <img key={i.id} src={i.thumbnail} alt={i.title} />)}</div>
      <div className="order-card-head"><span className="muted small">{date(o.createdAt)} · {o.items.reduce((s, i) => s + i.qty, 0)} {t('products')}</span><b>{price(o.total)}</b></div>
    </Link>
  );
}

export function OrderDetail({ id }) {
  const { t, price, date, errText, toast } = useApp();
  const params = useSearchParams();
  const { data: o, setData, loading, error, reload } = useFetch(`/api/orders/${id}`);
  const [confirm, setConfirm] = useState(false);
  if (loading) return <div className="container"><BackButton fallback="/profile" /><Loader /></div>;
  if (error) return <div className="container"><BackButton fallback="/profile" /><ErrorState error={error} onRetry={reload} /></div>;
  const cancel = async () => {
    try { setData(await api(`/api/orders/${id}`, { method: 'PATCH', body: { status: 'cancelled' } })); toast(t('st_cancelled')); } catch (e) { toast(errText(e), 'error'); }
  };
  return (
    <div className="container">
      <BackButton fallback="/profile" />
      {params.get('success') && (
        <div className="card success-box">
          <div className="success-icon"><Icon name="check" size={40} /></div>
          <h1>{t('orderSuccess')}</h1>
          <p className="muted">{t('orderSuccessText')}</p>
        </div>
      )}
      <div className="two-col" style={{ marginTop: 16 }}>
        <div className="panel">
          <div className="order-card-head"><h2 style={{ margin: 0 }}>{t('orderNo')}{o.id}</h2><StatusBadge status={o.status} /></div>
          <p className="muted small">{date(o.createdAt)}</p>
          {o.items.map((i) => (
            <div key={i.id} className="cart-item">
              <Link href={`/product/${i.id}`}><img src={i.thumbnail} alt={i.title} /></Link>
              <div><Link href={`/product/${i.id}`} className="cart-item-title">{i.title}</Link><div className="muted small">{price(i.price)} × {i.qty}</div></div>
              <b>{price(i.price * i.qty)}</b>
            </div>
          ))}
        </div>
        <aside className="panel stack">
          <div className="summary-row"><span className="muted">{t('name')}</span><span>{o.name}</span></div>
          <div className="summary-row"><span className="muted">{t('phone')}</span><span>{o.phone}</span></div>
          <div className="summary-row"><span className="muted">{t('delivery')}</span><span>{t(o.delivery === 'pickup' ? 'pickup' : 'courier')}</span></div>
          <div className="summary-row"><span className="muted">{t('address')}</span><span style={{ textAlign: 'right' }}>{o.store ? `${o.store}, ` : ''}{o.address}</span></div>
          <div className="summary-row"><span className="muted">{t('payment')}</span><span>{t('pay_' + o.payment)}</span></div>
          <div className="summary-row"><span className="muted">{t('subtotal')}</span><span>{price(o.subtotal)}</span></div>
          <div className="summary-row"><span className="muted">{t('shipping')}</span><span>{o.shipping ? price(o.shipping) : t('free')}</span></div>
          <div className="summary-row summary-total"><span>{t('total')}</span><span>{price(o.total)}</span></div>
          {o.status === 'new' && <button className="btn btn-ghost" onClick={() => setConfirm(true)}>{t('cancelOrder')}</button>}
        </aside>
      </div>
      <ConfirmDialog open={confirm} text={t('cancelOrder') + '?'} onConfirm={cancel} onClose={() => setConfirm(false)} />
    </div>
  );
}

export function AuthForm({ mode }) {
  const { login, register, t, errText } = useApp();
  const router = useRouter();
  const params = useSearchParams();
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const up = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const next = params.get('next');
  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      const u = mode === 'login' ? await login(f.email, f.password) : await register(f);
      router.push(next && next.startsWith('/') ? next : u.role === 'admin' ? '/admin' : '/profile');
    } catch (e2) { setErr(errText(e2)); setBusy(false); }
  };
  return (
    <div className="container">
      <BackButton />
      <form className="card panel auth stack" onSubmit={submit}>
        <h1>{mode === 'login' ? t('welcomeBack') : t('createAccount')}</h1>
        {mode === 'register' && <Field label={t('name')}><input required minLength={2} value={f.name} onChange={up('name')} autoComplete="name" /></Field>}
        <Field label={t('email')}><input required type="email" value={f.email} onChange={up('email')} autoComplete="email" /></Field>
        {mode === 'register' && <Field label={t('phone')}><input type="tel" value={f.phone} onChange={up('phone')} placeholder="+996 700 123 456" autoComplete="tel" /></Field>}
        <Field label={t('password')}><input required type="password" minLength={6} value={f.password} onChange={up('password')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></Field>
        {err && <div className="alert" role="alert">{err}</div>}
        <button className="btn btn-primary btn-lg btn-block" disabled={busy}>{busy ? t('loading') : t(mode === 'login' ? 'login' : 'register')}</button>
        <p className="muted" style={{ textAlign: 'center', margin: 0 }}>
          {mode === 'login' ? <>{t('noAccount')} <Link className="link-more" href={`/register${next ? `?next=${encodeURIComponent(next)}` : ''}`}>{t('register')}</Link></> : <>{t('haveAccount')} <Link className="link-more" href="/login">{t('login')}</Link></>}
        </p>
      </form>
    </div>
  );
}

export function ProfileSettings() {
  const { user, setUser, t, errText, toast } = useApp();
  const [f, setF] = useState({ name: user.name, phone: user.phone || '', address: user.address || '', currentPassword: '', newPassword: '' });
  const [err, setErr] = useState('');
  const up = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setErr('');
    try { const d = await api('/api/auth/me', { method: 'PUT', body: f }); setUser(d.user); setF({ ...f, currentPassword: '', newPassword: '' }); toast(t('saved')); } catch (e2) { setErr(errText(e2)); }
  };
  return (
    <form className="panel stack" onSubmit={submit} style={{ maxWidth: 640 }}>
      <div className="form-grid">
        <Field label={t('name')}><input required value={f.name} onChange={up('name')} /></Field>
        <Field label={t('phone')}><input type="tel" value={f.phone} onChange={up('phone')} /></Field>
        <div className="full"><Field label={t('address')}><input value={f.address} onChange={up('address')} /></Field></div>
        <Field label={t('currentPassword')}><input type="password" value={f.currentPassword} onChange={up('currentPassword')} autoComplete="current-password" /></Field>
        <Field label={t('newPassword')}><input type="password" minLength={6} value={f.newPassword} onChange={up('newPassword')} autoComplete="new-password" /></Field>
      </div>
      {err && <div className="alert">{err}</div>}
      <div><button className="btn btn-primary">{t('save')}</button></div>
    </form>
  );
}

export function ReservationList({ items, onCancel, admin }) {
  const { t, price, date } = useApp();
  return (
    <div className="list-card">
      {items.map((r) => (
        <div key={r.id} className="card order-card">
          <div className="order-card-head"><b>#{r.id} · {r.store}</b><StatusBadge status={r.status} /></div>
          <div className="mini-item"><img src={r.thumbnail} alt="" /><Link href={`/product/${r.productId}`}>{r.title} × {r.qty}</Link><b>{price(r.price * r.qty)}</b></div>
          <div className="order-card-head">
            <span className="muted small"><Icon name="calendar" size={14} /> {date(r.date)} {r.time} · {r.address}{admin ? ` · ${r.userName}` : ''}</span>
            {r.status === 'active' && onCancel && <button className="btn btn-ghost btn-sm" onClick={() => onCancel(r)}>{t('cancel')}</button>}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProfilePage() {
  const { user, t, date, logout, errText, toast } = useApp();
  const params = useSearchParams();
  const [tab, setTab] = useState(params.get('tab') || 'orders');
  const orders = useFetch('/api/orders');
  const res = useFetch('/api/reservations');
  const cancelRes = async (r) => {
    try { await api(`/api/reservations/${r.id}`, { method: 'PATCH', body: { status: 'cancelled' } }); res.reload(); toast(t('st_cancelled')); } catch (e) { toast(errText(e), 'error'); }
  };
  return (
    <div className="container">
      <BackButton />
      <div className="profile-head">
        <span className="avatar">{user.name[0]?.toUpperCase()}</span>
        <div><h1 style={{ margin: 0 }}>{user.name}</h1><span className="muted">{user.email} · {date(user.createdAt)}</span></div>
        <button className="btn btn-ghost" style={{ marginLeft: 'auto' }} onClick={logout}><Icon name="logout" size={16} /> <span className="hide-sm">{t('logout')}</span></button>
      </div>
      <Tabs value={tab} onChange={setTab} tabs={[
        { value: 'orders', label: t('myOrders'), icon: 'package', count: orders.data?.items.length },
        { value: 'reservations', label: t('myReservations'), icon: 'store', count: res.data?.items.length },
        { value: 'settings', label: t('settings'), icon: 'settings' },
      ]} />
      {tab === 'orders' && (orders.loading ? <Loader /> : orders.error ? <ErrorState error={orders.error} onRetry={orders.reload} /> :
        !orders.data.items.length ? <EmptyState icon="package" title={t('noOrders')} action={<Link href="/catalog" className="btn btn-primary">{t('goCatalog')}</Link>} /> :
          <div className="list-card">{orders.data.items.map((o) => <OrderCard key={o.id} o={o} />)}</div>)}
      {tab === 'reservations' && (res.loading ? <Loader /> : res.error ? <ErrorState error={res.error} onRetry={res.reload} /> :
        !res.data.items.length ? <EmptyState icon="store" title={t('noReservations')} /> : <ReservationList items={res.data.items} onCancel={cancelRes} />)}
      {tab === 'settings' && <ProfileSettings />}
    </div>
  );
}

export function FavoritesPage() {
  const { t, favIds } = useApp();
  const { data, loading, error, reload } = useFetch('/api/favorites');
  useEffect(() => { reload(); }, [favIds.length, reload]);
  return (
    <div className="container">
      <BackButton />
      <h1 className="page-title">{t('favorites')}</h1>
      {!loading && !error && !data?.items.length
        ? <EmptyState icon="heart" title={t('noFavorites')} text={t('noFavoritesText')} action={<Link href="/catalog" className="btn btn-primary">{t('goCatalog')}</Link>} />
        : <ProductGrid items={data?.items} loading={loading && !data} error={error} onRetry={reload} skeletons={4} />}
    </div>
  );
}
