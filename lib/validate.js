import { str } from './api';

export function validateProduct(b, partial = false) {
  const p = {};
  if (!partial || b.title !== undefined) { p.title = str(b.title, 120); if (!p.title) return { error: 'title_required' }; }
  if (!partial || b.price !== undefined) { p.price = Number(b.price); if (!(p.price > 0)) return { error: 'invalid_price' }; }
  if (!partial || b.category !== undefined) { p.category = str(b.category, 60); if (!p.category) return { error: 'category_required' }; }
  if (b.description !== undefined) p.description = str(b.description, 3000);
  if (b.brand !== undefined) p.brand = str(b.brand, 60);
  if (b.oldPrice !== undefined) p.oldPrice = Number(b.oldPrice) > 0 ? Number(b.oldPrice) : null;
  if (b.stock !== undefined) p.stock = Math.max(0, Math.floor(Number(b.stock) || 0));
  if (b.images !== undefined) {
    const imgs = (Array.isArray(b.images) ? b.images : String(b.images).split('\n')).map((s) => str(s, 500)).filter((s) => /^https?:\/\//.test(s));
    p.images = imgs;
    p.thumbnail = imgs[0] || '';
  }
  if (p.oldPrice && p.price) p.discount = Math.max(0, Math.round((1 - p.price / p.oldPrice) * 100));
  return { data: p };
}

export const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
export const isPhone = (s) => /^\+?[0-9\s()-]{9,20}$/.test(s);
