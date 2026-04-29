// Mevcut statik HTML/JSON port'unu DB'ye doker:
// - Default admin user
// - 7 kategori (slug, termId, title 4 dilde)
// - 22 urun (slug, postId, categoryId, title + short/long desc 4 dilde)
// - 7 statik sayfa (slug, pageId, title + content 4 dilde)
// - 287 translation key (messages/*.json)
//
// Calistir: npx tsx prisma/seed.ts
// VEYA package.json scripts: "seed": "tsx prisma/seed.ts"

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const prisma = new PrismaClient();
const ROOT = resolve(__dirname, "..");

// -----------------------------------------------------------------
// Sabit referans veriler (layout.tsx ve build script'lerden)
// -----------------------------------------------------------------
const CATEGORIES = [
  { slug: "cati-panelleri", termId: 37, order: 1 },
  { slug: "cephe-panelleri", termId: 43, order: 2 },
  { slug: "kombin-paneller", termId: 45, order: 3 },
  { slug: "soguk-oda-panelleri", termId: 47, order: 4 },
  { slug: "ges-uygulama-cozumleri", termId: 41, order: 5 },
  { slug: "trapezler", termId: 49, order: 6 },
  { slug: "tamamlayici-urunler", termId: 50, order: 7 },
];

const CATEGORY_TITLE_KEYS: Record<string, string> = {
  "cati-panelleri": "category.cati.title",
  "cephe-panelleri": "category.cephe.title",
  "kombin-paneller": "category.kombin.title",
  "soguk-oda-panelleri": "category.sogukOda.title",
  "ges-uygulama-cozumleri": "category.ges.title",
  "trapezler": "category.trapez.title",
  "tamamlayici-urunler": "category.tamamlayici.title",
};

const PRODUCTS = [
  { slug: "emay-smart-3h-dv", postId: 27177, category: "cati-panelleri" },
  { slug: "emay-smart-5h-dv", postId: 27178, category: "cati-panelleri" },
  { slug: "emay-smart-5h-dv-ctp", postId: 27180, category: "cati-panelleri" },
  { slug: "emay-smart-5h-dv-pvc-tpo", postId: 27196, category: "cati-panelleri" },
  { slug: "emay-smart-5h-dvt", postId: 27181, category: "cati-panelleri" },
  { slug: "emay-smart-5s-gv", postId: 27176, category: "cati-panelleri" },
  { slug: "emay-smart-akustik-5h-dvt", postId: 27197, category: "cati-panelleri" },
  { slug: "emay-smart-membranli-5h-dvt-pvc-tpo", postId: 27182, category: "cati-panelleri" },
  { slug: "emay-smart-7f", postId: 27184, category: "cephe-panelleri" },
  { slug: "emay-smart-8s", postId: 27185, category: "cephe-panelleri" },
  { slug: "emay-smart-akustik-gvt", postId: 27190, category: "cephe-panelleri" },
  { slug: "emay-smart-dv", postId: 27187, category: "cephe-panelleri" },
  { slug: "emay-smart-dvt", postId: 27189, category: "cephe-panelleri" },
  { slug: "emay-smart-gv", postId: 27183, category: "cephe-panelleri" },
  { slug: "emay-smart-gvt", postId: 27188, category: "cephe-panelleri" },
  { slug: "emay-smart-8s-emay-smart-gv-standart", postId: 27201, category: "kombin-paneller" },
  { slug: "emay-smart-gv-micro-emay-smart-7f", postId: 27199, category: "kombin-paneller" },
  { slug: "emay-smart-gv-micro-emay-smart-gv-standart", postId: 27200, category: "kombin-paneller" },
  { slug: "emay-smart-gv-standart-emay-smart-7f", postId: 27198, category: "kombin-paneller" },
  { slug: "emay-smart-cs-crw-soguk-oda-paneli", postId: 27191, category: "soguk-oda-panelleri" },
  { slug: "c-profil", postId: 27195, category: "tamamlayici-urunler" },
  { slug: "trapez-saclar", postId: 27206, category: "trapezler" },
];

const STATIC_PAGES = [
  { slug: "hakkimizda", pageId: 26469, order: 1 },
  { slug: "iletisim", pageId: 26473, order: 2 },
  { slug: "satis", pageId: 26468, order: 3 },
  { slug: "politikalarimiz", pageId: 27031, order: 4 },
  { slug: "kvkk", pageId: 27276, order: 5 },
  { slug: "kalite-belgelerimiz", pageId: 27249, order: 6 },
  { slug: "is-basvurusu", pageId: 27281, order: 7 },
];

// -----------------------------------------------------------------
// Helper: messages/{locale}.json dan key okur, bulamazsa null doner
// -----------------------------------------------------------------
type Messages = Record<string, unknown>;

function getMessageValue(messages: Messages, key: string): string | null {
  const parts = key.split(".");
  let current: unknown = messages;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return null;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : null;
}

function loadMessages(locale: string): Messages {
  const path = resolve(ROOT, `messages/${locale}.json`);
  return JSON.parse(readFileSync(path, "utf8"));
}

function buildI18nObject(
  messagesByLocale: Record<string, Messages>,
  key: string,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const locale of Object.keys(messagesByLocale)) {
    out[locale] = getMessageValue(messagesByLocale[locale], key) ?? "";
  }
  return out;
}

// -----------------------------------------------------------------
// Main
// -----------------------------------------------------------------
async function main() {
  console.log("🌱 Seeding...");

  // 1. Default admin
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@emay.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "emay-admin-2026";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: { passwordHash },
    create: {
      email: adminEmail,
      passwordHash,
      name: "Admin",
      role: "admin",
    },
  });
  console.log(`✓ Admin user: ${adminEmail}`);

  // 2. Messages yukle
  const locales = ["tr", "en", "ru", "ar"] as const;
  const messagesByLocale: Record<string, Messages> = {};
  for (const loc of locales) {
    messagesByLocale[loc] = loadMessages(loc);
  }
  console.log(`✓ Loaded messages for ${locales.length} locales`);

  // 3. Kategoriler
  for (const cat of CATEGORIES) {
    const titleKey = CATEGORY_TITLE_KEYS[cat.slug];
    const title = titleKey
      ? buildI18nObject(messagesByLocale, titleKey)
      : { tr: cat.slug, en: cat.slug, ru: cat.slug, ar: cat.slug };

    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { title, order: cat.order, termId: cat.termId },
      create: {
        slug: cat.slug,
        termId: cat.termId,
        title,
        order: cat.order,
        published: true,
      },
    });
  }
  console.log(`✓ ${CATEGORIES.length} categories`);

  // 4. Urunler
  const categoryMap = new Map(
    (await prisma.category.findMany({ select: { id: true, slug: true } })).map(
      (c) => [c.slug, c.id],
    ),
  );

  let prodCount = 0;
  for (const p of PRODUCTS) {
    const categoryId = categoryMap.get(p.category);
    if (!categoryId) {
      console.warn(`  ! No category for ${p.slug}`);
      continue;
    }

    // Title - product.<slug>.title key (mevcut messages'ta yoksa fallback)
    const titleKey = `product.${p.slug}.title`;
    let title = buildI18nObject(messagesByLocale, titleKey);
    if (!title.tr) {
      // Fallback: slug'tan insanca isim olustur
      const human = p.slug
        .split("-")
        .map((w) => w[0].toUpperCase() + w.slice(1))
        .join(" ");
      title = { tr: human, en: human, ru: human, ar: human };
    }

    const shortDesc = buildI18nObject(messagesByLocale, `product.${p.slug}.shortDesc`);
    const longDesc = buildI18nObject(messagesByLocale, `product.${p.slug}.longDesc`);

    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        title,
        shortDesc: Object.values(shortDesc).some(Boolean) ? shortDesc : undefined,
        longDesc: Object.values(longDesc).some(Boolean) ? longDesc : undefined,
        categoryId,
        postId: p.postId,
      },
      create: {
        slug: p.slug,
        postId: p.postId,
        categoryId,
        title,
        shortDesc: Object.values(shortDesc).some(Boolean) ? shortDesc : undefined,
        longDesc: Object.values(longDesc).some(Boolean) ? longDesc : undefined,
        published: true,
      },
    });
    prodCount++;
  }
  console.log(`✓ ${prodCount}/${PRODUCTS.length} products`);

  // 5. Statik sayfalar
  for (const sp of STATIC_PAGES) {
    const titleKey = `page.${sp.slug}.title`;
    const contentKey = `page.${sp.slug}.content`;

    let title = buildI18nObject(messagesByLocale, titleKey);
    if (!title.tr) {
      const fallback: Record<string, string> = {
        hakkimizda: "Hakkımızda",
        iletisim: "İletişim",
        satis: "Satış",
        politikalarimiz: "Politikalarımız",
        kvkk: "KVKK",
        "kalite-belgelerimiz": "Kalite Belgelerimiz",
        "is-basvurusu": "İş Başvurusu",
      };
      const t = fallback[sp.slug] ?? sp.slug;
      title = { tr: t, en: t, ru: t, ar: t };
    }
    const contentHtml = buildI18nObject(messagesByLocale, contentKey);

    await prisma.staticPage.upsert({
      where: { slug: sp.slug },
      update: { title, order: sp.order, pageId: sp.pageId },
      create: {
        slug: sp.slug,
        pageId: sp.pageId,
        title,
        contentHtml: Object.values(contentHtml).some(Boolean)
          ? contentHtml
          : { tr: "", en: "", ru: "", ar: "" },
        order: sp.order,
        published: true,
        showInFooter: true,
      },
    });
  }
  console.log(`✓ ${STATIC_PAGES.length} static pages`);

  // 6. Translation keys - messages/tr.json'i flatten et, tum key'leri DB'ye ekle
  function flatten(obj: Messages, prefix = ""): Array<[string, string]> {
    const out: Array<[string, string]> = [];
    for (const [k, v] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${k}` : k;
      if (typeof v === "string") out.push([path, v]);
      else if (v && typeof v === "object")
        out.push(...flatten(v as Messages, path));
    }
    return out;
  }

  const trFlat = flatten(messagesByLocale.tr);
  let keyCount = 0;
  for (const [key] of trFlat) {
    const values: Record<string, string> = {};
    for (const loc of locales) {
      const v = getMessageValue(messagesByLocale[loc], key);
      if (v !== null) values[loc] = v;
    }
    const group = key.split(".")[0]; // "header", "footer", "product", vb.
    await prisma.translationKey.upsert({
      where: { key },
      update: { values, group },
      create: { key, values, group },
    });
    keyCount++;
  }
  console.log(`✓ ${keyCount} translation keys`);

  console.log("\n✅ Seed complete");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
