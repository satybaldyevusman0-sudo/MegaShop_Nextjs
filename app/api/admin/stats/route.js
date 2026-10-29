import { getDb } from '@/lib/db';
import { ok, route } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const GET = route(async () => {
  const db = await getDb();
  const live = db.orders.filter((o) => o.status !== 'cancelled');
  const byStatus = {};
  db.orders.forEach((o) => { byStatus[o.status] = (byStatus[o.status] || 0) + 1; });
  return ok({
    products: db.products.length,
    users: db.users.length,
    orders: db.orders.length,
    reservations: db.reservations.length,
    reviews: db.reviews.length,
    revenue: live.reduce((s, o) => s + o.total, 0),
    lowStock: db.products.filter((p) => p.stock < 10).length,
    byStatus,
    recentOrders: [...db.orders].sort((a, b) => b.id - a.id).slice(0, 5),
  });
}, { admin: true });
