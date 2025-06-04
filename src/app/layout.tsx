
// @ts-ignore
import type { Metadata } from 'next';
// @ts-ignore
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { I18nProvider } from '@/contexts/i18n-context';
import { Toaster } from "@/components/ui/toaster";
import ClientFonts from "@/components/ui/ClientFonts";


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
    <html lang="ar" dir="ltr">
        <body>
        <I18nProvider defaultLanguage="ar">
            <ClientFonts geistSans={geistSans.variable} geistMono={geistMono.variable}>
                {children}
                <Toaster />
            </ClientFonts>
        </I18nProvider>
        </body>
    </html>
  );
}
