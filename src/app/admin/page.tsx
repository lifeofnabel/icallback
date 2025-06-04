// src/app/admin/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminBookingsList from "@/components/admin/AdminBookingsList";

export default function AdminPage() {
    const router = useRouter();

    useEffect(() => {
        const isAdmin = localStorage.getItem("isAdmin");
        if (isAdmin !== "true") {
            router.push("/admin/login");
        }
    }, [router]);

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
            <AdminBookingsList />
        </div>
    );
}
