import { Suspense } from 'react';
import { AuthForm } from '@/components/Shop';

export const metadata = { title: 'Кирүү — MegaShop' };

export default function Page() {
  return <Suspense fallback={null}><AuthForm mode="login" /></Suspense>;
}
