import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { I18nField, extractI18n } from "@/app/admin/_components/I18nField";

export const dynamic = "force-dynamic";

async function createAction(formData: FormData) {
  "use server";
  const slug = String(formData.get("slug")).trim();
  if (!slug) return;

  const last = await prisma.category.findFirst({
    orderBy: { termId: "desc" },
    select: { termId: true },
  });
  const termId = (last?.termId ?? 100) + 1;

  const cat = await prisma.category.create({
    data: {
      slug,
      termId,
      title: extractI18n(formData, "title"),
      description: extractI18n(formData, "description"),
      heroImage: String(formData.get("heroImage") ?? "") || null,
      published: formData.get("published") === "on",
      order: Number(formData.get("order") ?? 0),
    },
  });

  revalidatePath("/admin/categories", "page");
  revalidatePath("/", "layout");
  redirect(`/admin/categories/${cat.id}`);
}

export default function NewCategoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-neutral-600">
        <Link href="/admin/categories" className="hover:text-neutral-900">
          ← Kategoriler
        </Link>
      </div>

      <h1 className="text-2xl font-semibold tracking-tight">Yeni Kategori</h1>

      <form action={createAction} className="space-y-4">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="slug"
                className="mb-1 block text-xs font-medium text-neutral-700"
              >
                Slug *
              </label>
              <input
                id="slug"
                name="slug"
                required
                pattern="[a-z0-9-]+"
                placeholder="yeni-kategori"
                className="w-full rounded-md border border-neutral-300 px-3 py-2 font-mono text-sm outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label
                htmlFor="order"
                className="mb-1 block text-xs font-medium text-neutral-700"
              >
                Sıra
              </label>
              <input
                id="order"
                name="order"
                type="number"
                defaultValue={0}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label
                htmlFor="heroImage"
                className="mb-1 block text-xs font-medium text-neutral-700"
              >
                Banner Görsel
              </label>
              <input
                id="heroImage"
                name="heroImage"
                placeholder="/uploads/..."
                className="w-full rounded-md border border-neutral-300 px-3 py-2 font-mono text-sm outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="published"
                  defaultChecked
                  className="h-4 w-4 rounded border-neutral-300 text-emerald-600"
                />
                <span>Yayında</span>
              </label>
            </div>
          </div>
        </div>

        <I18nField name="title" label="Başlık" required />
        <I18nField name="description" label="Açıklama (SEO)" type="textarea" rows={3} />

        <div className="flex items-center justify-between border-t border-neutral-200 pt-4">
          <button
            type="submit"
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Oluştur
          </button>
          <Link
            href="/admin/categories"
            className="text-sm text-neutral-600 hover:text-neutral-900"
          >
            İptal
          </Link>
        </div>
      </form>
    </div>
  );
}
