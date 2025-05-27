
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { I18nProvider } from '@/contexts/i18n-context';
import { Toaster } from '@/components/ui/toaster';

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
    <html lang="en" dir="ltr"> 
      <head>
        {/* Google reCAPTCHA v2 API script */}
        {/* The render=explicit parameter is needed to manually render the captcha */}
        <script src="https://www.google.com/recaptcha/api.js?render=explicit" async defer></script>
      </head>

      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <I18nProvider defaultLanguage="ar">
          {children}
          <Toaster />
        </I18nProvider>
      </body>
    </html>
  );
}
