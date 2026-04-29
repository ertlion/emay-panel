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
  if (!slug) return;

  const page = await prisma.staticPage.create({
    data: {
      slug,
      title: extractI18n(formData, "title"),
      contentHtml: extractI18n(formData, "contentHtml"),
      metaDescription: extractI18n(formData, "metaDescription"),
      published: formData.get("published") === "on",
      showInFooter: formData.get("showInFooter") === "on",
      order: Number(formData.get("order") ?? 0),
    },
  });

  revalidatePath("/admin/pages", "page");
  revalidatePath("/", "layout");
  redirect(`/admin/pages/${page.id}`);
}

export default function NewStaticPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-neutral-600">
        <Link href="/admin/pages" className="hover:text-neutral-900">
          ← Sayfalar
        </Link>
      </div>

      <h1 className="text-2xl font-semibold tracking-tight">Yeni Sayfa</h1>

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
                placeholder="yeni-sayfa"
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
                  name="showInFooter"
                  defaultChecked
                  className="h-4 w-4 rounded border-neutral-300 text-emerald-600"
                />
                <span>Footer'da göster</span>
              </label>
            </div>
          </div>
        </div>
        <I18nForm className="space-y-4">

        <I18nField name="title" label="Başlık" required />
        <I18nField name="contentHtml" label="İçerik (HTML)" type="textarea" rows={20} />
        <I18nField name="metaDescription" label="Meta Description" type="textarea" rows={2} />
        </I18nForm>

        <div className="flex items-center justify-between border-t border-neutral-200 pt-4">
          <button
            type="submit"
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Oluştur
          </button>
          <Link
            href="/admin/pages"
            className="text-sm text-neutral-600 hover:text-neutral-900"
          >
            İptal
          </Link>
        </div>
      </form>
    </div>
  );
}
