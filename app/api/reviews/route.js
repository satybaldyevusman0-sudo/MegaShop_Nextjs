import { getDb } from '@/lib/db';
import { ok, route } from '@/lib/api';

export const dynamic = 'force-dynamic';

// Admin moderation list: latest reviews with product titles.
export const GET = route(async (req) => {
  const db = await getDb();
  const limit = Math.min(200, Number(new URL(req.url).searchParams.get('limit')) || 50);
  const titles = Object.fromEntries(db.products.map((p) => [p.id, p.title]));
  const items = [...db.reviews]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt) || b.id - a.id)
    .slice(0, limit)
    .map((r) => ({ ...r, productTitle: titles[r.productId] }));
  return ok({ items, total: db.reviews.length });
}, { admin: true });
