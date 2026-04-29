// Statik sayfalari (hakkimizda, iletisim, is-basvurusu, kalite-belgelerimiz,
// kvkk, politikalarimiz, satis) ortak bir mantikla render eder.
//
// Her bir page.tsx sadece:
//   export default async function HakkimizdaPage({ params }) {
//     return renderStaticPage('hakkimizda', params);
//   }
// yazarak DOM-birebir port'a sahip olur.

import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { staticPages } from "@/app/[locale]/_static-pages";
import { localizeHrefs } from "@/lib/localize-href";
import type { Locale } from "@/i18n/routing";

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

export async function renderStaticPage(
  slug: string,
  params: Promise<{ locale: string }>,
) {
  const { locale } = await params;
  setRequestLocale(locale);

  const rawHtml = staticPages[slug];
  if (!rawHtml) {
    notFound();
  }

  const messages = (await getMessages({ locale })) as Messages;

  const tokenized = rawHtml.replace(TOKEN_PATTERN, (_match, key: string) => {
    const value = getMessageValue(messages, key);
    return value !== null ? value : `[${key}]`;
  });

  const html = localizeHrefs(tokenized, locale as Locale);

  return (
    <div
      id={`emay-legacy-${slug}`}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
