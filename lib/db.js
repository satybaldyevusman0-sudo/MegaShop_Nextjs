// JSON document store. Local: data/db.json. Vercel: Upstash Redis if configured, else /tmp (ephemeral).
import { promises as fs } from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';

const SEED = path.join(process.cwd(), 'data', 'seed.json');
const FILE = process.env.VERCEL ? '/tmp/megashop-db.json' : path.join(process.cwd(), 'data', 'db.json');
const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const KV_KEY = 'megashop-db';

let cache = null;

async function kv(cmd) {
  const r = await fetch(KV_URL, { method: 'POST', headers: { Authorization: `Bearer ${KV_TOKEN}` }, body: JSON.stringify(cmd), cache: 'no-store' });
  if (!r.ok) throw new Error('KV error ' + r.status);
  return (await r.json()).result;
}

// Fresh database from seed; admin credentials can be overridden via env so a public deploy never keeps the test password.
async function readSeed() {
  const db = JSON.parse(await fs.readFile(SEED, 'utf8'));
  const admin = db.users.find((u) => u.role === 'admin');
  if (admin && process.env.ADMIN_EMAIL) admin.email = process.env.ADMIN_EMAIL.toLowerCase();
  if (admin && process.env.ADMIN_PASSWORD) admin.passwordHash = bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10);
  return db;
}

export async function getDb() {
  if (KV_URL && KV_TOKEN) {
    const raw = await kv(['GET', KV_KEY]);
    if (raw) return (cache = JSON.parse(raw));
    cache = await readSeed();
    await kv(['SET', KV_KEY, JSON.stringify(cache)]);
    return cache;
  }
  if (cache) return cache;
  try {
    cache = JSON.parse(await fs.readFile(FILE, 'utf8'));
  } catch {
    cache = await readSeed();
    await saveDb(cache);
  }
  return cache;
}

export async function saveDb(db = cache) {
  cache = db;
  if (KV_URL && KV_TOKEN) return kv(['SET', KV_KEY, JSON.stringify(db)]);
  await fs.writeFile(FILE, JSON.stringify(db));
}

// Monotonic ids per collection, so a deleted record's id is never reused.
export function nextId(db, key) {
  db.seq ??= {};
  const id = Math.max(db.seq[key] || 0, db[key].reduce((m, x) => Math.max(m, x.id), 0)) + 1;
  db.seq[key] = id;
  return id;
}

export function productRating(db, productId) {
  const rs = db.reviews.filter((r) => r.productId === productId);
  if (!rs.length) return { rating: 0, reviewsCount: 0 };
  return { rating: Math.round((rs.reduce((s, r) => s + r.rating, 0) / rs.length) * 10) / 10, reviewsCount: rs.length };
}

export const withRating = (db, p) => ({ ...p, ...productRating(db, p.id) });
