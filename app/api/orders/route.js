import { getDb, saveDb, nextId } from '@/lib/db';
import { ok, fail, route, body, str } from '@/lib/api';
import { isPhone } from '@/lib/validate';

export const dynamic = 'force-dynamic';

const FREE_SHIPPING_FROM = 5000;
const SHIPPING = 250;

// Users see their own orders; admins can pass ?all=1 to see every order.
export const GET = route(async (req, { user }) => {
  const db = await getDb();
  const all = user.role === 'admin' && new URL(req.url).searchParams.get('all') === '1';
  const items = db.orders.filter((o) => all || o.userId === user.id).sort((a, b) => b.id - a.id);
  return ok({ items });
}, { auth: true });

export const POST = route(async (req, { user }) => {
  const b = await body(req);
  const db = await getDb();
  const lines = Array.isArray(b.items) ? b.items : [];
  if (!lines.length) return fail('cart_empty');
  const name = str(b.name, 80);
  const phone = str(b.phone, 30);
  const delivery = b.delivery === 'pickup' ? 'pickup' : 'courier';
  const address = str(b.address, 300);
  const payment = ['cash', 'card', 'mbank', 'elsom'].includes(b.payment) ? b.payment : 'cash';
  if (name.length < 2) return fail('name_required');
  if (!isPhone(phone)) return fail('invalid_phone');
  if (delivery === 'courier' && address.length < 5) return fail('address_required');
  let store = null;
  if (delivery === 'pickup') {
    store = db.stores.find((s) => s.id === Number(b.storeId));
    if (!store) return fail('store_required');
  }

  const items = [];
  for (const l of lines) {
    const p = db.products.find((x) => x.id === Number(l.id));
    const qty = Math.floor(Number(l.qty));
    if (!p || !(qty > 0)) return fail('invalid_item');
    if (p.stock < qty) return fail('out_of_stock', 409);
    items.push({ id: p.id, title: p.title, thumbnail: p.thumbnail, price: p.price, qty });
  }
  items.forEach((i) => { db.products.find((p) => p.id === i.id).stock -= i.qty; });
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = delivery === 'pickup' || subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING;
  const order = {
    id: nextId(db, 'orders'), userId: user.id, items, subtotal, shipping, total: subtotal + shipping,
    name, phone, delivery, address: delivery === 'courier' ? address : store.address, store: store?.name || null,
    payment, comment: str(b.comment, 500), status: 'new', createdAt: new Date().toISOString(),
  };
  db.orders.push(order);
  await saveDb(db);
  return ok(order, 201);
}, { auth: true });
