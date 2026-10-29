// End-to-end API test. Usage: BASE=http://localhost:3000 node scripts/api-test.mjs
const BASE = process.env.BASE || 'http://localhost:3000';
const ADMIN = { email: process.env.ADMIN_EMAIL || 'admin@megashop.kg', password: process.env.ADMIN_PASSWORD || 'Admin12345' };
let pass = 0, fail = 0;

async function call(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}
function check(name, cond, extra = '') {
  if (cond) { pass++; console.log('  ✓', name); } else { fail++; console.log('  ✗', name, extra); }
}

const r1 = await call('/api/products?limit=5');
check('products list', r1.status === 200 && r1.data.items.length === 5 && r1.data.total > 0);
const r2 = await call('/api/products?q=iphone');
check('search "iphone"', r2.data.items.length > 0 && r2.data.items.every((p) => /iphone/i.test(p.title + p.tags)));
const r3 = await call('/api/products?category=laptops&sort=price_asc&limit=50');
check('filter category + sort', r3.data.items.every((p) => p.category === 'laptops') && r3.data.items.every((p, i, a) => !i || a[i - 1].price <= p.price));
const r4 = await call('/api/products?minPrice=10000&maxPrice=50000&rating=4&limit=200');
check('filter price + rating', r4.data.items.every((p) => p.price >= 10000 && p.price <= 50000 && p.rating >= 4));
const pid = r1.data.items[0].id;
const r5 = await call(`/api/products/${pid}`);
check('product detail with reviews', r5.status === 200 && Array.isArray(r5.data.reviews) && r5.data.product.images.length > 0);
check('product 404', (await call('/api/products/999999')).status === 404);
check('categories', (await call('/api/categories')).data.categories.length >= 20);

check('orders require auth', (await call('/api/orders')).status === 401);
const email = `test${Date.now()}@example.com`;
const reg = await call('/api/auth/register', { method: 'POST', body: { name: 'Test User', email, password: 'secret12', phone: '+996700123456' } });
check('register', reg.status === 201 && reg.data.token);
check('duplicate email rejected', (await call('/api/auth/register', { method: 'POST', body: { name: 'Xavier', email, password: 'secret12' } })).status === 409);
check('wrong password rejected', (await call('/api/auth/login', { method: 'POST', body: { email, password: 'nope' } })).status === 401);
const login = await call('/api/auth/login', { method: 'POST', body: { email, password: 'secret12' } });
const token = login.data.token;
check('login + JWT', login.status === 200 && token);
check('me', (await call('/api/auth/me', { token })).data.user.email === email);

const fav = await call('/api/favorites', { method: 'POST', token, body: { productId: pid } });
check('favorite toggle on', fav.data.favorite === true);
check('favorites list', (await call('/api/favorites', { token })).data.items.some((p) => p.id === pid));

const rev = await call(`/api/products/${pid}/reviews`, { method: 'POST', token, body: { rating: 5, comment: 'Excellent product!' } });
check('add review', rev.status === 201 && rev.data.reviewsCount > 0);
check('second review blocked', (await call(`/api/products/${pid}/reviews`, { method: 'POST', token, body: { rating: 4, comment: 'again' } })).status === 409);

const stockBefore = r5.data.product.stock;
const order = await call('/api/orders', { method: 'POST', token, body: { name: 'Test User', phone: '+996700123456', delivery: 'courier', address: 'Bishkek, Chui 1', payment: 'cash', items: [{ id: pid, qty: 2 }] } });
check('create order', order.status === 201 && order.data.total > 0);
check('stock decreased', (await call(`/api/products/${pid}`)).data.product.stock === stockBefore - 2);
check('invalid order rejected', (await call('/api/orders', { method: 'POST', token, body: { name: 'T', phone: '1', items: [] } })).status === 400);
check('my orders', (await call('/api/orders', { token })).data.items.length === 1);
check('user cannot ship order', (await call(`/api/orders/${order.data.id}`, { method: 'PATCH', token, body: { status: 'shipped' } })).status === 403);
check('user cancels order', (await call(`/api/orders/${order.data.id}`, { method: 'PATCH', token, body: { status: 'cancelled' } })).data.status === 'cancelled');
check('stock restored', (await call(`/api/products/${pid}`)).data.product.stock === stockBefore);

const d = new Date(Date.now() + 2 * 864e5).toISOString().slice(0, 10);
const res = await call('/api/reservations', { method: 'POST', token, body: { productId: pid, storeId: 1, date: d, time: '14:00', qty: 1 } });
check('reservation', res.status === 201);
check('reservation bad date', (await call('/api/reservations', { method: 'POST', token, body: { productId: pid, storeId: 1, date: '2020-01-01', time: '14:00' } })).status === 400);

check('user blocked from admin', (await call('/api/admin/stats', { token })).status === 403);
check('user cannot create product', (await call('/api/products', { method: 'POST', token, body: { title: 'x', price: 1, category: 'beauty' } })).status === 403);

const al = await call('/api/auth/login', { method: 'POST', body: ADMIN });
const at = al.data.token;
check('admin login', al.status === 200 && al.data.user.role === 'admin');
check('admin stats', (await call('/api/admin/stats', { token: at })).data.products > 0);
const np = await call('/api/products', { method: 'POST', token: at, body: { title: 'Test Product', price: 1500, oldPrice: 2000, category: 'beauty', stock: 3, images: 'https://cdn.dummyjson.com/product-images/beauty/red-lipstick/1.webp' } });
check('admin create product', np.status === 201 && np.data.discount === 25);
const up = await call(`/api/products/${np.data.id}`, { method: 'PUT', token: at, body: { price: 1200 } });
check('admin update product', up.data.price === 1200);
check('admin delete product', (await call(`/api/products/${np.data.id}`, { method: 'DELETE', token: at })).status === 200);
check('deleted product 404', (await call(`/api/products/${np.data.id}`)).status === 404);
check('admin sees all orders', (await call('/api/orders?all=1', { token: at })).data.items.length >= 1);
check('admin users list', (await call('/api/admin/users', { token: at })).data.items.some((u) => u.email === email));
check('admin deletes review', (await call(`/api/reviews/${rev.data.review.id}`, { method: 'DELETE', token: at })).status === 200);
const uid = reg.data.user.id;
check('admin deletes user', (await call(`/api/admin/users/${uid}`, { method: 'DELETE', token: at })).status === 200);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
