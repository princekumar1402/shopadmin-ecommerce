import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import CartDrawer from '@/components/CartDrawer';

export const metadata: Metadata = {
  title: 'Cretzo | Multi-Vendor Marketplace',
  description:
    'Discover curated tech, fashion, home goods, and more from verified independent vendors on the Cretzo Marketplace platform.',
  keywords: ['marketplace', 'multi-vendor', 'ecommerce', 'shop', 'online store', 'cretzo'],
  authors: [{ name: 'Cretzo Team' }],
  openGraph: {
    title: 'Cretzo | Multi-Vendor Marketplace',
    description:
      'Discover curated tech, fashion, home goods, and more from verified independent vendors.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
