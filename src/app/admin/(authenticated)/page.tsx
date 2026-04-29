// Admin dashboard - hizli istatistikler.
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

export default async function DashboardPage() {
  const stats = await getStats();

  const cards = [
    { label: "Ürünler", value: stats.products, href: "/admin/products" },
    { label: "Kategoriler", value: stats.categories, href: "/admin/categories" },
    { label: "Statik Sayfalar", value: stats.pages, href: "/admin/pages" },
    { label: "Çeviri Anahtarları", value: stats.translations, href: "/admin/translations" },
    { label: "Medya", value: stats.media, href: "/admin/media" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Genel Bakış</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Site içeriğini buradan yönetin
        </p>
      </div>

      {stats.error ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm">
          <div className="font-medium text-amber-900">
            Veritabanı bağlantısı kurulamadı
          </div>
          <div className="mt-1 text-amber-800">
            DATABASE_URL ortam değişkenini kontrol edin ve{" "}
            <code className="rounded bg-amber-100 px-1">
              npx prisma migrate deploy
            </code>{" "}
            çalıştırın.
          </div>
          <div className="mt-2 font-mono text-xs text-amber-700">
            {stats.error}
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <a
            key={c.href}
            href={c.href}
            className="rounded-lg border border-neutral-200 bg-white p-5 transition hover:border-emerald-300 hover:shadow-sm"
          >
            <div className="text-xs font-medium uppercase tracking-wider text-neutral-500">
              {c.label}
            </div>
            <div className="mt-2 text-3xl font-semibold tabular-nums">
              {c.value}
            </div>
          </a>
        ))}
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-medium">Hızlı İşlemler</h2>
        <div className="mt-3 grid gap-2 text-sm">
          <a className="text-emerald-700 hover:underline" href="/admin/products">
            → Yeni ürün ekle
          </a>
          <a className="text-emerald-700 hover:underline" href="/admin/translations">
            → Çevirileri düzenle
          </a>
          <a className="text-emerald-700 hover:underline" href="/admin/media">
            → Medya yükle
          </a>
        </div>
      </div>
    </div>
  );
}
