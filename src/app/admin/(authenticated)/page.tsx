// Admin dashboard - modernize edilmis stats cards.
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getStats() {
  try {
    const [products, categories, pages, translations, media] = await Promise.all([
      prisma.product.count(),
      prisma.category.count(),
      prisma.staticPage.count(),
      prisma.translationKey.count(),
      prisma.mediaAsset.count(),
    ]);
    return { products, categories, pages, translations, media, error: null };
  } catch (e) {
    return {
      products: 0,
      categories: 0,
      pages: 0,
      translations: 0,
      media: 0,
      error: String(e).slice(0, 200),
    };
  }
}

const STAT_CARDS = [
  {
    key: "products",
    label: "Ürünler",
    href: "/admin/products",
    color: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    key: "categories",
    label: "Kategoriler",
    href: "/admin/categories",
    color: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50",
    text: "text-blue-700",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    key: "pages",
    label: "Sayfalar",
    href: "/admin/pages",
    color: "from-violet-500 to-purple-600",
    bg: "bg-violet-50",
    text: "text-violet-700",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    key: "translations",
    label: "Çeviri Anahtarları",
    href: "/admin/translations",
    color: "from-amber-500 to-orange-600",
    bg: "bg-amber-50",
    text: "text-amber-700",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
      </svg>
    ),
  },
  {
    key: "media",
    label: "Medya",
    href: "/admin/media",
    color: "from-rose-500 to-pink-600",
    bg: "bg-rose-50",
    text: "text-rose-700",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
];

export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 p-8 text-white shadow-lg shadow-emerald-500/15">
        <div className="flex items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Hoş geldin 👋</h1>
            <p className="mt-2 max-w-md text-sm text-emerald-50">
              Emay Panel içeriğinin tamamını buradan yönetebilirsin. Ürünler,
              kategoriler, sayfalar ve çeviriler bir tıkla erişilebilir.
            </p>
          </div>
          <div className="hidden h-24 w-24 rounded-2xl bg-white/10 backdrop-blur-sm md:flex md:items-center md:justify-center">
            <svg className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
        </div>
      </div>

      {/* DB hatasi */}
      {stats.error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <svg className="mt-0.5 h-6 w-6 flex-shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-amber-900">
              Veritabanı bağlantısı kurulamadı
            </h3>
            <p className="mt-1 text-xs text-amber-800">
              DATABASE_URL ortam değişkenini kontrol edin ve{" "}
              <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono">
                npx prisma migrate deploy
              </code>{" "}
              çalıştırın.
            </p>
            <p className="mt-2 font-mono text-[10px] text-amber-700">{stats.error}</p>
          </div>
        </div>
      ) : null}

      {/* Stats grid */}
      <div>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
          İçerik İstatistikleri
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STAT_CARDS.map((c) => (
            <Link
              key={c.key}
              href={c.href}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-slate-300 hover:shadow-lg hover:shadow-slate-900/5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className={`text-xs font-medium uppercase tracking-wider ${c.text}`}>
                    {c.label}
                  </div>
                  <div className="mt-3 text-4xl font-bold tabular-nums text-slate-900">
                    {(stats as Record<string, number | string | null>)[c.key]}
                  </div>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${c.color} text-white shadow-lg shadow-slate-900/10 transition group-hover:scale-110`}>
                  {c.icon}
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs font-medium text-slate-500 transition group-hover:text-slate-700">
                Yönet
                <svg className="ml-1 h-3.5 w-3.5 transition group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Hizli islemler */}
      <div>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Hızlı İşlemler
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/admin/products/new"
            className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-emerald-300 hover:bg-emerald-50/50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 transition group-hover:bg-emerald-600 group-hover:text-white">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">Yeni Ürün</div>
              <div className="text-xs text-slate-500">Hızlıca ürün ekle</div>
            </div>
          </Link>

          <Link
            href="/admin/translations"
            className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-amber-300 hover:bg-amber-50/50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 transition group-hover:bg-amber-600 group-hover:text-white">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">Çevirileri Düzenle</div>
              <div className="text-xs text-slate-500">UI metinleri 4 dilde</div>
            </div>
          </Link>

          <Link
            href="/admin/media"
            className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-rose-300 hover:bg-rose-50/50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-700 transition group-hover:bg-rose-600 group-hover:text-white">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 0115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">Medya Yükle</div>
              <div className="text-xs text-slate-500">Görsel ve dosyalar</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
