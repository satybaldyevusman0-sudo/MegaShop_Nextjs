import { AuthGuard, FavoritesPage } from '@/components/Shop';

export const metadata = { title: 'Сүйүктүүлөр — MegaShop' };

export default function Page() {
  return <AuthGuard><FavoritesPage /></AuthGuard>;
}
