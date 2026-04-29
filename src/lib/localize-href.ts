// Build script'leri tum dahili linkleri TR ham yolunda uretir
// (/urunler/cati-panelleri, /hakkimizda, vb). Runtime'da bu helper o linkleri
// aktif locale'in lokalize yoluyla degistirir, basina /{locale} prefix'i ekler.
//
// Boylece:
//   - Tum locale'lerde 307 redirect zinciri elenir (perf)
//   - EN sayfasinda /hakkimizda'ya tiklayan kullanici /en/about'a gider,
//     yanlislikla /tr/hakkimizda'ya dusmez (correctness)
//
// Kullanim:
//   const html = rawHtml.replace(...tokens...);
//   const finalHtml = localizeHrefs(html, locale);

import { routing, type Locale } from "@/i18n/routing";

type PathnamesMap = typeof routing.pathnames;

// TR ham yolundan ([category], [product] params haric) lokalize yola haritala.
// routing.pathnames'in keys'leri TR yollardir (canonical).
function localizePath(
  trPath: string,
  locale: Locale,
  pathnames: PathnamesMap,
): string | null {
  // Tam (param-siz) eslesme dene
  for (const [canonical, mapped] of Object.entries(pathnames)) {
    if (canonical === trPath) {
      if (typeof mapped === "string") return mapped;
      return mapped[locale] ?? canonical;
    }
  }

  // Param'li yollar: /urunler/[category] ve /urunler/[category]/[product]
  // Once en spesifik (3 segment) deneyelim.
  const segments = trPath.split("/").filter(Boolean);
  if (segments.length === 3 && segments[0] === "urunler") {
    const tmpl = "/urunler/[category]/[product]";
    const mapped = pathnames[tmpl as keyof PathnamesMap];
    if (mapped) {
      const target =
        typeof mapped === "string" ? mapped : (mapped[locale] ?? tmpl);
      return target
        .replace("[category]", segments[1])
        .replace("[product]", segments[2]);
    }
  }
  if (segments.length === 2 && segments[0] === "urunler") {
    const tmpl = "/urunler/[category]";
    const mapped = pathnames[tmpl as keyof PathnamesMap];
    if (mapped) {
      const target =
        typeof mapped === "string" ? mapped : (mapped[locale] ?? tmpl);
      return target.replace("[category]", segments[1]);
    }
  }

  return null;
}

// HTML icerigindeki href="..." attribute'lerini lokalize et.
// Sadece "/" ile baslayan dahili linkler; absolute URL ve hash-only atlanir.
export function localizeHrefs(html: string, locale: Locale): string {
  const pathnames = routing.pathnames as PathnamesMap;

  return html.replace(
    /(\shref=)(["'])([^"']+)(\2)/g,
    (full, prefix: string, q: string, rawHref: string, _q2: string) => {
      // Disardan/hash/mailto/tel/javascript - dokunma
      if (
        rawHref.startsWith("http://") ||
        rawHref.startsWith("https://") ||
        rawHref.startsWith("//") ||
        rawHref.startsWith("#") ||
        rawHref.startsWith("mailto:") ||
        rawHref.startsWith("tel:") ||
        rawHref.startsWith("javascript:")
      ) {
        return full;
      }

      // Path + opsiyonel hash/query'i ayir
      const hashIdx = rawHref.search(/[#?]/);
      const path = hashIdx === -1 ? rawHref : rawHref.slice(0, hashIdx);
      const suffix = hashIdx === -1 ? "" : rawHref.slice(hashIdx);

      // "/" ile baslamayan veya zaten bir locale prefix'i olan path: dokunma
      if (!path.startsWith("/")) return full;
      if (
        routing.locales.some(
          (loc) => path === `/${loc}` || path.startsWith(`/${loc}/`),
        )
      ) {
        return full;
      }

      // Asset path'leri (upload, legacy CSS/JS, next chunk, favicon, vb.) - dokunma
      // Bunlara locale prefix eklemek 404 yaratir.
      if (
        path.startsWith("/uploads/") ||
        path.startsWith("/legacy/") ||
        path.startsWith("/_next/") ||
        path.startsWith("/api/") ||
        path === "/favicon.ico" ||
        path.startsWith("/favicon.")
      ) {
        return full;
      }

      // Anasayfa
      if (path === "/") {
        return `${prefix}${q}/${locale}${suffix}${q}`;
      }

      // Lokalize karsiliginda ara
      const localized = localizePath(path, locale, pathnames);
      const finalPath = localized ?? path;
      return `${prefix}${q}/${locale}${finalPath}${suffix}${q}`;
    },
  );
}
