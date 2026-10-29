'use client';
import { useState } from 'react';
import Link from 'next/link';
import Icon from './Icon';
import { useApp } from './Providers';
import { api } from '@/lib/client';
import { useFetch } from '@/lib/useFetch';
import { CATEGORY_SLUGS } from '@/lib/i18n';
import { BackButton, Loader, ErrorState, EmptyState, Modal, ConfirmDialog, Field, StatusBadge, Pagination, Stars, Badge } from './ui';
import { ReservationList } from './Shop';

export function StatCard({ icon, label, value, tone = 'primary' }) {
  return (
    <div className="card stat">
      <span className="feature-icon" style={tone === 'warn' ? { background: 'color-mix(in srgb, var(--warn) 15%, transparent)', color: 'var(--warn)' } : undefined}><Icon name={icon} size={22} /></span>
      <div><span className="muted small">{label}</span><b>{value}</b></div>
    </div>
  );
}

export function DataTable({ columns, rows, empty }) {
  if (!rows.length) return <EmptyState icon="package" title={empty} />;
  return (
    <div className="table-wrap">
      <table className="table">
        <thead><tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}</tr></thead>
        <tbody>{rows.map((r) => <tr key={r.id}>{columns.map((c) => <td key={c.key}>{c.render ? c.render(r) : r[c.key]}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function Dashboard() {
  const { t, price, date } = useApp();
  const { data, loading, error, reload } = useFetch('/api/admin/stats');
  if (loading) return <Loader />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  return (
    <>
      <div className="stats">
        <StatCard icon="chart" label={t('revenue')} value={price(data.revenue)} />
        <StatCard icon="package" label={t('orders')} value={data.orders} />
        <StatCard icon="grid" label={t('catalog')} value={data.products} />
        <StatCard icon="users" label={t('users')} value={data.users} />
        <StatCard icon="store" label={t('reservations')} value={data.reservations} />
        <StatCard icon="message" label={t('reviews')} value={data.reviews} />
        <StatCard icon="alert" label={t('lowStock')} value={data.lowStock} tone="warn" />
      </div>
      <h3>{t('latestOrders')}</h3>
      <DataTable empty={t('noOrders')} rows={data.recentOrders} columns={[
        { key: 'id', label: '#', render: (o) => <Link className="link-more" href={`/order/${o.id}`}>{o.id}</Link> },
        { key: 'name', label: t('customer') },
        { key: 'total', label: t('total'), render: (o) => price(o.total) },
        { key: 'status', label: t('status'), render: (o) => <StatusBadge status={o.status} /> },
        { key: 'createdAt', label: t('date'), render: (o) => date(o.createdAt) },
      ]} />
    </>
  );
}

export function ProductForm({ product, onSaved, onClose }) {
  const { t, cat, errText, toast } = useApp();
  const [f, setF] = useState({
    title: product?.title || '', brand: product?.brand || '', category: product?.category || '', price: product?.price || '',
    oldPrice: product?.oldPrice || '', stock: product?.stock ?? 10, description: product?.description || '', images: (product?.images || []).join('\n'),
  });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const up = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const preview = f.images.split('\n').map((s) => s.trim()).filter((s) => /^https?:\/\//.test(s));
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const saved = await api(product ? `/api/products/${product.id}` : '/api/products', { method: product ? 'PUT' : 'POST', body: f });
      toast(t('saved')); onSaved(saved);
    } catch (e2) { setErr(errText(e2)); } finally { setBusy(false); }
  };
  return (
    <form className="stack" onSubmit={submit}>
      <div className="form-grid">
        <div className="full"><Field label={t('title')}><input required value={f.title} onChange={up('title')} /></Field></div>
        <Field label={t('brand')}><input value={f.brand} onChange={up('brand')} /></Field>
        <Field label={t('category')}>
          <select required value={f.category} onChange={up('category')}><option value="">—</option>{CATEGORY_SLUGS.map((s) => <option key={s} value={s}>{cat(s)}</option>)}</select>
        </Field>
        <Field label={`${t('price')} (сом)`}><input required type="number" min="1" value={f.price} onChange={up('price')} /></Field>
        <Field label={`${t('oldPrice')} (сом)`}><input type="number" min="0" value={f.oldPrice} onChange={up('oldPrice')} /></Field>
        <Field label={t('stock')}><input type="number" min="0" value={f.stock} onChange={up('stock')} /></Field>
        <div className="full"><Field label={t('description')}><textarea value={f.description} onChange={up('description')} /></Field></div>
        <div className="full"><Field label={t('imagesHint')}><textarea value={f.images} onChange={up('images')} placeholder="https://…" /></Field></div>
      </div>
      {preview.length > 0 && <div className="thumbs-row">{preview.map((s) => <img key={s} src={s} alt="" />)}</div>}
      {err && <div className="alert">{err}</div>}
      <div className="row-end"><button type="button" className="btn btn-ghost" onClick={onClose}>{t('cancel')}</button><button className="btn btn-primary" disabled={busy}>{t('save')}</button></div>
    </form>
  );
}

function ProductsAdmin() {
  const { t, cat, price, toast, errText } = useApp();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [edit, setEdit] = useState(null); // null | 'new' | product
  const [del, setDel] = useState(null);
  const { data, loading, error, reload } = useFetch(`/api/products?q=${encodeURIComponent(q)}&page=${page}&limit=15&sort=new`);
  const remove = async (p) => {
    try { await api(`/api/products/${p.id}`, { method: 'DELETE' }); toast(t('deleted')); reload(); } catch (e) { toast(errText(e), 'error'); }
  };
  return (
    <>
      <div className="toolbar">
        <input className="input" style={{ maxWidth: 320 }} placeholder={t('search')} value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        <button className="btn btn-primary" onClick={() => setEdit('new')}><Icon name="plus" size={18} /> {t('addProduct')}</button>
      </div>
      {loading && !data ? <Loader /> : error ? <ErrorState error={error} onRetry={reload} /> : (
        <>
          <DataTable empty={t('emptyTitle')} rows={data.items} columns={[
            { key: 'img', label: '', render: (p) => <img src={p.thumbnail} alt="" /> },
            { key: 'title', label: t('title'), render: (p) => <Link href={`/product/${p.id}`} className="link-more">{p.title}</Link> },
            { key: 'category', label: t('category'), render: (p) => cat(p.category) },
            { key: 'price', label: t('price'), render: (p) => price(p.price) },
            { key: 'stock', label: t('stock'), render: (p) => <Badge tone={p.stock < 10 ? 'warn' : 'success'}>{p.stock}</Badge> },
            { key: 'rating', label: t('rating'), render: (p) => <Stars value={p.rating} size={12} /> },
            { key: 'act', label: t('actions'), render: (p) => (
              <div className="actions">
                <button className="btn btn-ghost btn-sm" onClick={() => setEdit(p)} aria-label={t('edit')}><Icon name="edit" size={14} /></button>
                <button className="btn btn-ghost btn-sm" onClick={() => setDel(p)} aria-label={t('delete')}><Icon name="trash" size={14} /></button>
              </div>
            ) },
          ]} />
          <Pagination page={page} pages={data.pages} onChange={setPage} />
        </>
      )}
      <Modal wide open={!!edit} onClose={() => setEdit(null)} title={edit === 'new' ? t('addProduct') : t('editProduct')}>
        {edit && <ProductForm product={edit === 'new' ? null : edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); reload(); }} />}
      </Modal>
      <ConfirmDialog open={!!del} text={`${t('delete')}: ${del?.title}`} onConfirm={() => remove(del)} onClose={() => setDel(null)} />
    </>
  );
}

function OrdersAdmin() {
  const { t, price, date, toast, errText } = useApp();
  const { data, setData, loading, error, reload } = useFetch('/api/orders?all=1');
  if (loading) return <Loader />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const setStatus = async (o, status) => {
    try {
      const u = await api(`/api/orders/${o.id}`, { method: 'PATCH', body: { status } });
      setData({ items: data.items.map((x) => (x.id === u.id ? u : x)) });
      toast(t('saved'));
    } catch (e) { toast(errText(e), 'error'); }
  };
  return (
    <DataTable empty={t('noOrders')} rows={data.items} columns={[
      { key: 'id', label: '#', render: (o) => <Link className="link-more" href={`/order/${o.id}`}>{o.id}</Link> },
      { key: 'name', label: t('customer'), render: (o) => <>{o.name}<div className="muted small">{o.phone}</div></> },
      { key: 'items', label: t('items'), render: (o) => o.items.reduce((s, i) => s + i.qty, 0) },
      { key: 'delivery', label: t('delivery'), render: (o) => t(o.delivery === 'pickup' ? 'pickup' : 'courier') },
      { key: 'total', label: t('total'), render: (o) => price(o.total) },
      { key: 'date', label: t('date'), render: (o) => date(o.createdAt) },
      { key: 'status', label: t('status'), render: (o) => (
        <select value={o.status} onChange={(e) => setStatus(o, e.target.value)} aria-label={t('status')}>
          {['new', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((s) => <option key={s} value={s}>{t('st_' + s)}</option>)}
        </select>
      ) },
    ]} />
  );
}

function ReservationsAdmin() {
  const { t, toast, errText } = useApp();
  const { data, loading, error, reload } = useFetch('/api/reservations?all=1');
  if (loading) return <Loader />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (!data.items.length) return <EmptyState icon="store" title={t('noReservations')} />;
  const set = async (r, status) => {
    try { await api(`/api/reservations/${r.id}`, { method: 'PATCH', body: { status } }); reload(); toast(t('saved')); } catch (e) { toast(errText(e), 'error'); }
  };
  return (
    <>
      <ReservationList admin items={data.items} onCancel={(r) => set(r, 'cancelled')} />
      <p className="muted small" style={{ marginTop: 12 }}>{t('st_completed')}:</p>
      <div className="row">{data.items.filter((r) => r.status === 'active').map((r) => <button key={r.id} className="btn btn-ghost btn-sm" onClick={() => set(r, 'completed')}><Icon name="check" size={14} /> #{r.id}</button>)}</div>
    </>
  );
}

function UsersAdmin() {
  const { t, date, user: me, toast, errText } = useApp();
  const { data, loading, error, reload } = useFetch('/api/admin/users');
  const [del, setDel] = useState(null);
  if (loading) return <Loader />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const act = async (u, method, body) => {
    try { await api(`/api/admin/users/${u.id}`, { method, body }); reload(); toast(t('saved')); } catch (e) { toast(errText(e), 'error'); }
  };
  return (
    <>
      <DataTable empty="—" rows={data.items} columns={[
        { key: 'name', label: t('name'), render: (u) => <>{u.name}<div className="muted small">{u.email}</div></> },
        { key: 'phone', label: t('phone'), render: (u) => u.phone || '—' },
        { key: 'orders', label: t('orders') },
        { key: 'role', label: t('role'), render: (u) => <Badge tone={u.role === 'admin' ? 'info' : 'neutral'}>{u.role}</Badge> },
        { key: 'createdAt', label: t('date'), render: (u) => date(u.createdAt) },
        { key: 'act', label: t('actions'), render: (u) => u.id === me.id ? '—' : (
          <div className="actions">
            <button className="btn btn-ghost btn-sm" onClick={() => act(u, 'PATCH', { role: u.role === 'admin' ? 'user' : 'admin' })}>{t(u.role === 'admin' ? 'makeUser' : 'makeAdmin')}</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setDel(u)} aria-label={t('delete')}><Icon name="trash" size={14} /></button>
          </div>
        ) },
      ]} />
      <ConfirmDialog open={!!del} text={`${t('delete')}: ${del?.email}`} onConfirm={() => act(del, 'DELETE')} onClose={() => setDel(null)} />
    </>
  );
}

function ReviewsAdmin() {
  const { t, date, toast, errText } = useApp();
  const { data, loading, error, reload } = useFetch('/api/reviews?limit=100');
  if (loading) return <Loader />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const remove = async (r) => {
    try { await api(`/api/reviews/${r.id}`, { method: 'DELETE' }); reload(); toast(t('deleted')); } catch (e) { toast(errText(e), 'error'); }
  };
  return (
    <DataTable empty={t('noReviews')} rows={data.items} columns={[
      { key: 'product', label: t('title'), render: (r) => <Link className="link-more" href={`/product/${r.productId}`}>{r.productTitle}</Link> },
      { key: 'userName', label: t('customer') },
      { key: 'rating', label: t('rating'), render: (r) => <Stars value={r.rating} size={12} /> },
      { key: 'comment', label: t('comment') },
      { key: 'date', label: t('date'), render: (r) => date(r.createdAt) },
      { key: 'act', label: '', render: (r) => <button className="btn btn-ghost btn-sm" onClick={() => remove(r)} aria-label={t('delete')}><Icon name="trash" size={14} /></button> },
    ]} />
  );
}

export function AdminSidebar({ value, onChange }) {
  const { t } = useApp();
  const items = [['dashboard', 'chart'], ['catalog', 'grid'], ['orders', 'package'], ['reservations', 'store'], ['users', 'users'], ['reviews', 'message']];
  return (
    <nav className="card admin-nav">
      {items.map(([k, ic]) => <button key={k} className={value === k ? 'on' : ''} onClick={() => onChange(k)}><Icon name={ic} size={18} /> {t(k)}</button>)}
    </nav>
  );
}

export default function AdminPage() {
  const { t } = useApp();
  const [tab, setTab] = useState('dashboard');
  const views = { dashboard: Dashboard, catalog: ProductsAdmin, orders: OrdersAdmin, reservations: ReservationsAdmin, users: UsersAdmin, reviews: ReviewsAdmin };
  const View = views[tab];
  return (
    <div className="container">
      <BackButton />
      <h1 className="page-title">{t('admin')}</h1>
      <div className="admin">
        <AdminSidebar value={tab} onChange={setTab} />
        <div><View /></div>
      </div>
    </div>
  );
}
