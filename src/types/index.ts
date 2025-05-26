
export interface Booking {
  id?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  phoneNumber: string | null; // E.164 format
  phoneFull?: string | null;      // ✅ NEU
  phoneMasked?: string | null;    // ✅ NEU
  userId?: string | null;         // Firebase User UID
  createdAt: any;                 // Firestore Timestamp or serverTimestamp()
}

export type BookingStep = 'selectDateTime' | 'verifyPhone' | 'confirmation';
