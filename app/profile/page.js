import { Suspense } from 'react';
import { AuthGuard, ProfilePage } from '@/components/Shop';

export const metadata = { title: 'Жеке кабинет — MegaShop' };

export default function Page() {
  return <Suspense fallback={null}><AuthGuard><ProfilePage /></AuthGuard></Suspense>;
}
