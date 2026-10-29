import { getDb, saveDb, withRating } from '@/lib/db';
import { ok, fail, route, body } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const GET = route(async (req, { user }) => {
  const db = await getDb();
  const ids = db.favorites.filter((f) => f.userId === user.id).map((f) => f.productId);
  return ok({ ids, items: db.products.filter((p) => ids.includes(p.id)).map((p) => withRating(db, p)) });
}, { auth: true });

// Toggles a product in the user's favorites.
export const POST = route(async (req, { user }) => {
  const productId = Number((await body(req)).productId);
  const db = await getDb();
  if (!db.products.some((p) => p.id === productId)) return fail('not_found', 404);
  const exists = db.favorites.some((f) => f.userId === user.id && f.productId === productId);
  db.favorites = exists
    ? db.favorites.filter((f) => !(f.userId === user.id && f.productId === productId))
    : [...db.favorites, { userId: user.id, productId }];
  await saveDb(db);
  return ok({ favorite: !exists, ids: db.favorites.filter((f) => f.userId === user.id).map((f) => f.productId) });
}, { auth: true });
