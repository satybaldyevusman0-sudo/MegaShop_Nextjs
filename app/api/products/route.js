import { getDb, saveDb, nextId, withRating } from '@/lib/db';
import { ok, fail, route, body } from '@/lib/api';
import { validateProduct } from '@/lib/validate';

export const dynamic = 'force-dynamic';

export const GET = route(async (req) => {
  const db = await getDb();
  const sp = new URL(req.url).searchParams;
  const q = (sp.get('q') || '').toLowerCase().trim();
  const cats = sp.getAll('category').filter(Boolean);
  const brands = sp.getAll('brand').filter(Boolean);
  const min = Number(sp.get('minPrice')) || 0;
  const max = Number(sp.get('maxPrice')) || Infinity;
  const minRating = Number(sp.get('rating')) || 0;
  const inStock = sp.get('inStock') === '1';
  const onSale = sp.get('sale') === '1';
  const ids = sp.get('ids') ? sp.get('ids').split(',').map(Number) : null;
  const sort = sp.get('sort') || 'popular';
  const page = Math.max(1, Number(sp.get('page')) || 1);
  const limit = Math.min(200, Math.max(1, Number(sp.get('limit')) || 12));

  const list = db.products.map((p) => withRating(db, p)).filter((p) =>
    (!q || [p.title, p.brand, p.category, ...(p.tags || [])].join(' ').toLowerCase().includes(q)) &&
    (!cats.length || cats.includes(p.category)) &&
    (!brands.length || brands.includes(p.brand)) &&
    p.price >= min && p.price <= max &&
    p.rating >= minRating &&
    (!inStock || p.stock > 0) &&
    (!onSale || p.discount >= 10) &&
    (!ids || ids.includes(p.id))
  );
  const sorters = {
    popular: (a, b) => b.reviewsCount * b.rating - a.reviewsCount * a.rating || b.rating - a.rating || a.id - b.id,
    price_asc: (a, b) => a.price - b.price,
    price_desc: (a, b) => b.price - a.price,
    rating: (a, b) => b.rating - a.rating,
    new: (a, b) => new Date(b.createdAt) - new Date(a.createdAt) || b.id - a.id,
    discount: (a, b) => b.discount - a.discount,
  };
  list.sort(sorters[sort] || sorters.popular);
  const total = list.length;
  return ok({ items: list.slice((page - 1) * limit, page * limit), total, page, pages: Math.max(1, Math.ceil(total / limit)) });
});

export const POST = route(async (req) => {
  const { data, error } = validateProduct(await body(req));
  if (error) return fail(error);
  const db = await getDb();
  const product = { brand: '', description: '', stock: 0, oldPrice: null, discount: 0, images: [], thumbnail: '', tags: [], warranty: '', shipping: '', ...data, id: nextId(db, 'products'), createdAt: new Date().toISOString() };
  db.products.push(product);
  await saveDb(db);
  return ok(withRating(db, product), 201);
}, { admin: true });
