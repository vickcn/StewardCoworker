import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';

export const metadata: Metadata = {
  title: 'SpringRoll Steward',
  description: '春時慢卷總務協作平台',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body>
        <Providers>
          <Navbar />
          <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
