// Tek translation key detay editörü - 4 dil yan yana.
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const LOCALES = [
  { code: "tr", label: "Türkçe", dir: "ltr" },
  { code: "en", label: "English", dir: "ltr" },
  { code: "ru", label: "Русский", dir: "ltr" },
  { code: "ar", label: "العربية", dir: "rtl" },
] as const;

async function updateAction(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  if (!id) return;

  const values: Record<string, string> = {};
  for (const loc of LOCALES) {
    values[loc.code] = String(formData.get(loc.code) ?? "");
  }

  await prisma.translationKey.update({
    where: { id },
    data: { values },
  });

  revalidatePath("/admin/translations", "page");
  revalidatePath(`/admin/translations/${id}`, "page");
  // Public sayfada anlik yansisin: DB-driven request.ts cache tag'ini invalidate
  revalidatePath("/", "layout");
  updateTag("translations");

  redirect("/admin/translations?saved=1");
}

export default async function TranslationEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await prisma.translationKey.findUnique({ where: { id } });
  if (!item) notFound();

  const values = (item.values as Record<string, string>) ?? {};

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-neutral-600">
        <Link href="/admin/translations" className="hover:text-neutral-900">
          ← Tüm çeviriler
        </Link>
      </div>

      <div>
        <h1 className="font-mono text-xl font-semibold tracking-tight text-neutral-900">
          {item.key}
        </h1>
        {item.group && (
          <span className="mt-1 inline-block rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
            grup: {item.group}
          </span>
        )}
        {item.notes && (
          <p className="mt-2 text-sm text-neutral-600">{item.notes}</p>
        )}
      </div>

      <form action={updateAction} className="space-y-4">
        <input type="hidden" name="id" value={item.id} />

        {LOCALES.map((loc) => (
          <div
            key={loc.code}
            className="rounded-lg border border-neutral-200 bg-white p-4"
          >
            <label
              htmlFor={loc.code}
              className="mb-2 flex items-center gap-2 text-sm font-medium text-neutral-700"
            >
              <span className="rounded bg-neutral-100 px-2 py-0.5 font-mono text-xs uppercase">
                {loc.code}
              </span>
              <span>{loc.label}</span>
            </label>
            <textarea
              id={loc.code}
              name={loc.code}
              defaultValue={values[loc.code] ?? ""}
              dir={loc.dir}
              rows={values[loc.code]?.length > 100 ? 5 : 2}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        ))}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Kaydet
          </button>
          <Link
            href="/admin/translations"
            className="text-sm text-neutral-600 hover:text-neutral-900"
          >
            İptal
          </Link>
        </div>
      </form>
    </div>
  );
}
