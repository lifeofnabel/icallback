// src/lib/admin-auth.ts
export const isAdmin = (email: string) => {
    // Hardcode oder Datenbankabfrage:
    const allowedEmails = ["admin@mawid.com"];
    return allowedEmails.includes(email);
};
