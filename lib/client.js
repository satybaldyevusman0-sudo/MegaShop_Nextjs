'use client';
// Thin fetch wrapper for the app's REST API. Throws Error(code) with code from { error }.
export async function api(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'same-origin',
      cache: 'no-store',
    });
  } catch {
    throw new Error('network');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'server_error');
    err.status = res.status;
    throw err;
  }
  return data;
}

export const site = {
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || '996774054601',
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM || 'satyba1dyev18',
  telegram: process.env.NEXT_PUBLIC_TELEGRAM || '+996774054601',
  phone: process.env.NEXT_PUBLIC_PHONE || '+996 774 054 601',
};
