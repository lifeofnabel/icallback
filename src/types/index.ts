
export interface Booking {
  id?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  phoneNumber: string; // E.164 format
  userId?: string; // Firebase User UID
  createdAt: any; // Firestore Timestamp or serverTimestamp()
}

export type BookingStep = 'selectDateTime' | 'verifyPhone' | 'confirmation';
