import { getDb } from '@/lib/db';
import { ok, route } from '@/lib/api';
import { publicUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const GET = route(async () => {
  const db = await getDb();
  return ok({ items: db.users.map((u) => ({ ...publicUser(u), orders: db.orders.filter((o) => o.userId === u.id).length })) });
}, { admin: true });
