import { getDb, saveDb } from '@/lib/db';
import { ok, fail, route, body } from '@/lib/api';
import { publicUser } from '@/lib/auth';

export const PATCH = route(async (req, { user, params }) => {
  const db = await getDb();
  const u = db.users.find((x) => x.id === Number(params.id));
  if (!u) return fail('not_found', 404);
  const { role } = await body(req);
  if (!['user', 'admin'].includes(role)) return fail('invalid_role');
  if (u.id === user.id) return fail('cannot_change_self', 409);
  u.role = role;
  await saveDb(db);
  return ok(publicUser(u));
}, { admin: true });

export const DELETE = route(async (req, { user, params }) => {
  const db = await getDb();
  const id = Number(params.id);
  if (id === user.id) return fail('cannot_change_self', 409);
  if (!db.users.some((u) => u.id === id)) return fail('not_found', 404);
  db.users = db.users.filter((u) => u.id !== id);
  db.favorites = db.favorites.filter((f) => f.userId !== id);
  await saveDb(db);
  return ok({ ok: true });
}, { admin: true });
