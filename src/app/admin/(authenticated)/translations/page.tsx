// Translation keys listesi - 287 key 4 dilde editable.
// Server side filter (group + search), inline-style sheet edit ile.
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ q?: string; group?: string; page?: string }>;

const PAGE_SIZE = 50;

export default async function TranslationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q = "", group = "", page = "1" } = await searchParams;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const skip = (pageNum - 1) * PAGE_SIZE;

  const where = {
    AND: [
      q
        ? {
            OR: [{ key: { contains: q, mode: "insensitive" as const } }],
          }
        : {},
      group ? { group } : {},
    ],
  };

  const [items, total, groups] = await Promise.all([
    prisma.translationKey.findMany({
      where,
      orderBy: { key: "asc" },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.translationKey.count({ where }),
    prisma.translationKey.findMany({
      distinct: ["group"],
      select: { group: true },
      where: { group: { not: null } },
      orderBy: { group: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const uniqueGroups = [
    ...new Set(groups.map((g) => g.group).filter(Boolean)),
  ] as string[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Çeviriler</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Header, footer, butonlar ve diğer UI metinleri — 4 dilde
        </p>
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 bg-white p-4">
        <div className="min-w-[200px] flex-1">
          <label className="mb-1 block text-xs font-medium text-neutral-700">
            Anahtar ara
          </label>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="header.nav, footer.products..."
            className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-700">
            Grup
          </label>
          <select
            name="group"
            defaultValue={group}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm outline-none focus:border-emerald-500"
          >
            <option value="">Tümü</option>
            {uniqueGroups.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Filtrele
        </button>
        {(q || group) && (
          <Link
            href="/admin/translations"
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
              <th className="px-4 py-3 font-medium">Anahtar</th>
              <th className="px-4 py-3 font-medium">TR</th>
              <th className="px-4 py-3 font-medium">EN</th>
              <th className="px-4 py-3 font-medium">RU</th>
              <th className="px-4 py-3 font-medium">AR</th>
              <th className="w-10 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-sm text-neutral-500"
                >
                  Sonuç yok. {!total && "Önce seed çalıştırın: npm run db:seed"}
                </td>
              </tr>
            ) : (
              items.map((row) => {
                const v = (row.values as Record<string, string>) ?? {};
                return (
                  <tr key={row.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-mono text-xs">
                      <div className="font-medium text-neutral-900">
                        {row.key}
                      </div>
                      {row.group && (
                        <div className="mt-0.5 text-[10px] text-neutral-500">
                          {row.group}
                        </div>
                      )}
                    </td>
                    <td
                      className="max-w-[200px] truncate px-4 py-3 text-neutral-700"
                      title={v.tr}
                    >
                      {v.tr || <em className="text-neutral-400">—</em>}
                    </td>
                    <td
                      className="max-w-[200px] truncate px-4 py-3 text-neutral-700"
                      title={v.en}
                    >
                      {v.en || <em className="text-neutral-400">—</em>}
                    </td>
                    <td
                      className="max-w-[200px] truncate px-4 py-3 text-neutral-700"
                      title={v.ru}
                    >
                      {v.ru || <em className="text-neutral-400">—</em>}
                    </td>
                    <td
                      className="max-w-[200px] truncate px-4 py-3 text-neutral-700"
                      dir="rtl"
                      title={v.ar}
                    >
                      {v.ar || <em className="text-neutral-400">—</em>}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/translations/${row.id}`}
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-600">
            {skip + 1}-{Math.min(skip + PAGE_SIZE, total)} / {total}
          </span>
          <div className="flex gap-1">
            {pageNum > 1 && (
              <Link
                href={`/admin/translations?q=${q}&group=${group}&page=${pageNum - 1}`}
                className="rounded-md border border-neutral-300 px-3 py-1 hover:bg-neutral-50"
              >
                ←
              </Link>
            )}
            <span className="px-3 py-1">
              {pageNum} / {totalPages}
            </span>
            {pageNum < totalPages && (
              <Link
                href={`/admin/translations?q=${q}&group=${group}&page=${pageNum + 1}`}
                className="rounded-md border border-neutral-300 px-3 py-1 hover:bg-neutral-50"
              >
                →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
