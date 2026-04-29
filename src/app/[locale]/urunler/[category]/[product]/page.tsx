// Urun detay sayfasi - emaypanel.com/ürün/<slug>/index.html'den DOM-birebir port.
// Kaynak: scripts/build-product-html.mjs tarafindan uretilen _products-static.ts.
// 22 urun × 4 locale = 88 statik sayfa prerender.

import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

import { routing, type Locale } from "@/i18n/routing";
import { productPages } from "./_products-static";
import { localizeHrefs } from "@/lib/localize-href";

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
  // Tum locale × (category, product) kombinasyonlarini build-time'da render et.
  return routing.locales.flatMap((locale) =>
    Object.entries(productPages).map(([product, { category }]) => ({
      locale,
      category,
      product,
    })),
  );
}

type PageProps = {
  params: Promise<{ locale: string; category: string; product: string }>;
};

// Mirror'daki sub-category klasor isimleri - WooCommerce taxonomy filtresi.
// Bunlar 22 ana urun listesinde olmadigi icin dogrudan parent kategoriye yonlendir.
// Boylece eski/dis link'ler 404 atmaz, kullanici dogru kategoriye dusurulur.
const SUBCATEGORY_REDIRECTS: Record<string, string> = {
  "poliuretan-ve-poliizosiyanurat-dolgulu-paneller": "cati-panelleri",
  "tas-yunu-dolgulu-paneller": "cati-panelleri",
  "poliuretan-ve-poliizosiyanurat-dolgulu-paneller-cephe-panelleri":
    "cephe-panelleri",
  "tas-yunu-dolgulu-paneller-cephe-panelleri": "cephe-panelleri",
  "poliuretan-ve-poliizosiyanurat-dolgulu-paneller-soguk-oda-panelleri":
    "soguk-oda-panelleri",
  "tas-yunu-dolgulu-paneller-soguk-oda-panelleri": "soguk-oda-panelleri",
};

// Lokalize edilmis kategori URL prefix'i (routing.ts ile senkron tutulmali).
const PRODUCTS_PREFIX_BY_LOCALE: Record<string, string> = {
  tr: "urunler",
  en: "products",
  ru: "produktsiya",
  ar: "المنتجات",
};

export default async function ProductPage({ params }: PageProps) {
  const { locale, category, product } = await params;

  // Sub-category slug'i ise (urun degil), parent kategoriye yonlendir.
  // Hem mevcut category icindeki hem de cross-category sub-cat'leri yakalar.
  const redirectTarget = SUBCATEGORY_REDIRECTS[product];
  if (redirectTarget) {
    const prefix = PRODUCTS_PREFIX_BY_LOCALE[locale] ?? "urunler";
    // AR locale prefix'i ('المنتجات') HTTP Location header'da non-ASCII karakter
    // hatasi veriyor. encodeURI ile percent-encode et.
    redirect(encodeURI(`/${locale}/${prefix}/${redirectTarget}`));
  }

  const entry = productPages[product];
  if (!entry || entry.category !== category) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = (await getMessages({ locale })) as Messages;

  const tokenized = entry.html.replace(TOKEN_PATTERN, (_match, key: string) => {
    const value = getMessageValue(messages, key);
    return value !== null ? value : `[${key}]`;
  });

  const html = localizeHrefs(tokenized, locale as Locale);

  return (
    <div
      id="emay-legacy-product"
      // Mirror'in JS'leri body class'i ve bazi attributes'i runtime'da degistiriyor
      // (ornegin woocommerce-no-js -> woocommerce-js, e-lazyloaded ekleme).
      // Bu hydration mismatch'larini React'in hide etmesi icin gerekli.
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
