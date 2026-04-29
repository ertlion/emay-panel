// Ürün düzenleme - başlık (4 dil) + kategori + slug + short/long desc + published.
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { I18nField, extractI18n } from "@/app/admin/_components/I18nField";
import { syncProductTranslations } from "@/lib/sync-translations";
import { updateTag } from "next/cache";

export const dynamic = "force-dynamic";

async function updateAction(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  if (!id) return;

  const title = extractI18n(formData, "title");
  const shortDesc = extractI18n(formData, "shortDesc");
  const longDesc = extractI18n(formData, "longDesc");

  const slug = String(formData.get("slug"));

  const updated = await prisma.product.update({
    where: { id },
    data: {
      slug,
      categoryId: String(formData.get("categoryId")),
      title,
      shortDesc: Object.values(shortDesc).some(Boolean) ? shortDesc : undefined,
      longDesc: Object.values(longDesc).some(Boolean) ? longDesc : undefined,
      published: formData.get("published") === "on",
      featured: formData.get("featured") === "on",
      order: Number(formData.get("order") ?? 0),
    },
  });

  // Public site bu icerikleri translation_key uzerinden okuyor - sync et
  await syncProductTranslations(updated.slug, {
    title,
    shortDesc: Object.values(shortDesc).some(Boolean) ? shortDesc : undefined,
    longDesc: Object.values(longDesc).some(Boolean) ? longDesc : undefined,
  });

  revalidatePath("/admin/products", "page");
  revalidatePath(`/admin/products/${id}`, "page");
  revalidatePath("/", "layout");
  updateTag("translations");
  redirect("/admin/products?saved=1");
}

async function deleteAction(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  if (!id) return;
  await prisma.product.delete({ where: { id } });
  revalidatePath("/admin/products", "page");
  redirect("/admin/products?deleted=1");
}

export default async function ProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { images: { orderBy: { order: "asc" } } },
    }),
    prisma.category.findMany({ orderBy: { order: "asc" } }),
  ]);

  if (!product) notFound();

  const title = (product.title as Record<string, string>) ?? {};
  const shortDesc = (product.shortDesc as Record<string, string> | null) ?? {};
  const longDesc = (product.longDesc as Record<string, string> | null) ?? {};

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-neutral-600">
        <Link href="/admin/products" className="hover:text-neutral-900">
          ← Ürünler
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {title.tr || product.slug}
          </h1>
          <p className="mt-1 font-mono text-xs text-neutral-500">
            postId: {product.postId}
          </p>
        </div>
      </div>

      <form action={updateAction} className="space-y-4">
        <input type="hidden" name="id" value={product.id} />

        {/* Genel ayarlar */}
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
                Slug
              </label>
              <input
                id="slug"
                name="slug"
                type="text"
                required
                defaultValue={product.slug}
                pattern="[a-z0-9-]+"
                className="w-full rounded-md border border-neutral-300 px-3 py-2 font-mono text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <div>
              <label
                htmlFor="categoryId"
                className="mb-1 block text-xs font-medium text-neutral-700"
              >
                Kategori
              </label>
              <select
                id="categoryId"
                name="categoryId"
                required
                defaultValue={product.categoryId}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              >
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
                defaultValue={product.order}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="published"
                  defaultChecked={product.published}
                  className="h-4 w-4 rounded border-neutral-300 text-emerald-600"
                />
                <span>Yayında</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="featured"
                  defaultChecked={product.featured}
                  className="h-4 w-4 rounded border-neutral-300 text-emerald-600"
                />
                <span>Öne çıkan</span>
              </label>
            </div>
          </div>
        </div>

        <I18nField
          name="title"
          label="Başlık"
          values={title}
          required
          hint="Ürün adı, 4 dilde. Örn: Emay Smart 3H DV"
        />

        <I18nField
          name="shortDesc"
          label="Kısa Açıklama (HTML)"
          type="textarea"
          rows={4}
          values={shortDesc}
          hint="Ürün başlığı altında görünür. HTML kabul eder."
        />

        <I18nField
          name="longDesc"
          label="Uzun Açıklama (HTML)"
          type="textarea"
          rows={10}
          values={longDesc}
          hint="Açıklama tabında görünür. Tablo, görsel, formatted text destekler."
        />

        {product.images.length > 0 && (
          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-medium text-neutral-900">
              Görseller ({product.images.length})
            </h2>
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
              {product.images.map((img) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={img.id}
                  src={img.url}
                  alt=""
                  className="aspect-square rounded border border-neutral-200 object-cover"
                />
              ))}
            </div>
            <p className="mt-2 text-xs text-neutral-500">
              Görsel yönetimi yakında — şu an mevcut görseller gösteriliyor.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-neutral-200 pt-4">
          <button
            type="submit"
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Kaydet
          </button>
          <Link
            href="/admin/products"
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
        <input type="hidden" name="id" value={product.id} />
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-red-900">Ürünü Sil</h3>
            <p className="text-xs text-red-700">
              Bu işlem geri alınamaz. Görseller de silinir.
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
