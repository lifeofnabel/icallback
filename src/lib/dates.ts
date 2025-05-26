
import { addDays, format, isWeekend, parse, isValid, set } from 'date-fns';
import { de, arSA } from 'date-fns/locale'; // Import Arabic locale specifically
import type { Language } from '@/contexts/i18n-context';


export function getNextWeekdays(count: number, startDate: Date = new Date()): Date[] {
  const weekdays: Date[] = [];
  let currentDate = startDate;
  while (weekdays.length < count) {
    if (!isWeekend(currentDate)) {
      weekdays.push(currentDate);
    }
    currentDate = addDays(currentDate, 1);
  }
  return weekdays;
}

export function generateTimeSlots(
  startTimeStr: string, // "HH:mm"
  endTimeStr: string,   // "HH:mm"
  intervalMinutes: number
): string[] {
  const slots: string[] = [];
  let currentTime = parse(startTimeStr, 'HH:mm', new Date());
  const endTime = parse(endTimeStr, 'HH:mm', new Date());

  if (!isValid(currentTime) || !isValid(endTime)) {
    console.error("Invalid start or end time for generating slots");
    return [];
  }
  
  currentTime = set(new Date(), { hours: currentTime.getHours(), minutes: currentTime.getMinutes(), seconds: 0, milliseconds: 0 });
  const finalEndTime = set(new Date(), { hours: endTime.getHours(), minutes: endTime.getMinutes(), seconds: 0, milliseconds: 0 });


  while (currentTime < finalEndTime) {
    slots.push(format(currentTime, 'HH:mm'));
    currentTime.setMinutes(currentTime.getMinutes() + intervalMinutes);
  }
  return slots;
}

export function formatDate(date: Date, lang: Language): string {
  const localesMap = {
    en: undefined, // default English locale from date-fns
    de: de,
    ar: arSA,
  };
  return format(date, 'PPP', { locale: localesMap[lang] });
}

export function formatTime(time: string, lang: Language): string {
  // Assuming time is "HH:mm"
  // For simplicity, we'll just return the time as is, but you could format it (e.g., AM/PM for English)
  // This might need a more robust solution if complex time formatting per locale is needed
  if (lang === 'ar') {
    // Convert to Arabic numerals if needed, or specific Arabic time format
    // For now, keeping it simple
    const [hours, minutes] = time.split(':');
    const arabicHours = parseInt(hours).toLocaleString('ar-EG');
    const arabicMinutes = parseInt(minutes).toLocaleString('ar-EG');
    if (minutes === "00") return `${arabicHours} تماماً`; // e.g., ١ تماماً
    return `${arabicHours}:${arabicMinutes}`;
  }
  return time;
}

export function getDayName(date: Date, lang: Language): string {
  const localesMap = {
    en: undefined,
    de: de,
    ar: arSA,
  };
  return format(date, 'EEEE', { locale: localesMap[lang] });
}
