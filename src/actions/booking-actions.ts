
"use server";

import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import type { Booking } from '@/types';
import { format as formatDateFns } from 'date-fns'; // Import date-fns format

export async function getBookedSlots(date: string): Promise<string[]> {
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
    // Check if slot is already booked (server-side check for race conditions)
    const bookingsCol = collection(db, 'bookings');
    const slotQuery = query(bookingsCol, where('date', '==', bookingData.date), where('time', '==', bookingData.time));
    const slotSnapshot = await getDocs(slotQuery);
    if (!slotSnapshot.empty) {
      return { success: false, error: "This time slot is no longer available.", errorCode: "SLOT_UNAVAILABLE" };
    }

    // Check if this phone number already has an active (future) booking
    const today = formatDateFns(new Date(), 'yyyy-MM-dd');
    const phoneQuery = query(bookingsCol, 
      where('phoneNumber', '==', bookingData.phoneNumber),
      where('date', '>=', today) // Only consider bookings from today onwards
    );
    const phoneSnapshot = await getDocs(phoneQuery);
    
    let futureBookingExists = false;
    phoneSnapshot.forEach(doc => {
      const booking = doc.data() as Booking;
      // Construct a Date object from stored date and time strings for comparison
      // This assumes the server's local timezone for parsing and comparison.
      const bookingDateTime = new Date(`${booking.date}T${booking.time}`);
      if (bookingDateTime >= new Date()) { // Check if booking is in the future or current time
        futureBookingExists = true;
      }
    });

    if (futureBookingExists) {
      return { success: false, error: "This phone number already has an active booking.", errorCode: "PHONE_HAS_BOOKING" };
    }
    
    const newBooking: Booking = {
      ...bookingData,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(bookingsCol, newBooking);
    return { success: true, bookingId: docRef.id };
  } catch (error) {
    console.error("Error creating booking: ", error);
    return { success: false, error: "An unexpected error occurred while booking.", errorCode: "SERVER_ERROR" };
  }
}
