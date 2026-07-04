import type { Metadata } from 'next';
import { StoreProvider } from '@/store/StoreProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Page Studio',
  description: 'Schema-driven landing page studio backed by Contentful',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
