// src/app/admin/login.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
    const [password, setPassword] = useState("");
    const router = useRouter();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === "adminpass") {
            localStorage.setItem("isAdmin", "true");
            router.push("/admin");
        } else {
            alert("Falsches Passwort");
        }
    };

    return (
        <div className="max-w-md mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Admin Login</h1>
            <form onSubmit={handleLogin} className="space-y-4">
                <input
                    type="password"
                    placeholder="Admin Passwort"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border p-2 w-full"
                />
                <button type="submit" className="bg-primary text-white px-4 py-2 rounded w-full">
                    Login
                </button>
            </form>
        </div>
    );
}
