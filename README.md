# MegaShop — интернет-дүкөн

Next.js 16 (App Router) + REST API + JWT. 194 реалдуу товар (сүрөттөрү аталышына так дал келет — [DummyJSON](https://dummyjson.com) каталогунан), 580+ пикир.

## Мүмкүнчүлүктөр

- Каталог: издөө (автосунуштар менен), категория / бренд / баа / рейтинг / "бар" / "арзандатуу" чыпкалары, 6 иреттөө, пагинация, тор/тизме көрүнүшү
- Товар барагы: галерея, саны, себет, сүйүктүүлөр, **дүкөндөн брондоо** (дүкөн + күн + убакыт), пикир + рейтинг, WhatsApp/Telegram аркылуу бөлүшүү, окшош товарлар, «← Артка»
- Себет → заказ (курьер же дүкөндөн алуу, 4 төлөм ыкмасы, акысыз жеткирүү прогресси), заказды жокко чыгаруу (склад калыбына келет)
- Катталуу / кирүү (JWT, httpOnly cookie же `Authorization: Bearer`), жеке кабинет (заказдар, брондоолор, профиль, сырсөз алмаштыруу)
- Админ-панель: статистика, товар CRUD, заказ статустары, брондоолор, колдонуучулар (рол / өчүрүү), пикир модерациясы
- 3 тил (KG / RU / EN), күндүзгү / түнкү режим, телефон / планшет / компьютер
- Loading (skeleton), ката жана бош абал экрандары, 404

## Локалдуу иштетүү

```bash
npm install
npm run dev        # http://localhost:3000
npm run test:api   # 38 API тести (сервер иштеп турушу керек)
```

Админ (тест үчүн): `.env.example` файлындагы `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Башка админ керек болсо: `ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run seed`, андан кийин `data/db.json` файлын өчүрүңүз.

## Маалымат базасы

`lib/db.js` — JSON документ сактагыч:
- Локалдуу: `data/db.json` (биринчи иштегенде `data/seed.json`дон түзүлөт)
- Vercel + **Upstash Redis** (`KV_REST_API_URL`, `KV_REST_API_TOKEN`) — туруктуу сактоо
- Vercel'де Redis жок болсо — `/tmp` (⚠️ убактылуу: заказдар жана өзгөртүүлөр кайра иштетилгенде жоголот)

## Vercel'ге жарыялоо

1. GitHub'та жаңы репозиторий түзүп, push кылыңыз:
   ```bash
   git remote add origin https://github.com/<USER>/megashop.git
   git push -u origin main
   ```
2. [vercel.com/new](https://vercel.com/new) → репозиторийди импорттоо (Framework: Next.js автоматтык түрдө аныкталат).
3. **Environment Variables**:
   - `JWT_SECRET` — узун кокус сап (милдеттүү)
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD` — админдин чыныгы логини (милдеттүү! болбосо тест сырсөзү калат)
   - `NEXT_PUBLIC_WHATSAPP`, `NEXT_PUBLIC_INSTAGRAM`, `NEXT_PUBLIC_TELEGRAM`, `NEXT_PUBLIC_PHONE` — чыныгы байланыштарыңыз
4. Vercel → Storage → **Upstash for Redis** кошуңуз (Marketplace) — `KV_REST_API_URL` / `KV_REST_API_TOKEN` автоматтык түрдө кошулат.
5. Deploy.

CLI аркылуу: `npx vercel` → `npx vercel --prod`.

## Түзүлүш

```
app/            барактар + app/api/* REST API
components/     40+ компонент (Header, SearchBar, ProductCard, FilterSidebar, Gallery, ReviewForm, ReserveModal, AdminPanel…)
lib/            db, auth (JWT), i18n (KG/RU/EN), API client
data/seed.json  баштапкы маалымат (scripts/seed.mjs түзөт)
scripts/        seed жана API тесттер
```
# MegaShop_Nextjs
