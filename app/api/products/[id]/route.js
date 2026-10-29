import { getDb, saveDb, withRating } from '@/lib/db';
import { ok, fail, route, body } from '@/lib/api';
import { validateProduct } from '@/lib/validate';

export const dynamic = 'force-dynamic';

export const GET = route(async (req, { params }) => {
  const db = await getDb();
  const p = db.products.find((x) => x.id === Number(params.id));
  if (!p) return fail('not_found', 404);
  const reviews = db.reviews.filter((r) => r.productId === p.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const related = db.products.filter((x) => x.category === p.category && x.id !== p.id).slice(0, 8).map((x) => withRating(db, x));
  return ok({ product: withRating(db, p), reviews, related });
});

export const PUT = route(async (req, { params }) => {
  const db = await getDb();
  const p = db.products.find((x) => x.id === Number(params.id));
  if (!p) return fail('not_found', 404);
  const { data, error } = validateProduct(await body(req), true);
  if (error) return fail(error);
  Object.assign(p, data);
  p.discount = p.oldPrice ? Math.max(0, Math.round((1 - p.price / p.oldPrice) * 100)) : 0;
  await saveDb(db);
  return ok(withRating(db, p));
}, { admin: true });

export const DELETE = route(async (req, { params }) => {
  const db = await getDb();
  const id = Number(params.id);
  if (!db.products.some((x) => x.id === id)) return fail('not_found', 404);
  db.products = db.products.filter((x) => x.id !== id);
  db.reviews = db.reviews.filter((r) => r.productId !== id);
  db.favorites = db.favorites.filter((f) => f.productId !== id);
  await saveDb(db);
  return ok({ ok: true });
}, { admin: true });
