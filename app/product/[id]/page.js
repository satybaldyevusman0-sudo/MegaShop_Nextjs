import ProductPage from '@/components/Product';
import { getDb } from '@/lib/db';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const p = (await getDb()).products.find((x) => x.id === Number(id));
  if (!p) return { title: 'MegaShop' };
  return { title: `${p.title} — MegaShop`, description: p.description, openGraph: { title: p.title, description: p.description, images: [p.thumbnail] } };
}

export default async function Page({ params }) {
  const { id } = await params;
  return <ProductPage id={id} />;
}
