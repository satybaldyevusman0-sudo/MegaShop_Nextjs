import { AuthGuard, CheckoutPage } from '@/components/Shop';

export const metadata = { title: 'Заказ — MegaShop' };

export default function Page() {
  return <AuthGuard><CheckoutPage /></AuthGuard>;
}
