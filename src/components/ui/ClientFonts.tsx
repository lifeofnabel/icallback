"use client";

import React, { useEffect } from "react";

export default function ClientFonts({
                                        geistSans,
                                        geistMono,
                                        children,
                                    }: {
    geistSans: string;
    geistMono: string;
    children: React.ReactNode;
}) {
    useEffect(() => {
        document.body.classList.add(geistSans, geistMono);
        return () => {
            document.body.classList.remove(geistSans, geistMono);
        };
    }, [geistSans, geistMono]);

    return <>{children}</>;
}
