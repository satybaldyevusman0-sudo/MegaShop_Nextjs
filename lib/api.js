import { NextResponse } from 'next/server';
import { getUser } from './auth';

export const ok = (data, status = 200) => NextResponse.json(data, { status });
export const fail = (error, status = 400) => NextResponse.json({ error }, { status });

// Wraps a route handler: catches errors and enforces auth / admin role.
export function route(handler, { auth = false, admin = false } = {}) {
  return async (req, ctx) => {
    try {
      const user = await getUser(req);
      if ((auth || admin) && !user) return fail('unauthorized', 401);
      if (admin && user.role !== 'admin') return fail('forbidden', 403);
      const params = ctx?.params ? await ctx.params : {};
      return await handler(req, { user, params });
    } catch (e) {
      console.error(e);
      return fail('server_error', 500);
    }
  };
}

export async function body(req) {
  try { return await req.json(); } catch { return {}; }
}

export const str = (v, max = 500) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
