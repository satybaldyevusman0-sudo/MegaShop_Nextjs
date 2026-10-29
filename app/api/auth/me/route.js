import bcrypt from 'bcryptjs';
import { getDb, saveDb } from '@/lib/db';
import { ok, fail, route, body, str } from '@/lib/api';
import { publicUser } from '@/lib/auth';
import { isPhone } from '@/lib/validate';

export const dynamic = 'force-dynamic';

export const GET = route(async (req, { user }) => ok({ user: publicUser(user) }));

export const PUT = route(async (req, { user }) => {
  const b = await body(req);
  const db = await getDb();
  const u = db.users.find((x) => x.id === user.id);
  if (b.name !== undefined) { const n = str(b.name, 80); if (n.length < 2) return fail('name_required'); u.name = n; }
  if (b.phone !== undefined) { const p = str(b.phone, 30); if (p && !isPhone(p)) return fail('invalid_phone'); u.phone = p; }
  if (b.address !== undefined) u.address = str(b.address, 300);
  if (b.newPassword) {
    if (!(await bcrypt.compare(String(b.currentPassword || ''), u.passwordHash))) return fail('wrong_password', 401);
    if (String(b.newPassword).length < 6) return fail('weak_password');
    u.passwordHash = await bcrypt.hash(String(b.newPassword), 10);
  }
  await saveDb(db);
  return ok({ user: publicUser(u) });
}, { auth: true });
