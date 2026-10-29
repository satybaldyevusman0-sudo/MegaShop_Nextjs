import { ok } from '@/lib/api';
import { COOKIE } from '@/lib/auth';

export async function POST() {
  const res = ok({ ok: true });
  res.cookies.set(COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}
