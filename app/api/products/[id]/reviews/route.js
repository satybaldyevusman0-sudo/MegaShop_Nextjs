import { getDb, saveDb, nextId, productRating } from '@/lib/db';
import { ok, fail, route, body, str } from '@/lib/api';

export const POST = route(async (req, { user, params }) => {
  const b = await body(req);
  const rating = Math.round(Number(b.rating));
  const comment = str(b.comment, 1000);
  if (!(rating >= 1 && rating <= 5)) return fail('invalid_rating');
  if (comment.length < 3) return fail('comment_too_short');
  const db = await getDb();
  const productId = Number(params.id);
  if (!db.products.some((p) => p.id === productId)) return fail('not_found', 404);
  if (db.reviews.some((r) => r.productId === productId && r.userId === user.id)) return fail('already_reviewed', 409);
  const review = { id: nextId(db, 'reviews'), productId, userId: user.id, userName: user.name, rating, comment, createdAt: new Date().toISOString() };
  db.reviews.push(review);
  await saveDb(db);
  return ok({ review, ...productRating(db, productId) }, 201);
}, { auth: true });
