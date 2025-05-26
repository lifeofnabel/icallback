
import type React from 'react';
import LogoIcon from '@/components/icons/logo-icon';
import LanguageSwitcher from '@/components/language-switcher';
import BookingForm from '@/components/booking-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';


export default function HomePage() {
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
        <p>&copy; {new Date().getFullYear()} Maw'id Booking. All rights reserved.</p>
      </footer>
    </div>
  );
}
