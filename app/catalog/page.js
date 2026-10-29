import { Suspense } from 'react';
import Catalog from '@/components/Catalog';

export const metadata = { title: 'Каталог — MegaShop' };

export default function Page() {
  return <Suspense fallback={null}><Catalog /></Suspense>;
}
