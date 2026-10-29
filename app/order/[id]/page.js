import { Suspense } from 'react';
import { AuthGuard, OrderDetail } from '@/components/Shop';

export default async function Page({ params }) {
  const { id } = await params;
  return <Suspense fallback={null}><AuthGuard><OrderDetail id={id} /></AuthGuard></Suspense>;
}
