import { getDb } from '@/lib/db';
import { ok, route } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const GET = route(async () => {
  const db = await getDb();
  const cats = {};
  const brands = {};
  for (const p of db.products) {
    cats[p.category] ??= { slug: p.category, count: 0, image: p.thumbnail };
    cats[p.category].count++;
    if (p.brand) brands[p.brand] = (brands[p.brand] || 0) + 1;
  }
  const prices = db.products.map((p) => p.price);
  return ok({
    categories: Object.values(cats).sort((a, b) => a.slug.localeCompare(b.slug)),
    brands: Object.entries(brands).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    priceRange: { min: prices.length ? Math.min(...prices) : 0, max: prices.length ? Math.max(...prices) : 0 },
    stores: db.stores,
  });
});
