import bcrypt from 'bcryptjs';
import { getDb, saveDb, nextId } from '@/lib/db';
import { ok, fail, route, body, str } from '@/lib/api';
import { signToken, publicUser, COOKIE, cookieOptions } from '@/lib/auth';
import { isEmail } from '@/lib/validate';

export const POST = route(async (req) => {
  const b = await body(req);
  const name = str(b.name, 80);
  const email = str(b.email, 120).toLowerCase();
  const password = typeof b.password === 'string' ? b.password : '';
  if (name.length < 2) return fail('name_required');
  if (!isEmail(email)) return fail('invalid_email');
  if (password.length < 6) return fail('weak_password');
  const db = await getDb();
  if (db.users.some((u) => u.email === email)) return fail('email_taken', 409);
  const user = { id: nextId(db, 'users'), name, email, phone: str(b.phone, 30), address: '', passwordHash: await bcrypt.hash(password, 10), role: 'user', createdAt: new Date().toISOString() };
  db.users.push(user);
  await saveDb(db);
  const token = await signToken(user);
  const res = ok({ user: publicUser(user), token }, 201);
  res.cookies.set(COOKIE, token, cookieOptions());
  return res;
});
