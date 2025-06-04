"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AdminLoginPage() {
    const [pin, setPin] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const docRef = doc(db, "adminAccess", "1971"); // hier dein PIN-Dokument aus Firestore
            const snapshot = await getDoc(docRef);
            if (snapshot.exists() && snapshot.data().valid === true && pin === "1971") {
                // Hier könntest du snapshot.id oder snapshot.data().pin prüfen!
                localStorage.setItem("isAdmin", "true");
                router.push("/admin");
            } else {
                alert("Falscher PIN oder kein Zugriff!");
            }
        } catch (error) {
            console.error("Fehler beim Login:", error);
            alert("Fehler beim Login");
        }
        setLoading(false);
    };

    return (
        <div className="max-w-sm mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4 text-center">Admin Login</h1>
            <form onSubmit={handleLogin} className="space-y-4">
                <input
                    type="password"
                    placeholder="Admin PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full border rounded p-2"
                />
                <button
                    type="submit"
                    className="w-full bg-primary text-white py-2 rounded hover:bg-primary-dark"
                    disabled={loading}
                >
                    {loading ? "Laden..." : "Login"}
                </button>
            </form>
        </div>
    );
}
