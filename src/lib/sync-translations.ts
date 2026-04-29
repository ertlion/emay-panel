// Admin'den content guncellenince ilgili translation_key'leri de senkronize eder.
// Public site mesajlar(token) uzerinden okuyor (__T_product.<slug>.longDesc__),
// bu yuzden hem domain modelinde (Product.longDesc) hem translation_key'de
// veriyi tutuyoruz. Tek dogruluk kaynagi domain modeli; sync helper bunu
// translation_key'e yansitir.

import { prisma } from "@/lib/prisma";

type I18n = Record<string, string>;

async function upsertKey(key: string, values: I18n, group: string) {
  // Bos degerleri (tum diller) iceren key'leri olusturma - gereksiz.
  const hasAny = Object.values(values).some((v) => v && v.trim().length > 0);
  if (!hasAny) {
    // Eger varsa silmek isteyebiliriz, ama silmek public site'i kirar - sadece atla.
    return;
  }
  await prisma.translationKey.upsert({
    where: { key },
    update: { values, group },
    create: { key, values, group },
  });
}

export async function syncProductTranslations(
  slug: string,
  data: { title?: I18n; shortDesc?: I18n; longDesc?: I18n },
) {
  if (data.title) await upsertKey(`product.${slug}.title`, data.title, "product");
  if (data.shortDesc)
    await upsertKey(`product.${slug}.shortDesc`, data.shortDesc, "product");
  if (data.longDesc)
    await upsertKey(`product.${slug}.longDesc`, data.longDesc, "product");
}

export async function syncCategoryTranslations(
  slug: string,
  data: { title?: I18n; description?: I18n },
) {
  // Bilinen kategori slug'larini var olan key formatina map'le (mevcut messages
  // shorten suffix kullaniyor: cati.title, cephe.title, kombin.title vb.)
  const SHORT_FORMS: Record<string, string> = {
    "cati-panelleri": "cati",
    "cephe-panelleri": "cephe",
    "kombin-paneller": "kombin",
    "soguk-oda-panelleri": "sogukOda",
    "ges-uygulama-cozumleri": "ges",
    trapezler: "trapez",
    "tamamlayici-urunler": "tamamlayici",
  };
  const short = SHORT_FORMS[slug] ?? slug;

  if (data.title) {
    await upsertKey(`category.${short}.title`, data.title, "category");
  }
  if (data.description) {
    await upsertKey(`category.${short}.description`, data.description, "category");
  }
}

export async function syncStaticPageTranslations(
  slug: string,
  data: { title?: I18n; contentHtml?: I18n; metaDescription?: I18n },
) {
  if (data.title) await upsertKey(`page.${slug}.title`, data.title, "page");
  if (data.contentHtml)
    await upsertKey(`page.${slug}.content`, data.contentHtml, "page");
  if (data.metaDescription)
    await upsertKey(`page.${slug}.metaDescription`, data.metaDescription, "page");
}
