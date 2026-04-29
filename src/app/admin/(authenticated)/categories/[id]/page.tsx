// Kategori düzenle.
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { I18nField, extractI18n } from "@/app/admin/_components/I18nField";
import { syncCategoryTranslations } from "@/lib/sync-translations";
import { updateTag } from "next/cache";

export const dynamic = "force-dynamic";

async function updateAction(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  if (!id) return;

  const title = extractI18n(formData, "title");
  const description = extractI18n(formData, "description");

  const updated = await prisma.category.update({
    where: { id },
    data: {
      slug: String(formData.get("slug")),
      title,
      description,
      heroImage: String(formData.get("heroImage") ?? "") || null,
      published: formData.get("published") === "on",
      order: Number(formData.get("order") ?? 0),
    },
  });

  await syncCategoryTranslations(updated.slug, { title, description });

  revalidatePath("/admin/categories", "page");
  revalidatePath("/", "layout");
  updateTag("translations");
  redirect("/admin/categories?saved=1");
}

async function deleteAction(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  if (!id) return;
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categories", "page");
  redirect("/admin/categories?deleted=1");
}

export default async function CategoryEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
  if (!category) notFound();

  const title = (category.title as Record<string, string>) ?? {};
  const description = (category.description as Record<string, string> | null) ?? {};

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-neutral-600">
        <Link href="/admin/categories" className="hover:text-neutral-900">
          ← Kategoriler
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {title.tr || category.slug}
        </h1>
        <p className="mt-1 text-xs text-neutral-500">
          termId: {category.termId} • {category._count.products} ürün
        </p>
      </div>

      <form action={updateAction} className="space-y-4">
        <input type="hidden" name="id" value={category.id} />

        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="slug"
                className="mb-1 block text-xs font-medium text-neutral-700"
              >
                Slug
              </label>
              <input
                id="slug"
                name="slug"
                required
                pattern="[a-z0-9-]+"
                defaultValue={category.slug}
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
                defaultValue={category.order}
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
                defaultValue={category.heroImage ?? ""}
                placeholder="/uploads/2026/04/banner.jpg"
                className="w-full rounded-md border border-neutral-300 px-3 py-2 font-mono text-sm outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="published"
                  defaultChecked={category.published}
                  className="h-4 w-4 rounded border-neutral-300 text-emerald-600"
                />
                <span>Yayında</span>
              </label>
            </div>
          </div>
        </div>

        <I18nField name="title" label="Başlık" values={title} required />
        <I18nField
          name="description"
          label="Açıklama (SEO)"
          type="textarea"
          rows={3}
          values={description}
          hint="Meta description ve hero altında kullanılır."
        />

        <div className="flex items-center justify-between border-t border-neutral-200 pt-4">
          <button
            type="submit"
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Kaydet
          </button>
          <Link
            href="/admin/categories"
            className="text-sm text-neutral-600 hover:text-neutral-900"
          >
            İptal
          </Link>
        </div>
      </form>

      <form
        action={deleteAction}
        className="rounded-lg border border-red-200 bg-red-50 p-4"
      >
        <input type="hidden" name="id" value={category.id} />
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-red-900">Kategoriyi Sil</h3>
            <p className="text-xs text-red-700">
              {category._count.products > 0
                ? `${category._count.products} ürün de silinir!`
                : "Bu işlem geri alınamaz."}
            </p>
          </div>
          <button
            type="submit"
            className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
          >
            Sil
          </button>
        </div>
      </form>
    </div>
  );
}
