import { getDb, saveDb } from '@/lib/db';
import { ok, fail, route, body } from '@/lib/api';

const STATUSES = ['active', 'completed', 'cancelled'];

// Owner may cancel; admin may set any status.
export const PATCH = route(async (req, { user, params }) => {
  const db = await getDb();
  const r = db.reservations.find((x) => x.id === Number(params.id));
  if (!r || (r.userId !== user.id && user.role !== 'admin')) return fail('not_found', 404);
  const { status } = await body(req);
  if (!STATUSES.includes(status)) return fail('invalid_status');
  if (user.role !== 'admin' && status !== 'cancelled') return fail('forbidden', 403);
  r.status = status;
  await saveDb(db);
  return ok(r);
}, { auth: true });
