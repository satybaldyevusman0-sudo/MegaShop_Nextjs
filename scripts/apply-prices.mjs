// Applies verified market prices from data/prices.json to data/seed.json and (if present) data/db.json.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const prices = JSON.parse(readFileSync(new URL('../data/prices.json', import.meta.url), 'utf8'));
const round10 = (n) => Math.round(n / 10) * 10;

export function applyPrices(products) {
  let n = 0;
  for (const it of prices.items) {
    const p = products.find((x) => x.id === it.id);
    if (!p) continue;
    p.price = it.kgs ?? round10(it.usd * prices.rate.usd);
    p.oldPrice = null;
    p.discount = 0;
    p.priceSource = it.source;
    p.priceNote = it.note;
    p.priceCheckedAt = prices.checkedAt;
    n++;
  }
  return n;
}

if (process.argv[1]?.endsWith('apply-prices.mjs')) {
  for (const file of ['seed.json', 'db.json']) {
    const url = new URL(`../data/${file}`, import.meta.url);
    if (!existsSync(url)) continue;
    const db = JSON.parse(readFileSync(url, 'utf8'));
    const n = applyPrices(db.products);
    writeFileSync(url, JSON.stringify(db));
    console.log(`${file}: updated ${n} prices`);
  }
}
