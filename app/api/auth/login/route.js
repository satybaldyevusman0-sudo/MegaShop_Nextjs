import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { ok, fail, route, body, str } from '@/lib/api';
import { signToken, publicUser, COOKIE, cookieOptions } from '@/lib/auth';

export const POST = route(async (req) => {
  const b = await body(req);
  const email = str(b.email, 120).toLowerCase();
  const db = await getDb();
  const user = db.users.find((u) => u.email === email);
  if (!user || !(await bcrypt.compare(String(b.password || ''), user.passwordHash))) return fail('invalid_credentials', 401);
  const token = await signToken(user);
  const res = ok({ user: publicUser(user), token });
  res.cookies.set(COOKIE, token, cookieOptions());
  return res;
});
