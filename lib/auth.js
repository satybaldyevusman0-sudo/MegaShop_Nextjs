import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { getDb } from './db';

// In production a real JWT_SECRET is mandatory; the fallback only exists for local development.
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET && process.env.VERCEL) throw new Error('JWT_SECRET env variable is required');
const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-only-secret-change-me-in-production');
export const COOKIE = 'ms_token';

export async function signToken(user) {
  return new SignJWT({ sub: String(user.id), role: user.role, name: user.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

export async function getUser(req) {
  let token = (await cookies()).get(COOKIE)?.value;
  const h = req?.headers?.get('authorization');
  if (!token && h?.startsWith('Bearer ')) token = h.slice(7);
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    const db = await getDb();
    return db.users.find((u) => u.id === Number(payload.sub)) || null;
  } catch {
    return null;
  }
}

export const publicUser = (u) => u && { id: u.id, name: u.name, email: u.email, phone: u.phone, address: u.address || '', role: u.role, createdAt: u.createdAt };

export function cookieOptions() {
  return { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 7 };
}
