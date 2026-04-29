import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { I18nField } from "@/app/admin/_components/I18nField";
import { I18nForm } from "@/app/admin/_components/I18nForm";
import { extractI18n } from "@/app/admin/_lib/i18n-form";
import { syncStaticPageTranslations } from "@/lib/sync-translations";
import { updateTag } from "next/cache";

export const dynamic = "force-dynamic";

async function updateAction(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  if (!id) return;

  const title = extractI18n(formData, "title");
  const contentHtml = extractI18n(formData, "contentHtml");
  const metaDescription = extractI18n(formData, "metaDescription");

  const updated = await prisma.staticPage.update({
    where: { id },
    data: {
      slug: String(formData.get("slug")),
      title,
      contentHtml,
      metaDescription,
      published: formData.get("published") === "on",
      showInFooter: formData.get("showInFooter") === "on",
      order: Number(formData.get("order") ?? 0),
    },
  });

  await syncStaticPageTranslations(updated.slug, {
    title,
    contentHtml,
    metaDescription,
  });

  revalidatePath("/admin/pages", "page");
  revalidatePath("/", "layout");
  updateTag("translations");
  redirect("/admin/pages?saved=1");
}

async function deleteAction(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  if (!id) return;
  await prisma.staticPage.delete({ where: { id } });
  revalidatePath("/admin/pages", "page");
  redirect("/admin/pages?deleted=1");
}

export default async function StaticPageEdit({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const page = await prisma.staticPage.findUnique({ where: { id } });
  if (!page) notFound();

  const title = (page.title as Record<string, string>) ?? {};
  const contentHtml = (page.contentHtml as Record<string, string>) ?? {};
  const metaDescription = (page.metaDescription as Record<string, string> | null) ?? {};

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-neutral-600">
        <Link href="/admin/pages" className="hover:text-neutral-900">
          ← Sayfalar
        </Link>
      </div>

      <h1 className="text-2xl font-semibold tracking-tight">
        {title.tr || page.slug}
      </h1>

      <form action={updateAction} className="space-y-4">
        <input type="hidden" name="id" value={page.id} />

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
                defaultValue={page.slug}
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
                defaultValue={page.order}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="published"
                  defaultChecked={page.published}
                  className="h-4 w-4 rounded border-neutral-300 text-emerald-600"
                />
                <span>Yayında</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="showInFooter"
                  defaultChecked={page.showInFooter}
                  className="h-4 w-4 rounded border-neutral-300 text-emerald-600"
                />
                <span>Footer'da göster</span>
              </label>
            </div>
          </div>
        </div>
        <I18nForm className="space-y-4">

        <I18nField name="title" label="Başlık" values={title} required />
        <I18nField
          name="contentHtml"
          label="İçerik (HTML)"
          type="textarea"
          rows={20}
          values={contentHtml}
          hint="Sayfanın ana içeriği. HTML kabul eder (başlık, paragraf, liste, görsel)."
        />
        <I18nField
          name="metaDescription"
          label="Meta Description (SEO)"
          type="textarea"
          rows={2}
          values={metaDescription}
          hint="Google sonuç sayfasında 150-160 karakterlik özet."
        />
        </I18nForm>

        <div className="flex items-center justify-between border-t border-neutral-200 pt-4">
          <button
            type="submit"
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Kaydet
          </button>
          <Link
            href="/admin/pages"
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
        <input type="hidden" name="id" value={page.id} />
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-red-900">Sayfayı Sil</h3>
            <p className="text-xs text-red-700">Bu işlem geri alınamaz.</p>
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
