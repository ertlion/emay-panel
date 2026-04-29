// Uygulamanin tum routing davranisi burada tanimli.
// Dil prefix'leri, fiziksel path -> dile-ozel path eslemeleri.

import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["tr", "en", "ru", "ar"] as const,
  defaultLocale: "tr",
  // Her URL'de dil prefix'i goster: /tr, /en, /ru, /ar
  localePrefix: "always",
  // Fiziksel klasor adi (TR) -> her dil icin gosterilen path
  pathnames: {
    "/": "/",

    "/hakkimizda": {
      tr: "/hakkimizda",
      en: "/about",
      ru: "/o-nas",
      ar: "/من-نحن",
    },
    "/iletisim": {
      tr: "/iletisim",
      en: "/contact",
      ru: "/kontakty",
      ar: "/اتصل-بنا",
    },
    "/urunler": {
      tr: "/urunler",
      en: "/products",
      ru: "/produktsiya",
      ar: "/المنتجات",
    },
    "/urunler/[category]": {
      tr: "/urunler/[category]",
      en: "/products/[category]",
      ru: "/produktsiya/[category]",
      ar: "/المنتجات/[category]",
    },
    "/urunler/[category]/[product]": {
      tr: "/urunler/[category]/[product]",
      en: "/products/[category]/[product]",
      ru: "/produktsiya/[category]/[product]",
      ar: "/المنتجات/[category]/[product]",
    },
    "/is-basvurusu": {
      tr: "/is-basvurusu",
      en: "/careers",
      ru: "/kariera",
      ar: "/وظائف",
    },
    "/kalite-belgelerimiz": {
      tr: "/kalite-belgelerimiz",
      en: "/quality-certificates",
      ru: "/sertifikaty-kachestva",
      ar: "/شهادات-الجودة",
    },
    "/politikalarimiz": {
      tr: "/politikalarimiz",
      en: "/policies",
      ru: "/politika",
      ar: "/السياسات",
    },
    "/kvkk": {
      tr: "/kvkk",
      en: "/privacy",
      ru: "/konfidentsialnost",
      ar: "/الخصوصية",
    },
    "/satis": {
      tr: "/satis",
      en: "/contact-sales",
      ru: "/prodazhi",
      ar: "/المبيعات",
    },
  },
});

export type Locale = (typeof routing.locales)[number];
