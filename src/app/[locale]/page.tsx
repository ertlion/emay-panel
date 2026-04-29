// Homepage - emaypanel.com/index.html'den DOM-birebir port edildi.
// Kaynak: scripts/build-homepage-html.mjs tarafindan uretilen
// _homepage-static.ts. Orijinal Elementor/KeyDesign HTML'ini oldugu
// gibi (header + main + footer + back-to-top) rendere ediyoruz.
//
// Asama 2: HTML icindeki __T_<namespace.key>__ token'lari runtime'da
// messages JSON'dan direkt olarak cevrilir. next-intl t() HTML iceren
// value'lari ICU parse etmeye calistigi icin dogrudan JSON erisimi
// kullaniyoruz.

import { getMessages, setRequestLocale } from "next-intl/server";
import { homepageHtml } from "./_homepage-static";
import { localizeHrefs } from "@/lib/localize-href";
import type { Locale } from "@/i18n/routing";

const TOKEN_PATTERN = /__T_([a-zA-Z0-9_.]+)__/g;

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

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const messages = (await getMessages({ locale })) as Messages;

  const tokenized = homepageHtml.replace(TOKEN_PATTERN, (_match, key: string) => {
    const value = getMessageValue(messages, key);
    return value !== null ? value : `[${key}]`;
  });

  const html = localizeHrefs(tokenized, locale as Locale);

  return (
    <div
      id="emay-legacy-homepage"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
