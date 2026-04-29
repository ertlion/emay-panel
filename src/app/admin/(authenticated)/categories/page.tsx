// Kategori listesi — 7 kategori. Düzenle/yeni ekle.
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { order: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Kategoriler</h1>
          <p className="mt-1 text-sm text-neutral-600">
            {categories.length} kategori — başlık 4 dilde
          </p>
        </div>
        <Link
          href="/admin/categories/new"
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          + Yeni Kategori
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wider text-neutral-600">
            <tr>
              <th className="px-4 py-3 font-medium">Sıra</th>
              <th className="px-4 py-3 font-medium">Başlık</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Ürün Sayısı</th>
              <th className="px-4 py-3 font-medium">Durum</th>
              <th className="w-10 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {categories.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-sm text-neutral-500"
                >
                  Kategori yok. Önce seed çalıştırın: npm run db:seed
                </td>
              </tr>
            ) : (
              categories.map((c) => {
                const title = (c.title as Record<string, string>)?.tr ?? c.slug;
                return (
                  <tr key={c.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 text-neutral-600">{c.order}</td>
                    <td className="px-4 py-3 font-medium text-neutral-900">
                      {title}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-600">
                      {c.slug}
                    </td>
                    <td className="px-4 py-3 text-neutral-700">
                      {c._count.products}
                    </td>
                    <td className="px-4 py-3">
                      {c.published ? (
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
                        href={`/admin/categories/${c.id}`}
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
