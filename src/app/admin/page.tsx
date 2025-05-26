'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import {
    collection,
    getDocs,
    deleteDoc,
    doc,
    getDoc
} from 'firebase/firestore';
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectContent
} from '@/components/ui/select';

interface Booking {
    id: string;
    date: string;
    time: string;
    phoneNumber: string;
}

export default function AdminPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [filteredDate, setFilteredDate] = useState<string>('');
    const [password, setPassword] = useState('');
    const [accessGranted, setAccessGranted] = useState(false);
    const [loading, setLoading] = useState(false);

    // Zugriffscode prüfen über Firestore-Dokument
    const checkAccessCode = async (code: string): Promise<boolean> => {
        if (!db) return false;
        try {
            const ref = doc(db, 'adminAccess', code);
            const snap = await getDoc(ref);
            return snap.exists();
        } catch (err) {
            console.error('Fehler beim Prüfen des Codes:', err);
            return false;
        }
    };

    // Buchungen laden
    const fetchBookings = async () => {
        if (!db) return;
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, 'bookings'));
            const data = snap.docs.map((d) => ({
                id: d.id,
                ...d.data()
            })) as Booking[];
            setBookings(data);
        } catch (err) {
            console.error('Fehler beim Laden:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (accessGranted) {
            fetchBookings();
        }
    }, [accessGranted]);

    const handleLogin = async () => {
        const ok = await checkAccessCode(password);
        setAccessGranted(ok);
    };

    const handleDelete = async (id: string) => {
        if (!db) return;
        try {
            await deleteDoc(doc(db, 'bookings', id));
            setBookings((prev) => prev.filter((b) => b.id !== id));
        } catch (err) {
            console.error('Fehler beim Löschen:', err);
        }
    };

    const filtered = filteredDate && filteredDate !== '__ALL__'
        ? bookings.filter((b) => b.date === filteredDate)
        : bookings;

    const allDates = [...new Set(bookings.map((b) => b.date))].sort();

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {!accessGranted ? (
                <Card className="max-w-sm mx-auto">
                    <CardHeader>
                        <CardTitle>🔐 Admin-Zugang</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Input
                            type="password"
                            placeholder="Zugangscode eingeben"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <Button onClick={handleLogin} className="w-full">
                            Anmelden
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">📋 Buchungsübersicht</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <span className="font-medium">Nach Datum filtern:</span>
                                <Select onValueChange={setFilteredDate}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Alle anzeigen" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__ALL__">Alle anzeigen</SelectItem>
                                        {allDates.map((date) => (
                                            <SelectItem key={date} value={date}>
                                                {date}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button variant="outline" onClick={() => setFilteredDate('')}>
                                🔄 Zurücksetzen
                            </Button>
                        </div>

                        {loading ? (
                            <p>Lade Buchungen...</p>
                        ) : filtered.length === 0 ? (
                            <p>Keine Buchungen gefunden.</p>
                        ) : (
                            <div className="border rounded-md overflow-x-auto">
                                <table className="w-full text-sm table-auto">
                                    <thead className="bg-muted">
                                    <tr>
                                        <th className="text-left px-4 py-2">📅 Datum</th>
                                        <th className="text-left px-4 py-2">🕒 Uhrzeit</th>
                                        <th className="text-left px-4 py-2">📱 Telefonnummer</th>
                                        <th className="text-right px-4 py-2">Aktion</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {filtered.map((b) => (
                                        <tr key={b.id} className="border-t hover:bg-accent/10">
                                            <td className="px-4 py-2">{b.date}</td>
                                            <td className="px-4 py-2">{b.time}</td>
                                            <td className="px-4 py-2">
                                                {b.phoneNumber}
                                                <a
                                                    href={`tel:${b.phoneNumber}`}
                                                    className="ml-2 text-primary underline text-sm"
                                                >
                                                    📞 Anrufen
                                                </a>
                                            </td>

                                            <td className="px-4 py-2 text-right">
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleDelete(b.id)}
                                                >
                                                    Löschen
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
