import { getDb, saveDb } from '@/lib/db';
import { ok, fail, route, body } from '@/lib/api';

export const dynamic = 'force-dynamic';

const STATUSES = ['new', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export const GET = route(async (req, { user, params }) => {
  const db = await getDb();
  const o = db.orders.find((x) => x.id === Number(params.id));
  if (!o || (o.userId !== user.id && user.role !== 'admin')) return fail('not_found', 404);
  return ok(o);
}, { auth: true });

// Admin: any status. Owner: may only cancel a "new" order.
export const PATCH = route(async (req, { user, params }) => {
  const db = await getDb();
  const o = db.orders.find((x) => x.id === Number(params.id));
  if (!o || (o.userId !== user.id && user.role !== 'admin')) return fail('not_found', 404);
  const { status } = await body(req);
  if (!STATUSES.includes(status)) return fail('invalid_status');
  if (user.role !== 'admin' && !(status === 'cancelled' && o.status === 'new')) return fail('forbidden', 403);
  if (status === 'cancelled' && o.status !== 'cancelled') {
    o.items.forEach((i) => { const p = db.products.find((x) => x.id === i.id); if (p) p.stock += i.qty; });
  }
  o.status = status;
  await saveDb(db);
  return ok(o);
}, { auth: true });
