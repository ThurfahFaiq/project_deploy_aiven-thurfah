import './globals.css';

export const metadata = {
  title: 'Ruang Katalog — Inventaris Produk',
  description: 'Kelola katalog dan inventaris produk dengan mudah.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
