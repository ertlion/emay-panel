// next-intl'in server tarafli request config'i.
// DB'den translation_keys'i okur (admin'den editable), fallback JSON dosyasi.
// Cache: 'force-cache' + tag-based revalidation; admin save edince
// revalidatePath('/', 'layout') tum public sayfalari invalidate eder.

import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

type Messages = Record<string, unknown>;

// Tek bir DB-call ile tum translation_keys'i cek, sonra locale'e gore objeye cevir
const getMessagesFromDB = unstable_cache(
  async (locale: string): Promise<Messages | null> => {
    try {
      const rows = await prisma.translationKey.findMany({
        select: { key: true, values: true },
      });
      if (rows.length === 0) return null;

      const messages: Messages = {};
      for (const row of rows) {
        const values = row.values as Record<string, string>;
        const value = values?.[locale];
        if (value === undefined) continue;
        // Dotted key'i nested object'e cevir: "header.nav.products" -> {header:{nav:{products:...}}}
        const parts = row.key.split(".");
        let cur: Record<string, unknown> = messages;
        for (let i = 0; i < parts.length - 1; i++) {
          if (typeof cur[parts[i]] !== "object" || cur[parts[i]] === null) {
            cur[parts[i]] = {};
          }
          cur = cur[parts[i]] as Record<string, unknown>;
        }
        cur[parts[parts.length - 1]] = value;
      }
      return messages;
    } catch {
      // DB yoksa veya bos - sessizce null don, fallback'e dus
      return null;
    }
  },
  ["translations"],
  { tags: ["translations"], revalidate: 300 },
);

async function loadFallbackMessages(locale: string): Promise<Messages> {
  try {
    return (await import(`../../messages/${locale}.json`)).default;
  } catch (error) {
    console.error(`[i18n] ${locale}.json yuklenemedi:`, error);
    return (await import(`../../messages/${routing.defaultLocale}.json`)).default;
  }
}

// Iki kaynagi merge et: DB onceliklidir, eksik key'ler icin JSON fallback.
function mergeDeep(target: Messages, source: Messages): Messages {
  for (const [key, value] of Object.entries(source)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      target[key] &&
      typeof target[key] === "object"
    ) {
      mergeDeep(target[key] as Messages, value as Messages);
    } else if (target[key] === undefined) {
      target[key] = value;
    }
  }
  return target;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  // 1. DB'den oku (cached)
  const dbMessages = await getMessagesFromDB(locale);
  // 2. JSON fallback (her zaman yukle - DB'de eksik key'ler icin)
  const fileMessages = await loadFallbackMessages(locale);

  // DB > JSON: DB veri varsa onun key'leri kullanilir, eksikleri JSON'dan al
  const messages = dbMessages
    ? mergeDeep({ ...dbMessages }, fileMessages)
    : fileMessages;

  return { locale, messages };
});
