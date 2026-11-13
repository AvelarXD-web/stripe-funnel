import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Secure Checkout | Exclusive Limited Offer',
  description: 'Fast and secure transparent checkout powered by Stripe.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased flex flex-col justify-between">
        {children}
        <footer className="py-6 border-t border-slate-200 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} All rights reserved. 256-bit SSL Encrypted & PCI Compliant.</p>
        </footer>
      </body>
    </html>
  );
}
