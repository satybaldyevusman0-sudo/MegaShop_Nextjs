import './globals.css';
import Providers from '@/components/Providers';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ScrollToTop, WhatsAppFloat } from '@/components/ui';

export const metadata = {
  title: 'MegaShop — интернет-дүкөн',
  description: 'MegaShop: смартфондор, ноутбуктар, кийим, үй буюмдары. Бишкек боюнча тез жеткирүү.',
  icons: { icon: '/favicon.svg' },
};

export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#4f46e5' };

// Applies the saved theme before paint to avoid a flash.
const themeScript = `try{var t=JSON.parse(localStorage.getItem('ms_theme'));if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='light'}`;

export default function RootLayout({ children }) {
  return (
    <html lang="ky" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Providers>
          <Header />
          <main className="main">{children}</main>
          <Footer />
          <ScrollToTop />
          <WhatsAppFloat />
        </Providers>
      </body>
    </html>
  );
}
