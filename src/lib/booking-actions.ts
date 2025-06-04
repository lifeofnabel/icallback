// src/lib/booking-actions.ts
import { db } from "./firebase";
import {
    collection,
    getDocs,
    doc,
    updateDoc,
    deleteDoc
} from "firebase/firestore";

// 🔖 Typisierung für eine Buchung
export type Booking = {
    id: string;
    date: string;
    time: string;
    phoneNumber: string;
    confirmed: boolean;
};

// ✅ Buchungen abrufen
export async function getAllBookings(): Promise<Booking[]> {
    const snapshot = await getDocs(collection(db, "bookings"));
    return snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
    })) as Booking[];
}

// ✅ Buchung bestätigen
export async function confirmBooking(id: string): Promise<void> {
    const bookingRef = doc(db, "bookings", id);
    await updateDoc(bookingRef, { confirmed: true });
}

// ✅ Buchung stornieren
export async function cancelBooking(id: string): Promise<void> {
    const bookingRef = doc(db, "bookings", id);
    await deleteDoc(bookingRef);
}
