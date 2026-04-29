// Auth-required admin layout. /admin/login HARIC tum admin sayfalari bunu kullanir.
// auth() yoksa /admin/login'e yonlendirir.
import { redirect } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { auth, signOut } from "@/lib/auth";

const NAV = [
  { href: "/admin", label: "Genel Bakış", icon: "🏠" },
  { href: "/admin/products", label: "Ürünler", icon: "📦" },
  { href: "/admin/categories", label: "Kategoriler", icon: "🗂️" },
  { href: "/admin/pages", label: "Sayfalar", icon: "📄" },
  { href: "/admin/translations", label: "Çeviriler", icon: "🌐" },
  { href: "/admin/media", label: "Medya", icon: "🖼️" },
  { href: "/admin/settings", label: "Ayarlar", icon: "⚙️" },
];

async function signOutAction() {
  "use server";
  await signOut({ redirectTo: "/admin/login" });
}

export default async function AdminAuthLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="flex w-60 flex-col border-r border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-4 py-4">
          <Link
            href="/admin"
            className="block text-base font-semibold tracking-tight"
          >
            Emay Panel
          </Link>
          <span className="text-xs text-neutral-500">Admin</span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
            >
              <span aria-hidden>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="border-t border-neutral-200 px-4 py-3">
          <div className="mb-2 text-xs">
            <div className="font-medium text-neutral-900">{session.user.email}</div>
            <div className="text-neutral-500">
              {(session.user as { role?: string }).role ?? "admin"}
            </div>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-100"
            >
              Çıkış Yap
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
