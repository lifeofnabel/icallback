"use client";

import React, { useEffect, useState } from "react";
import {
    getAllBookings,
    confirmBooking,
    cancelBooking,
    Booking
} from "@/lib/booking-actions";
import { PhoneCall, CheckCircle, CalendarDays } from "lucide-react";
import { format, parseISO, getDay } from "date-fns";

export default function AdminBookingsList() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(false);
    const [filterDay, setFilterDay] = useState<number | "all">("all");

    useEffect(() => {
        loadBookings();
    }, []);

    const loadBookings = async () => {
        setLoading(true);
        const data = await getAllBookings();
        setBookings(data);
        setLoading(false);
    };

    const handleConfirm = async (id: string) => {
        await confirmBooking(id);
        alert("Termin als erledigt markiert!");
        loadBookings();
    };

    const handleCancel = async (id: string) => {
        await cancelBooking(id);
        alert("Termin storniert!");
        loadBookings();
    };

    // 🔥 Sortieren: unerledigte Termine zuerst, erledigte unten
    const sortedBookings = [...bookings]
        .filter((b) => {
            if (filterDay === "all") return true;
            const bookingDate = parseISO(b.date);
            return getDay(bookingDate) === filterDay;
        })
        .sort((a, b) => {
            if (a.confirmed !== b.confirmed) {
                return a.confirmed ? 1 : -1; // unerledigte zuerst
            }
            return new Date(a.date).getTime() - new Date(b.date).getTime();
        });

    const daysOfWeek = [
        { value: 0, label: "Sonntag" },
        { value: 1, label: "Montag" },
        { value: 2, label: "Dienstag" },
        { value: 3, label: "Mittwoch" },
        { value: 4, label: "Donnerstag" },
        { value: 5, label: "Freitag" },
        { value: 6, label: "Samstag" }
    ];

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <h2 className="text-3xl font-bold text-center sm:text-left">
                    Buchungsübersicht
                </h2>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setFilterDay("all")}
                        className={`px-3 py-1 rounded ${
                            filterDay === "all"
                                ? "bg-primary text-white"
                                : "bg-gray-200 text-gray-700"
                        }`}
                    >
                        Alle Tage
                    </button>
                    {daysOfWeek.map((day) => (
                        <button
                            key={day.value}
                            onClick={() => setFilterDay(day.value)}
                            className={`px-3 py-1 rounded ${
                                filterDay === day.value
                                    ? "bg-primary text-white"
                                    : "bg-gray-200 text-gray-700"
                            }`}
                        >
                            {day.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading && (
                <p className="text-center text-gray-500 animate-pulse">Lade Buchungen...</p>
            )}

            {sortedBookings.map((b) => (
                <div
                    key={b.id}
                    className={`border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-md bg-white ${
                        !b.confirmed ? "border-red-500 ring-2 ring-red-400" : "border-green-500 ring-2 ring-green-400"
                    }`}
                >
                    <div className="space-y-1">
                        <p className="text-lg font-semibold flex items-center gap-2">
                            <CalendarDays className="w-5 h-5 text-primary" />
                            {format(parseISO(b.date), "dd.MM.yyyy")} um {b.time}
                        </p>
                        <p className="text-gray-600">
                            📞 {b.phoneNumber}
                        </p>
                        <p
                            className={`text-sm ${
                                b.confirmed ? "text-green-600" : "text-red-600"
                            }`}
                        >
                            Status: {b.confirmed ? "Erledigt" : "Offen"}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <a
                            href={`tel:${b.phoneNumber}`}
                            className="flex items-center gap-1 bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 transition"
                        >
                            <PhoneCall className="w-4 h-4" />
                            Anrufen
                        </a>
                        {!b.confirmed && (
                            <button
                                onClick={() => handleConfirm(b.id)}
                                className="flex items-center gap-1 bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600 transition"
                            >
                                <CheckCircle className="w-4 h-4" />
                                Erledigt
                            </button>
                        )}
                        <button
                            onClick={() => handleCancel(b.id)}
                            className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 transition"
                        >
                            Stornieren
                        </button>
                    </div>
                </div>
            ))}

            {!loading && sortedBookings.length === 0 && (
                <p className="text-center text-gray-500">Keine Buchungen gefunden.</p>
            )}
        </div>
    );
}
