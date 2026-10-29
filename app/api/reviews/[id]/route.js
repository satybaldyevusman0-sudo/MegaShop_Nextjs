import { getDb, saveDb } from '@/lib/db';
import { ok, fail, route } from '@/lib/api';

export const DELETE = route(async (req, { user, params }) => {
  const db = await getDb();
  const r = db.reviews.find((x) => x.id === Number(params.id));
  if (!r) return fail('not_found', 404);
  if (user.role !== 'admin' && r.userId !== user.id) return fail('forbidden', 403);
  db.reviews = db.reviews.filter((x) => x !== r);
  await saveDb(db);
  return ok({ ok: true });
}, { auth: true });
