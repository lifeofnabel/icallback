
"use client";

import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/contexts/i18n-context';
import { getNextWeekdays, generateTimeSlots, formatDate, formatTime, getDayName } from '@/lib/dates';
import { Button } from '@/components/ui/button';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2, CheckCircle, XCircle, CalendarIcon, ClockIcon, PhoneIcon, ShieldCheckIcon } from 'lucide-react';
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';
import { auth } from '@/lib/firebase'; // auth can be undefined if Firebase init fails
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
  const [phoneNumber, setPhoneNumber] = useState<string>('');
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

  const [showConfirmationDialog, setShowConfirmationDialog] = useState<boolean>(false);
  const [bookingDetails, setBookingDetails] = useState<{ date: string; time: string; phoneLastFour: string } | null>(null);

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
    if (!recaptchaContainer) {
        console.warn("Recaptcha container not found. Deferring setup.");
        // A toast here might be too noisy if it's a timing issue with DOM rendering.
        // The handleSendOtp logic will catch if verifier is still not set.
        return;
    }

    if (!window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'invisible',
          'callback': (response: any) => {
            // reCAPTCHA solved, allow signInWithPhoneNumber.
          },
          'expired-callback': () => {
            toast({ variant: "destructive", title: t('error'), description: "Recaptcha expired, please try again." });
            // Potentially reset or clear the verifier
            if (window.recaptchaVerifier) {
              // @ts-ignore
              try{ window.grecaptcha.reset(window.recaptchaVerifier.widgetId); } catch(e){ console.warn("Failed to reset recaptcha widget", e)}
            }
          }
        });
      } catch (error) {
        console.error("Error setting up RecaptchaVerifier: ", error);
        toast({ variant: "destructive", title: t('error'), description: "Failed to initialize Recaptcha. Please refresh and try again." });
        window.recaptchaVerifier = undefined; // Ensure it's undefined on failure
      }
    }
  }, [t, toast]); // auth is a stable import

  useEffect(() => {
    if (step === 'verifyPhone' && !otpSent) {
        // Ensure #recaptcha-container is in the DOM before setting up.
        const recaptchaContainer = document.getElementById('recaptcha-container');
        if (recaptchaContainer && auth) { // Also check auth here for safety
            setupRecaptcha();
        } else if (!auth) {
            toast({ variant: "destructive", title: t('error'), description: t('firebaseServicesUnavailable') });
        } else {
            console.warn("Skipping reCAPTCHA setup: container not found yet or auth not ready.");
        }
    }
  }, [step, otpSent, setupRecaptcha]);


  const handleSendOtp = async () => {
    if (!auth) {
      toast({ variant: "destructive", title: t('error'), description: t('firebaseServicesUnavailable') });
      return;
    }
    if (!phoneNumber.match(/^\+[1-9]\d{1,14}$/)) { 
      toast({ variant: "destructive", title: t('error'), description: t('invalidPhoneNumber') });
      return;
    }
    setIsSendingOtp(true);
    try {
      if (!window.recaptchaVerifier) {
        setupRecaptcha(); // Attempt to set it up if not already
      }

      if (!window.recaptchaVerifier) {
        // If setupRecaptcha failed (e.g. auth was null, or container issue), it won't be set.
        console.error("reCAPTCHA verifier not available for sending OTP.");
        toast({ variant: "destructive", title: t('error'), description: t('verificationFailed') }); // A more specific message might be in setupRecaptcha
        setIsSendingOtp(false);
        return;
      }

      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
      window.confirmationResult = confirmationResult;
      setOtpSent(true);
      toast({ title: t('smsSent') });
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      toast({ variant: "destructive", title: t('error'), description: error.message || t('verificationFailed') });
      if (window.recaptchaVerifier) {
        // @ts-ignore
        try { window.grecaptcha.reset(window.recaptchaVerifier.widgetId); } catch(e){console.warn("Failed to reset recaptcha on error", e)}
      }
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!window.confirmationResult) {
      toast({ variant: "destructive", title: t('error'), description: t('verificationFailed') + " (No confirmation result)"}); // TODO: Translate
      return;
    }
    if (!otp || otp.length !== 6) {
      toast({ variant: "destructive", title: t('error'), description: t('verificationFailed') });
      return;
    }
    setIsVerifyingOtp(true);
    try {
      const userCredential = await window.confirmationResult.confirm(otp);
      setIsVerified(true);
      setUserId(userCredential.user.uid);
      toast({ title: t('verificationCode'), description: "Phone number verified successfully!" }); // TODO: Translate
      setStep('confirmation'); 
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      toast({ variant: "destructive", title: t('error'), description: error.message || t('verificationFailed') });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedTime || !isVerified || !phoneNumber) {
      toast({ variant: "destructive", title: t('error'), description: t('bookingFailed') });
      return;
    }
    setIsBooking(true);
    const bookingData = {
      date: selectedDate.toISOString().split('T')[0],
      time: selectedTime,
      phoneNumber: phoneNumber,
      userId: userId
    };

    const result = await createBookingAction(bookingData);

    if (result.success) {
      setBookingDetails({
        date: formatDate(selectedDate, language),
        time: formatTime(selectedTime, language),
        phoneLastFour: phoneNumber.slice(-4)
      });
      setShowConfirmationDialog(true);
      setSelectedDate(undefined);
      setSelectedTime(undefined);
      setPhoneNumber('');
      setOtp('');
      setOtpSent(false);
      setIsVerified(false);
      setStep('selectDateTime');
      setBookedSlotsForSelectedDate(prev => [...prev, selectedTime]); 
    } else {
       toast({ variant: "destructive", title: t('error'), description: t(result.errorCode || 'bookingFailed') });
    }
    setIsBooking(false);
  };
  
  const renderStepContent = () => {
    switch (step) {
      case 'selectDateTime':
        return (
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
                disabled={(date) => isWeekend(date) || date < new Date(new Date().setHours(0,0,0,0))}
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
                      {timeSlots.map((slot) => {
                        const isBooked = bookedSlotsForSelectedDate.includes(slot);
                        return (
                          <Button
                            key={slot}
                            variant={selectedTime === slot ? 'default' : 'outline'}
                            onClick={() => setSelectedTime(slot)}
                            disabled={isBooked}
                            className={`w-full ${isBooked ? 'bg-destructive/20 text-destructive line-through' : ''}`}
                          >
                            {formatTime(slot, language)}
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => setStep('verifyPhone')} 
                disabled={!selectedDate || !selectedTime}
                className="w-full"
              >
                {t('steps.verifyPhone')} <ArrowRightIcon className={`w-4 h-4 ${dir === 'rtl' ? 'mr-2 transform rotate-180' : 'ml-2'}`} />
              </Button>
            </CardFooter>
          </Card>
        );
      case 'verifyPhone':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><PhoneIcon className="w-6 h-6 text-primary" /> {t('steps.verifyPhone')}</CardTitle>
              <CardDescription>
                {selectedDate && selectedTime ? t('bookedFor', {date: formatDate(selectedDate, language), time: formatTime(selectedTime, language)}) : t('pleaseSelectDateAndTime')}
              </CardDescription>
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
                  <Button onClick={handleSendOtp} disabled={isSendingOtp || !phoneNumber} className="w-full">
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
                  <Button onClick={handleVerifyOtp} disabled={isVerifyingOtp || !otp} className="w-full">
                    {isVerifyingOtp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('verifyCode')}
                  </Button>
                </>
              )}
               <div id="recaptcha-container"></div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-2">
               <Button variant="outline" onClick={() => setStep('selectDateTime')} className="w-full sm:w-auto">
                <ArrowLeftIcon className={`w-4 h-4 ${dir === 'rtl' ? 'ml-2 transform rotate-180' : 'mr-2'}`} /> {t('steps.selectDateTime')}
              </Button>
              <Button onClick={handleBookAppointment} disabled={!isVerified || isBooking} className="w-full sm:w-auto">
                {isBooking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <ShieldCheckIcon className="mr-2 h-4 w-4" /> {t('bookAppointment')}
              </Button>
            </CardFooter>
          </Card>
        );
       case 'confirmation': 
        return (
           <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShieldCheckIcon className="w-6 h-6 text-primary" /> {t('bookAppointment')}</CardTitle>
              <CardDescription>
                {t('pleaseVerifyPhoneNumber')} {selectedDate && selectedTime ? t('bookedFor', {date: formatDate(selectedDate, language), time: formatTime(selectedTime, language)}) : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="default" className="bg-accent/10 border-accent">
                <CheckCircle className="h-5 w-5 text-accent" />
                <AlertTitle className="text-accent">{t('verificationCode')}</AlertTitle>
                <AlertDescription>
                  {/* TODO: Translate "Phone number verified. You can now book your appointment." */}
                  Phone number verified. You can now book your appointment.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => { setOtpSent(false); setIsVerified(false); setStep('verifyPhone');}} className="w-full sm:w-auto">
                <ArrowLeftIcon className={`w-4 h-4 ${dir === 'rtl' ? 'ml-2 transform rotate-180' : 'mr-2'}`} /> {t('steps.verifyPhone')}
              </Button>
              <Button onClick={handleBookAppointment} disabled={isBooking} className="w-full sm:w-auto">
                {isBooking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <ShieldCheckIcon className="mr-2 h-4 w-4" /> {t('bookAppointment')}
              </Button>
            </CardFooter>
          </Card>
        )
    }
  };

  const ArrowRightIcon = ({className}: {className?: string}) => dir === 'rtl' ? <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>;
  const ArrowLeftIcon = ({className}: {className?: string}) => dir === 'rtl' ? <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>;


  return (
    <div className="w-full max-w-xl mx-auto p-4" dir={dir}>
      {renderStepContent()}

      <Dialog open={showConfirmationDialog} onOpenChange={setShowConfirmationDialog}>
        <DialogContent dir={dir} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-primary" />
              {t('bookingConfirmation')}
            </DialogTitle>
            <DialogDescription>
              {t('appointmentBooked')}
            </DialogDescription>
          </DialogHeader>
          {bookingDetails && (
            <div className="py-4 space-y-2">
              <p>{t('bookedFor', { date: bookingDetails.date, time: bookingDetails.time })}</p>
              <p>{t('phoneNumberEndingIn', { lastFourDigits: bookingDetails.phoneLastFour })}</p>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowConfirmationDialog(false)} className="w-full">{t('close')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6; 
};


export default BookingForm;

