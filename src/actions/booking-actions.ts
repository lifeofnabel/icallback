"use server";

import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import type { Booking } from '@/types';
import { format as formatDateFns } from 'date-fns';

export async function getBookedSlots(date: string): Promise<string[]> {
  if (!db) {
    console.error("Firestore database is not initialized.");
    return [];
  }
  try {
    const bookingsCol = collection(db, 'bookings');
    const q = query(bookingsCol, where('date', '==', date));
    const querySnapshot = await getDocs(q);
    const bookedTimes: string[] = [];
    querySnapshot.forEach((doc) => {
      bookedTimes.push(doc.data().time);
    });
    return bookedTimes;
  } catch (error) {
    console.error("Error fetching booked slots: ", error);
    return [];
  }
}

export async function createBookingAction(bookingData: {
  date: string;
  time: string;
  phoneNumber: string;
  userId?: string;
}): Promise<{ success: boolean; bookingId?: string; error?: string; errorCode?: string }> {
  if (!db) {
    console.error("Firestore database is not initialized.");
    return { success: false, error: "Database service is not available.", errorCode: "DB_UNAVAILABLE" };
  }

  try {
    const bookingsCol = collection(db, 'bookings');

    // 1. Check if slot already booked
    const slotQuery = query(bookingsCol, where('date', '==', bookingData.date), where('time', '==', bookingData.time));
    const slotSnapshot = await getDocs(slotQuery);
    if (!slotSnapshot.empty) {
      return { success: false, error: "This time slot is no longer available.", errorCode: "SLOT_UNAVAILABLE" };
    }

    // 2. Check if this phone number has a future booking
    const today = formatDateFns(new Date(), 'yyyy-MM-dd');
    const phoneQuery = query(
        bookingsCol,
        where('phoneNumber', '==', bookingData.phoneNumber),
        where('date', '>=', today)
    );
    const phoneSnapshot = await getDocs(phoneQuery);

    let futureBookingExists = false;
    phoneSnapshot.forEach(doc => {
      const booking = doc.data() as Booking;
      const bookingDateTime = new Date(`${booking.date}T${booking.time}`);
      if (bookingDateTime >= new Date()) {
        futureBookingExists = true;
      }
    });

    if (futureBookingExists) {
      return { success: false, error: "This phone number already has an active booking.", errorCode: "PHONE_HAS_BOOKING" };
    }

    // 3. Build full + masked phone fields
    const last4 = bookingData.phoneNumber.slice(-4);
    const masked = bookingData.phoneNumber.replace(/\d(?=\d{4})/g, "*");

    // 4. Save to Firestore
    const newBooking: Booking = {
      date: bookingData.date,
      time: bookingData.time,
      phoneNumber: bookingData.phoneNumber,
      phoneFull: bookingData.phoneNumber ?? undefined,
      phoneMasked: masked,
      userId: bookingData.userId || null,
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(bookingsCol, newBooking);
    return { success: true, bookingId: docRef.id };

  } catch (error) {
    console.error("Error creating booking: ", error);
    return { success: false, error: "An unexpected error occurred while booking.", errorCode: "SERVER_ERROR" };
  }
}
