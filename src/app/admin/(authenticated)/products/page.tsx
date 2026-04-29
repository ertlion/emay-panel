// Ürün listesi - kategori filtreli, aramali.
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ q?: string; category?: string }>;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q = "", category = "" } = await searchParams;

  const where = {
    AND: [
      q
        ? {
            OR: [
              { slug: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {},
      category ? { categoryId: category } : {},
    ],
  };

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: { select: { slug: true, title: true } },
        _count: { select: { images: true } },
      },
      orderBy: [{ category: { order: "asc" } }, { order: "asc" }, { slug: "asc" }],
    }),
    prisma.category.findMany({ orderBy: { order: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ürünler</h1>
          <p className="mt-1 text-sm text-neutral-600">
            {products.length} ürün — başlık, kategori, açıklama, görsel yönetimi
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          + Yeni Ürün
        </Link>
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 bg-white p-4">
        <div className="min-w-[200px] flex-1">
          <label className="mb-1 block text-xs font-medium text-neutral-700">
            Slug ara
          </label>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="emay-smart..."
            className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-700">
            Kategori
          </label>
          <select
            name="category"
            defaultValue={category}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm outline-none focus:border-emerald-500"
          >
            <option value="">Tümü</option>
            {categories.map((c) => {
              const title = (c.title as Record<string, string>)?.tr ?? c.slug;
              return (
                <option key={c.id} value={c.id}>
                  {title}
                </option>
              );
            })}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Filtrele
        </button>
        {(q || category) && (
          <Link
            href="/admin/products"
            className="text-sm text-neutral-500 hover:text-neutral-700"
          >
            Temizle
          </Link>
        )}
      </form>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wider text-neutral-600">
            <tr>
              <th className="px-4 py-3 font-medium">Başlık</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Kategori</th>
              <th className="px-4 py-3 font-medium">Görseller</th>
              <th className="px-4 py-3 font-medium">Durum</th>
              <th className="w-10 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {products.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-sm text-neutral-500"
                >
                  Ürün yok. Önce seed çalıştırın: npm run db:seed
                </td>
              </tr>
            ) : (
              products.map((p) => {
                const title = (p.title as Record<string, string>)?.tr ?? p.slug;
                const catTitle =
                  (p.category.title as Record<string, string>)?.tr ?? p.category.slug;
                return (
                  <tr key={p.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-medium text-neutral-900">
                      {title}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-600">
                      {p.slug}
                    </td>
                    <td className="px-4 py-3 text-neutral-700">{catTitle}</td>
                    <td className="px-4 py-3 text-neutral-600">
                      {p._count.images}
                    </td>
                    <td className="px-4 py-3">
                      {p.published ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                          yayında
                        </span>
                      ) : (
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                          taslak
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="text-xs text-emerald-700 hover:underline"
                      >
                        Düzenle
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
