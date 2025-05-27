"use client";

import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/contexts/i18n-context';
import { getNextWeekdays, generateTimeSlots, formatDate, formatTime } from '@/lib/dates';
import { Button } from '@/components/ui/button';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2, CheckCircle, CalendarIcon, ClockIcon, PhoneIcon, ShieldCheckIcon, ArrowRightIcon, ArrowLeftIcon } from 'lucide-react';
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getBookedSlots, createBookingAction } from '@/actions/booking-actions';
import type { BookingStep } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { arSA } from 'date-fns/locale/ar-SA';
import { de as deLocale } from 'date-fns/locale/de';


declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

const BookingForm: React.FC = () => {
  const { t, language, dir } = useI18n();
  const { toast } = useToast();

  const [step, setStep] = useState<BookingStep>('selectDateTime');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined);
  const [phoneNumber, setPhoneNumber] = useState<string>('+49');
  const [otp, setOtp] = useState<string>('');
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);
  const [isBooking, setIsBooking] = useState<boolean>(false);
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | undefined>(undefined);

  const [availableWeekdays, setAvailableWeekdays] = useState<Date[]>([]);
  const timeSlots = generateTimeSlots('13:00', '16:00', 15);
  const [bookedSlotsForSelectedDate, setBookedSlotsForSelectedDate] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);

  const [bookingConfirmedData, setBookingConfirmedData] = useState<{ date: string; time: string; phoneLastFour: string } | null>(null);
  const [showFinalConfirmation, setShowFinalConfirmation] = useState<boolean>(false);

  useEffect(() => {
    setAvailableWeekdays(getNextWeekdays(5));
  }, []);

  useEffect(() => {
    if (selectedDate) {
      setLoadingSlots(true);
      const dateStr = selectedDate.toISOString().split('T')[0];
      getBookedSlots(dateStr)
        .then(slots => {
          setBookedSlotsForSelectedDate(slots);
          setLoadingSlots(false);
        })
        .catch(error => {
          console.error("Failed to fetch booked slots:", error);
          setLoadingSlots(false);
          toast({ variant: "destructive", title: t('error'), description: t('bookingFailed') });
        });
    }
  }, [selectedDate, t, toast]);

  const setupRecaptcha = useCallback(() => {
    if (!auth) {
      toast({ variant: "destructive", title: t('error'), description: t('firebaseServicesUnavailable') });
      return;
    }
    const recaptchaContainer = document.getElementById('recaptcha-container');
    if (!recaptchaContainer) return;

    if (!window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'invisible',
          'callback': () => {},
          'expired-callback': () => {
            toast({ variant: "destructive", title: t('error'), description: "Recaptcha expired, please try again." });
            if (window.recaptchaVerifier) {
              try { window.grecaptcha.reset(window.recaptchaVerifier.widgetId); } catch(e) {}
            }
          }
        });
      } catch (error) {
        console.error("Recaptcha setup failed:", error);
        window.recaptchaVerifier = undefined;
      }
    }
  }, [t, toast]);

  useEffect(() => {
    if (step === 'verifyPhone' && !otpSent) {
      const recaptchaContainer = document.getElementById('recaptcha-container');
      if (recaptchaContainer && auth) {
        setupRecaptcha();
      }
    }
  }, [step, otpSent, setupRecaptcha]);

  const handleSendOtp = async () => {
    if (!auth) return;
    if (!phoneNumber.match(/^\+49\d{6,13}$/)) {
      toast({ variant: "destructive", title: t('error'), description: t('invalidPhoneNumber') });
      return;
    }
    setIsSendingOtp(true);
    try {
      if (!window.recaptchaVerifier) setupRecaptcha();
      if (!window.recaptchaVerifier) return;
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
      window.confirmationResult = confirmationResult;
      setOtpSent(true);
    } catch (error: any) {
      toast({ variant: "destructive", title: t('error'), description: error.message || t('verificationFailed') });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtpAndBook = async () => {
    if (!window.confirmationResult || otp.length !== 6) return;
    setIsVerifyingOtp(true);
    try {
      const userCredential = await window.confirmationResult.confirm(otp);
      setUserId(userCredential.user.uid);
      const result = await createBookingAction({
        date: selectedDate!.toISOString().split('T')[0],
        time: selectedTime!,
        phoneNumber,
        userId: userCredential.user.uid,
      });
      if (result.success) {
        setBookingConfirmedData({
          date: formatDate(selectedDate!, language),
          time: formatTime(selectedTime!, language),
          phoneLastFour: phoneNumber.slice(-4),
        });
        setShowFinalConfirmation(true);
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: t('error'), description: error.message || t('verificationFailed') });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  if (showFinalConfirmation && bookingConfirmedData) {
    return (
      <div className="w-full max-w-xl mx-auto p-4 text-center space-y-4" dir={dir}>
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
        <h2 className="text-2xl font-bold">{t('bookingConfirmedTitle')}</h2>
        <p className="text-lg">{t('bookedFor', { date: bookingConfirmedData.date, time: bookingConfirmedData.time })}</p>
        <p className="text-lg">{t('phoneNumberEndingIn', { lastFourDigits: bookingConfirmedData.phoneLastFour })}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto p-4" dir={dir}>
      {step === 'selectDateTime' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CalendarIcon className="w-6 h-6 text-primary" /> {t('selectDate')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              fromDate={new Date()}
              toDate={addDays(new Date(), 30)}
              disabled={(date) => date.getDay() === 0 || date.getDay() === 6 || date < new Date(new Date().setHours(0,0,0,0))}
              className="rounded-md border shadow"
              dir={dir}
              locale={language === 'ar' ? arSA : language === 'de' ? deLocale : undefined}
            />
            {selectedDate && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><ClockIcon className="w-5 h-5 text-primary" /> {t('selectTimeSlot')}</h3>
                {loadingSlots ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-2">{t('loadingTimeSlots')}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {timeSlots.map((slot) => (
                      <Button
                        key={slot}
                        variant={selectedTime === slot ? 'default' : 'outline'}
                        onClick={() => setSelectedTime(slot)}
                        disabled={bookedSlotsForSelectedDate.includes(slot)}
                        className={`w-full ${bookedSlotsForSelectedDate.includes(slot) ? 'bg-destructive/20 text-destructive line-through' : ''}`}
                      >
                        {formatTime(slot, language)}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={() => setStep('verifyPhone')} disabled={!selectedDate || !selectedTime} className="w-full">
              {t('steps.verifyPhone')} <ArrowRightIcon className={`w-4 h-4 ${dir === 'rtl' ? 'mr-2 transform rotate-180' : 'ml-2'}`} />
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 'verifyPhone' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><PhoneIcon className="w-6 h-6 text-primary" /> {t('steps.verifyPhone')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!otpSent ? (
              <>
                <Input
                  type="tel"
                  placeholder={t('phoneNumber') + " (e.g. +491234567890)"}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  dir="ltr"
                />
                <Button onClick={handleSendOtp} disabled={isSendingOtp} className="w-full">
                  {isSendingOtp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('sendCode')}
                </Button>
              </>
            ) : (
              <>
                <Input
                  type="text"
                  placeholder={t('verificationCode')}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  dir="ltr"
                />
                <Button onClick={handleVerifyOtpAndBook} disabled={isVerifyingOtp} className="w-full">
                  {isVerifyingOtp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('bookAppointment')}
                </Button>
              </>
            )}
            <div id="recaptcha-container"></div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => setStep('selectDateTime')} className="w-full">
              <ArrowLeftIcon className={`w-4 h-4 ${dir === 'rtl' ? 'ml-2 transform rotate-180' : 'mr-2'}`} /> {t('steps.selectDateTime')}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export default BookingForm;
