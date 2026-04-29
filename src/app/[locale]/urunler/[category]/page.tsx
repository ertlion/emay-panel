// Kategori sayfasi - emaypanel.com/kategori/<slug>/index.html'den DOM-birebir port edildi.
// Kaynak: scripts/build-category-html.mjs tarafindan uretilen _categories-static.ts.
// 7 kategori × 4 locale = 28 statik sayfa prerender.

import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { categoryPages } from "./_categories-static";
import { routing, type Locale } from "@/i18n/routing";
import { localizeHrefs } from "@/lib/localize-href";

const VALID_CATEGORIES = [
  "cati-panelleri",
  "cephe-panelleri",
  "kombin-paneller",
  "soguk-oda-panelleri",
  "ges-uygulama-cozumleri",
  "trapezler",
  "tamamlayici-urunler",
] as const;

// Slug'lar icerebilir: hyphen + alfanumerik + . + _
const TOKEN_PATTERN = /__T_([a-zA-Z0-9_.\-]+)__/g;

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

export function generateStaticParams() {
  // Tum locale × kategori kombinasyonlarini build-time'da render et.
  return routing.locales.flatMap((locale) =>
    VALID_CATEGORIES.map((category) => ({ locale, category })),
  );
}

type PageProps = {
  params: Promise<{ locale: string; category: string }>;
};

export default async function CategoryPage({ params }: PageProps) {
  const { locale, category } = await params;

  if (!VALID_CATEGORIES.includes(category as (typeof VALID_CATEGORIES)[number])) {
    notFound();
  }

  setRequestLocale(locale);

  const rawHtml = categoryPages[category];
  if (!rawHtml) {
    notFound();
  }

  const messages = (await getMessages({ locale })) as Messages;

  const tokenized = rawHtml.replace(TOKEN_PATTERN, (_match, key: string) => {
    const value = getMessageValue(messages, key);
    return value !== null ? value : `[${key}]`;
  });

  // Tum dahili href'leri aktif locale'in lokalize yoluyla rewrite et
  // (TR'de /urunler/cati-panelleri kalir, EN'de /products/cati-panelleri olur).
  const html = localizeHrefs(tokenized, locale as Locale);

  return (
    <div
      id="emay-legacy-category"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
