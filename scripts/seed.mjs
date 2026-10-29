// Generates data/seed.json from DummyJSON (product photos match titles exactly).
import { writeFileSync } from 'node:fs';
import bcrypt from 'bcryptjs';
import { applyPrices } from './apply-prices.mjs';

const RATE = 87.45; // USD -> KGS, NBKR 27.10.2026
const toKgs = (usd) => Math.max(10, Math.round((usd * RATE) / 10) * 10);

const res = await fetch('https://dummyjson.com/products?limit=0');
const { products } = await res.json();

const items = products.map((p) => {
  const price = toKgs(p.price * (1 - p.discountPercentage / 100));
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    category: p.category,
    brand: p.brand || 'MegaShop',
    price,
    oldPrice: p.discountPercentage >= 5 ? toKgs(p.price) : null,
    discount: Math.round(p.discountPercentage),
    stock: p.stock,
    sku: p.sku,
    tags: p.tags || [],
    warranty: p.warrantyInformation || '',
    shipping: p.shippingInformation || '',
    images: p.images,
    thumbnail: p.thumbnail,
    createdAt: p.meta?.createdAt || new Date().toISOString(),
  };
});

applyPrices(items); // verified current market prices override the catalog estimates

const reviews = [];
let rid = 1;
for (const p of products) {
  for (const r of p.reviews || []) {
    reviews.push({ id: rid++, productId: p.id, userId: null, userName: r.reviewerName, rating: r.rating, comment: r.comment, createdAt: r.date });
  }
}

const adminPass = process.env.ADMIN_PASSWORD || 'Admin12345';
const users = [
  { id: 1, name: 'Admin', email: process.env.ADMIN_EMAIL || 'admin@megashop.kg', phone: '', passwordHash: bcrypt.hashSync(adminPass, 10), role: 'admin', createdAt: new Date().toISOString() },
];

const stores = [
  { id: 1, name: 'MegaShop ЦУМ', address: 'Бишкек, пр. Чуй 155' },
  { id: 2, name: 'MegaShop Asia Mall', address: 'Бишкек, пр. Чуй 3/2' },
  { id: 3, name: 'MegaShop Ош', address: 'Ош, ул. Ленина 205' },
];

writeFileSync(new URL('../data/seed.json', import.meta.url), JSON.stringify({ products: items, reviews, users, orders: [], reservations: [], favorites: [], stores }, null, 0));
console.log(`Seeded ${items.length} products, ${reviews.length} reviews`);
