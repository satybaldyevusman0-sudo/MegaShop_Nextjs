import { getDb, saveDb, nextId } from '@/lib/db';
import { ok, fail, route, body } from '@/lib/api';

export const dynamic = 'force-dynamic';

// Store reservations ("брондоо"): hold a product at a store for pickup on a chosen date/time.
export const GET = route(async (req, { user }) => {
  const db = await getDb();
  const all = user.role === 'admin' && new URL(req.url).searchParams.get('all') === '1';
  return ok({ items: db.reservations.filter((r) => all || r.userId === user.id).sort((a, b) => b.id - a.id) });
}, { auth: true });

export const POST = route(async (req, { user }) => {
  const b = await body(req);
  const db = await getDb();
  const product = db.products.find((p) => p.id === Number(b.productId));
  const store = db.stores.find((s) => s.id === Number(b.storeId));
  const qty = Math.floor(Number(b.qty) || 1);
  if (!product) return fail('not_found', 404);
  if (!store) return fail('store_required');
  if (product.stock < qty || qty < 1) return fail('out_of_stock', 409);
  const date = String(b.date || '');
  const time = String(b.time || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return fail('invalid_date');
  const when = new Date(`${date}T${time}:00`);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const limit = new Date(today); limit.setDate(limit.getDate() + 14);
  if (isNaN(when) || when < today || when > limit) return fail('invalid_date');
  const r = {
    id: nextId(db, 'reservations'), userId: user.id, userName: user.name, productId: product.id, title: product.title,
    thumbnail: product.thumbnail, price: product.price, qty, storeId: store.id, store: store.name, address: store.address,
    date, time, status: 'active', createdAt: new Date().toISOString(),
  };
  db.reservations.push(r);
  await saveDb(db);
  return ok(r, 201);
}, { auth: true });
