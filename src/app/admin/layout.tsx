// Admin paneli kok layout - public site i18n shell'inden tamamen bagimsiz.
// Tailwind utility'leri burada serbestce kullaniyoruz (legacy CSS yok).
import "../globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Emay Panel Admin",
  description: "Admin paneli",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased">
        {children}
      </body>
    </html>
  );
}
