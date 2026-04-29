// Yeni ürün ekle.
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { I18nField } from "@/app/admin/_components/I18nField";
import { I18nForm } from "@/app/admin/_components/I18nForm";
import { extractI18n } from "@/app/admin/_lib/i18n-form";

export const dynamic = "force-dynamic";

async function createAction(formData: FormData) {
  "use server";
  const slug = String(formData.get("slug")).trim();
  const categoryId = String(formData.get("categoryId"));
  if (!slug || !categoryId) return;

  const title = extractI18n(formData, "title");
  const shortDesc = extractI18n(formData, "shortDesc");
  const longDesc = extractI18n(formData, "longDesc");

  // postId opsiyonel - WordPress'ten import durumunda. Yeni urun icin
  // 30000+ aralikta bos bir ID urut.
  const last = await prisma.product.findFirst({
    orderBy: { postId: "desc" },
    select: { postId: true },
  });
  const postId = (last?.postId ?? 30000) + 1;

  const product = await prisma.product.create({
    data: {
      slug,
      postId,
      categoryId,
      title,
      shortDesc: Object.values(shortDesc).some(Boolean) ? shortDesc : undefined,
      longDesc: Object.values(longDesc).some(Boolean) ? longDesc : undefined,
      published: formData.get("published") === "on",
      featured: formData.get("featured") === "on",
      order: Number(formData.get("order") ?? 0),
    },
  });

  revalidatePath("/admin/products", "page");
  revalidatePath("/", "layout");
  redirect(`/admin/products/${product.id}`);
}

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({ orderBy: { order: "asc" } });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-neutral-600">
        <Link href="/admin/products" className="hover:text-neutral-900">
          ← Ürünler
        </Link>
      </div>

      <h1 className="text-2xl font-semibold tracking-tight">Yeni Ürün</h1>

      <form action={createAction} className="space-y-4">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <h2 className="mb-4 text-sm font-medium text-neutral-900">
            Genel Ayarlar
          </h2>
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
                type="text"
                required
                pattern="[a-z0-9-]+"
                placeholder="emay-smart-yeni-urun"
                className="w-full rounded-md border border-neutral-300 px-3 py-2 font-mono text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
              <p className="mt-1 text-[11px] text-neutral-500">
                Sadece küçük harf, rakam ve tire. URL'de görünür.
              </p>
            </div>
            <div>
              <label
                htmlFor="categoryId"
                className="mb-1 block text-xs font-medium text-neutral-700"
              >
                Kategori *
              </label>
              <select
                id="categoryId"
                name="categoryId"
                required
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              >
                <option value="">— Seçin —</option>
                {categories.map((c) => {
                  const ct = (c.title as Record<string, string>)?.tr ?? c.slug;
                  return (
                    <option key={c.id} value={c.id}>
                      {ct}
                    </option>
                  );
                })}
              </select>
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
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="published"
                  defaultChecked
                  className="h-4 w-4 rounded border-neutral-300 text-emerald-600"
                />
                <span>Yayında</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="featured"
                  className="h-4 w-4 rounded border-neutral-300 text-emerald-600"
                />
                <span>Öne çıkan</span>
              </label>
            </div>
          </div>
        </div>
        <I18nForm className="space-y-4">

        <I18nField name="title" label="Başlık" required />
        <I18nField name="shortDesc" label="Kısa Açıklama (HTML)" type="textarea" rows={4} />
        <I18nField name="longDesc" label="Uzun Açıklama (HTML)" type="textarea" rows={10} />
        </I18nForm>

        <div className="flex items-center justify-between border-t border-neutral-200 pt-4">
          <button
            type="submit"
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Oluştur
          </button>
          <Link
            href="/admin/products"
            className="text-sm text-neutral-600 hover:text-neutral-900"
          >
            İptal
          </Link>
        </div>
      </form>
    </div>
  );
}
