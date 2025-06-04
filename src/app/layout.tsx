
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { I18nProvider } from '@/contexts/i18n-context';
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin', 'latin-ext'], // Added latin-ext for broader character support
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin', 'latin-ext'],
});

export const metadata: Metadata = {
  title: 'Maw\'id Booking',
  description: 'Book your appointments easily with Maw\'id Booking.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The lang and dir attributes will be set dynamically by I18nProvider on the client side
    <html lang="de" dir="ltr"> 
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <I18nProvider defaultLanguage="ar">
          {children}
          <Toaster />
        </I18nProvider>
      </body>
    </html>
  );
}
