// Media kütüphanesi - upload + galeri.
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const UPLOAD_ROOT = join(process.cwd(), "public", "uploads", "admin");

async function uploadAction(formData: FormData) {
  "use server";
  const file = formData.get("file") as File | null;
  if (!file || !file.size) return;

  // YYYY/MM klasor yapisi (mirror'a uygun)
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dir = join(UPLOAD_ROOT, yyyy, mm);
  await mkdir(dir, { recursive: true });

  // Dosya adi: orijinal isim, slugify
  const safeName = file.name
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const filename = `${Date.now()}-${safeName}`;
  const fullPath = join(dir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(fullPath, buffer);

  const publicPath = `/uploads/admin/${yyyy}/${mm}/${filename}`;

  await prisma.mediaAsset.create({
    data: {
      path: publicPath,
      filename,
      mimeType: file.type || "application/octet-stream",
      fileSize: file.size,
    },
  });

  revalidatePath("/admin/media", "page");
  redirect("/admin/media?uploaded=1");
}

async function deleteAction(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  if (!id) return;
  await prisma.mediaAsset.delete({ where: { id } });
  // Note: fiziksel dosya silinmiyor (cleanup ayri job)
  revalidatePath("/admin/media", "page");
}

export default async function MediaPage() {
  const assets = await prisma.mediaAsset.findMany({
    orderBy: { uploadedAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Medya</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Yüklenen görseller — ürün, kategori, sayfa içeriklerinde URL ile referans verin
        </p>
      </div>

      <form
        action={uploadAction}
        encType="multipart/form-data"
        className="rounded-lg border-2 border-dashed border-neutral-300 bg-white p-6"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="text-3xl">⬆️</div>
          <div>
            <h2 className="text-sm font-medium text-neutral-900">
              Görsel/dosya yükle
            </h2>
            <p className="text-xs text-neutral-500">
              JPG, PNG, WebP, SVG, PDF — public/uploads/admin/YYYY/MM altına kaydedilir
            </p>
          </div>
          <input
            type="file"
            name="file"
            required
            accept="image/*,application/pdf"
            className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-emerald-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-emerald-700"
          />
          <button
            type="submit"
            className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Yükle
          </button>
        </div>
      </form>

      {assets.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
          Henüz dosya yok. Yukarıdan yükleyin veya seed'le import edilen mevcut
          uploads kullanılabilir.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {assets.map((a) => {
            const isImage = a.mimeType.startsWith("image/");
            return (
              <div
                key={a.id}
                className="group relative rounded-lg border border-neutral-200 bg-white p-2"
              >
                {isImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={a.path}
                    alt={a.filename}
                    className="aspect-square w-full rounded object-cover"
                  />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center rounded bg-neutral-100 text-2xl">
                    📄
                  </div>
                )}
                <div className="mt-1 truncate text-[10px] text-neutral-600" title={a.filename}>
                  {a.filename}
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <button
                    type="button"
                    className="text-[10px] text-emerald-700 hover:underline"
                    title="URL kopyala"
                  >
                    {a.path.length > 25 ? "..." + a.path.slice(-22) : a.path}
                  </button>
                  <form action={deleteAction}>
                    <input type="hidden" name="id" value={a.id} />
                    <button
                      type="submit"
                      className="text-[10px] text-red-600 hover:underline"
                    >
                      sil
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
