import AdminPage from '@/components/Admin';
import { AuthGuard } from '@/components/Shop';

export const metadata = { title: 'Админ-панель — MegaShop' };

export default function Page() {
  return <AuthGuard admin><AdminPage /></AuthGuard>;
}
