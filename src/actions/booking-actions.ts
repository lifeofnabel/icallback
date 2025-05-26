
"use server";

import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { Booking } from '@/types';

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
  try {
    // Check if slot is already booked (server-side check for race conditions)
    const bookingsCol = collection(db, 'bookings');
    const slotQuery = query(bookingsCol, where('date', '==', bookingData.date), where('time', '==', bookingData.time));
    const slotSnapshot = await getDocs(slotQuery);
    if (!slotSnapshot.empty) {
      return { success: false, error: "This time slot is no longer available.", errorCode: "SLOT_UNAVAILABLE" };
    }

    // Check if this phone number already has an active (future) booking
    // For simplicity, checking any booking with this phone number. A more complex rule might involve checking only future bookings.
    const today = format(new Date(), 'yyyy-MM-dd');
    const phoneQuery = query(bookingsCol, 
      where('phoneNumber', '==', bookingData.phoneNumber),
      where('date', '>=', today) // Only consider bookings from today onwards
    );
    const phoneSnapshot = await getDocs(phoneQuery);
    
    let futureBookingExists = false;
    phoneSnapshot.forEach(doc => {
      const booking = doc.data() as Booking;
      const bookingDateTime = Timestamp.fromDate(new Date(`${booking.date}T${booking.time}`));
      if (bookingDateTime.toDate() >= new Date()) { // Check if booking is in the future or current time
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

// Helper function to format date as YYYY-MM-DD, as date-fns format is not directly usable in server actions
// This can be replaced if date-fns is made compatible or another library is used.
function format(date: Date, formatString: string): string {
    if (formatString === 'yyyy-MM-dd') {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    // Add other formats if needed
    return date.toISOString(); 
}
