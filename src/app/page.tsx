import type React from 'react';
// @ts-ignore
import type { Metadata } from 'next';
import LogoIcon from '@/components/icons/logo-icon';
import LanguageSwitcher from '@/components/language-switcher';
import BookingForm from '@/components/booking-form';
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export const metadata: Metadata = {
    title: "Termin buchen – Maw'id",
    description: "Buche deinen Rückruftermin einfach und schnell.",
};

export default function HomePage() {
    console.log("Server startet")
    return (
    <div className="min-h-screen flex flex-col items-center bg-background p-4 ">
      <header className="w-full max-w-xl mb-8 flex justify-between items-center pt-4">
        <LogoIcon />
        <LanguageSwitcher />
      </header>

      <main className="w-full flex-grow flex flex-col items-center justify-start">
         <BookingForm />
      </main>

        <footer className="w-full max-w-xl text-center py-8 text-muted-foreground text-sm">
            <Link href="/admin/login" className="hover:underline">
                &copy; {new Date().getFullYear()} Maw'id Booking (Nabel Jajeh). All rights reserved.
            </Link>
        </footer>


    </div>
  );
}
