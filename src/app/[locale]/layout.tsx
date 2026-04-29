// [locale] layout = uygulamanin gercek kok layout'u.
// Legacy emaypanel.com portu: orijinal CSS ve JS'i <link> / next/script ile
// yukluyoruz. Header/Footer orijinal HTML icinde (page.tsx icinde
// dangerouslySetInnerHTML), bu yuzden burada Header/Footer component'leri yok.

import "../globals.css";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { routing, type Locale } from "@/i18n/routing";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { LEGACY_HEAD_STYLES } from "@/lib/legacy-head-styles";
import { LEGACY_INLINE_SCRIPTS } from "@/lib/legacy-inline-scripts";

// Mirror'in body class'lerinden otomatik cikarildi.
// Statik sayfalarin WordPress page ID'leri (page-id-XXX, elementor-page-XXX).
const STATIC_SLUG_TO_PAGEID: Record<string, string> = {
  hakkimizda: "26469",
  iletisim: "26473",
  "is-basvurusu": "27281",
  "kalite-belgelerimiz": "27249",
  kvkk: "27276",
  politikalarimiz: "27031",
  satis: "26468",
};

// Kategori taxonomy term ID'leri (mirror body class'tan otomatik cikarildi).
const CATEGORY_SLUG_TO_TERMID: Record<string, string> = {
  "cati-panelleri": "37",
  "cephe-panelleri": "43",
  "ges-uygulama-cozumleri": "41",
  "kombin-paneller": "45",
  "soguk-oda-panelleri": "47",
  "tamamlayici-urunler": "50",
  "trapezler": "49",
};

// Mirror'in <body class="postid-XXXXX..."> attribute'undan cikarildi.
// Elementor bazi CSS seleckorleri sayfa-specific post-ID'ye bagliyor.
const PRODUCT_SLUG_TO_POSTID: Record<string, string> = {
  "emay-smart-5s-gv": "27176",
  "emay-smart-3h-dv": "27177",
  "emay-smart-5h-dv": "27178",
  "emay-smart-5h-dv-ctp": "27180",
  "emay-smart-5h-dvt": "27181",
  "emay-smart-membranli-5h-dvt-pvc-tpo": "27182",
  "emay-smart-gv": "27183",
  "emay-smart-7f": "27184",
  "emay-smart-8s": "27185",
  "emay-smart-dv": "27187",
  "emay-smart-gvt": "27188",
  "emay-smart-dvt": "27189",
  "emay-smart-akustik-gvt": "27190",
  "emay-smart-cs-crw-soguk-oda-paneli": "27191",
  "c-profil": "27195",
  "emay-smart-5h-dv-pvc-tpo": "27196",
  "emay-smart-akustik-5h-dvt": "27197",
  "emay-smart-gv-standart-emay-smart-7f": "27198",
  "emay-smart-gv-micro-emay-smart-7f": "27199",
  "emay-smart-gv-micro-emay-smart-gv-standart": "27200",
  "emay-smart-8s-emay-smart-gv-standart": "27201",
  "trapez-saclar": "27206",
};

// jQuery body sonu LEGACY_INLINE_SCRIPTS'in en basina dahil edildi.
// Head'de inline scripts head config'leri kuruyor (jQuery'e baglilik yok).

// Legacy CSS dosyalari - public/legacy/css/ altinda.
// Sira emaypanel.com mirror'indaki <head> yukleme sirasi ile birebir.
// post-26435 = Elementor header template, post-26433 = footer, post-5 = kit,
// post-26811 = homepage, post-26595 = megamenu, post-26469 = ek icerik.
const LEGACY_CSS: string[] = [
  "/legacy/css/frontend.min.css",
  "/legacy/css/post-26435.css",
  "/legacy/css/post-26433.css",
  "/legacy/css/wp-block-library.css",
  "/legacy/css/styles.css",
  "/legacy/css/elementor-icons.min.css",
  "/legacy/css/post-5.css",
  "/legacy/css/parallax-style.css",
  "/legacy/css/swiper.min.css",
  "/legacy/css/e-swiper.min.css",
  "/legacy/css/widget-image-carousel.min.css",
  "/legacy/css/widget-heading.min.css",
  "/legacy/css/fadeIn.min.css",
  "/legacy/css/e-animation-pulse.min.css",
  "/legacy/css/fadeInUp.min.css",
  "/legacy/css/e-animation-float.min.css",
  "/legacy/css/widget-image.min.css",
  "/legacy/css/widget-divider.min.css",
  "/legacy/css/odometer-theme-default.css",
  "/legacy/css/post-26811.css",
  "/legacy/css/woocommerce-layout.css",
  "/legacy/css/woocommerce-smallscreen.css",
  "/legacy/css/woocommerce.css",
  "/legacy/css/variables.css",
  "/legacy/css/global.css",
  "/legacy/css/theme.css",
  "/legacy/css/site-logo.css",
  "/legacy/css/widget-styles.css",
  "/legacy/css/widget-styles-pro.css",
  "/legacy/css/responsive.css",
  "/legacy/css/keydesign-elementskit.css",
  "/legacy/css/keydesign-framework.css",
  "/legacy/css/keydesign-woocommerce.css",
  "/legacy/css/ekiticons.css",
  "/legacy/css/fontawesome.min.css",
  "/legacy/css/solid.min.css",
  "/legacy/css/brands.min.css",
  "/legacy/css/post-26595.css",
  "/legacy/css/widget-icon-list.min.css",
  "/legacy/css/widget-google_maps.min.css",
  "/legacy/css/post-26469.css",
  // Statik sayfalara ozel Elementor template CSS'leri (politikalarimiz, kvkk, vb.)
  // Her sayfada eksik kalmasin diye TUMU yuklendi (~30KB ekstra).
  "/legacy/css/post-26468.css", // satis (contact-sales)
  "/legacy/css/post-26473.css", // iletisim
  "/legacy/css/post-27031.css", // politikalarimiz
  "/legacy/css/post-27249.css", // kalite-belgelerimiz
  "/legacy/css/post-27276.css", // kvkk
  "/legacy/css/post-27281.css", // is-basvurusu
];

// Tum locale'ler icin statik render mumkun olsun
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata = {
  title:
    "Emay Panel – Sandviç Panel Üretici ve Satıcısı | Çatı & Cephe Sistemleri",
  description:
    "Sanayi yapıları, depolar ve üretim tesisleri için çatı ve cephe sandviç panel çözümleri.",
  icons: {
    icon: "/uploads/2025/06/cropped-favico1-32x32-1.png",
  },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Desteklenmeyen bir locale gelirse 404
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // next-intl'e hangi locale oldugunu server render sirasinda bildir
  setRequestLocale(locale as Locale);

  const isRtl = locale === "ar";

  // Body class list - sayfa turune gore dinamik. Pathname'i headers'tan al.
  // Orijinal WordPress/Karbon tema CSS selektorleri body class'ina bagli:
  //   - homepage: home page-template-default page page-id-26811 elementor-page-26811
  //   - kategori: archive tax-product_cat woocommerce woocommerce-page
  //   - urun: single single-product product-template-default woocommerce woocommerce-page
  // Buradan kaynak Element'or/WooCommerce CSS rule'larini etkin kil.
  const { headers } = await import("next/headers");
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || headersList.get("x-invoke-path") || "";

  const segs = pathname.split("/").filter(Boolean); // ["tr", "urunler", "cati-panelleri", "emay-smart-3h-dv"]
  const isHomepage = segs.length <= 1; // /tr ya da boş
  const isProduct = segs.length >= 4 && (segs[1] === "urunler" || segs[1] === "products" || segs[1] === "produktsiya" || segs[1] === "المنتجات");
  const isCategory = !isProduct && segs.length === 3 && (segs[1] === "urunler" || segs[1] === "products" || segs[1] === "produktsiya" || segs[1] === "المنتجات");

  // Mirror'in body class sirasi:
  //   {wp-singular | archive ...} {pageType} wp-custom-logo wp-embed-responsive wp-theme-karbon theme-karbon
  //   {wooClasses}? overlay-link-effect flip-button-effect keydesign-elementor-library
  //   {moreWooClasses}? elementor-default elementor-kit-5 {elementorPageClass}?
  // Mirror'a sira/spacing dahil birebir uyumlu olmali ki Elementor selectorleri match etsin.
  // Kategori sayfalari "wp-singular" YERINE "archive..." kullanir.
  const baseMid =
    "wp-custom-logo wp-embed-responsive wp-theme-karbon theme-karbon  overlay-link-effect flip-button-effect keydesign-elementor-library";
  const baseEnd = "elementor-default elementor-kit-5";

  let baseStart = "wp-singular";
  let pageSpecificStart = ""; // wp-singular'dan hemen sonra
  let pageSpecificEnd = ""; // baseEnd'den sonra
  let wooClassesAfter = ""; // theme-karbon'dan sonra
  let wooClassesEnd = ""; // keydesign'dan sonra

  if (isProduct) {
    const productSlug = segs[3] || "";
    const postId = PRODUCT_SLUG_TO_POSTID[productSlug];
    pageSpecificStart = `product-template-default single single-product${postId ? ` postid-${postId}` : ""}`;
    wooClassesEnd = "woocommerce woocommerce-page woocommerce-no-js";
  } else if (isCategory) {
    // Kategori archive: "wp-singular" YOK, "archive ... term-XX" var.
    const catSlug = segs[2] || "";
    const termId = CATEGORY_SLUG_TO_TERMID[catSlug];
    baseStart = `archive tax-product_cat${termId ? ` term-${termId}` : ""} term-${catSlug}`;
    pageSpecificStart = "";
    wooClassesEnd = "woocommerce woocommerce-page woocommerce-no-js";
  } else if (isHomepage) {
    pageSpecificStart = "home page-template-default page page-id-26811";
    pageSpecificEnd = "elementor-page elementor-page-26811";
    wooClassesEnd = "woocommerce-no-js";
  } else {
    // Statik sayfa: hakkimizda, iletisim, vb.
    const pageSlug = segs[1] || "";
    const pageId = STATIC_SLUG_TO_PAGEID[pageSlug];
    pageSpecificStart = `page-template-default page${pageId ? ` page-id-${pageId}` : ""}`;
    pageSpecificEnd = `elementor-page${pageId ? ` elementor-page-${pageId}` : ""}`;
    wooClassesEnd = "woocommerce-no-js";
  }

  const bodyClass = [
    baseStart,
    pageSpecificStart,
    baseMid,
    wooClassesAfter,
    wooClassesEnd,
    baseEnd,
    pageSpecificEnd,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <html
      lang={locale}
      dir={isRtl ? "rtl" : "ltr"}
      suppressHydrationWarning
    >
      <head>
        {LEGACY_CSS.map((href) => {
          // woocommerce-smallscreen.css mirror'da media="only screen and (max-width: 768px)"
          // ile yuklenir - mobile-only. Media olmadan yuklersek desktop'i bozuyor (.summary
          // float'u override ediyor) → 2-sutun urun layout'u tek-sutuna duser.
          const isMobileOnly = href.endsWith("/woocommerce-smallscreen.css");
          return (
            // eslint-disable-next-line @next/next/no-css-tags
            <link
              key={href}
              rel="stylesheet"
              href={href}
              media={isMobileOnly ? "only screen and (max-width: 768px)" : undefined}
            />
          );
        })}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css?family=Figtree:100,100italic,200,200italic,300,300italic,400,400italic,500,500italic,600,600italic,700,700italic,800,800italic,900,900italic&display=swap&subset=latin-ext"
        />
        {/* Mirror'in <head>'inde inline duran 10 <style> blogu - Elementor lazy-load
         * reveal kurali (.e-con.e-parent:nth-of-type(n+4)...) ve WooCommerce galeri
         * opacity:0 override'i burada. Bu CSS olmadan urun/kategori sayfalari bos gorunur. */}
        <style dangerouslySetInnerHTML={{ __html: LEGACY_HEAD_STYLES }} />
      </head>
      <body className={bodyClass} suppressHydrationWarning>
        <NextIntlClientProvider>
          {/* Dil degistirici - fixed, tum sayfalarda gorunur (desktop) */}
          <LanguageSwitcher />
          {children}
        </NextIntlClientProvider>

        {/* Legacy body-end script pipeline - mirror'in birebir sirasiyla.
         * Inline init scripts ve src'li dosyalar interleaved sekilde sirayla
         * execute olur (mirror'a sadik). DEFER YOK; cunku inline scripts'in
         * src'lerden once veya sonra calismasi sira ile belirleniyor. */}
        <div
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: LEGACY_INLINE_SCRIPTS }}
        />
      </body>
    </html>
  );
}
