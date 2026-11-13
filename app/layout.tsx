import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pago Seguro | $27.00',
  description: 'Pago rápido y seguro protegido por Stripe.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-50 antialiased">
        {children}
      </body>
    </html>
  );
}
