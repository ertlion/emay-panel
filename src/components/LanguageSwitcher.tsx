"use client";

// 4 dilli switcher:
// - Default: desktop'ta fixed dikey bar (LTR'de sol, RTL'de sag)
// - Mobile/tablet (<1024px): fixed bar gizli, Header drawer'inda inline render
// - `inline` prop ile drawer icinde yatay grid olarak render edilir

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { useTransition } from "react";

type LangOption = {
  code: Locale;
  label: string;
  flag: string;
};

const langs: LangOption[] = [
  { code: "tr", label: "TR", flag: "🇹🇷" },
  { code: "en", label: "EN", flag: "🇬🇧" },
  { code: "ru", label: "RU", flag: "🇷🇺" },
  { code: "ar", label: "AR", flag: "🇸🇦" },
];

type Props = {
  /**
   * Header mobile drawer'inda kullanilir:
   * fixed bar yerine yatay tile grid olarak basilir.
   */
  inline?: boolean;
};

export default function LanguageSwitcher({ inline = false }: Props) {
  const activeLocale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function switchTo(nextLocale: Locale): void {
    if (nextLocale === activeLocale) return;
    startTransition(() => {
      router.replace(
        pathname as unknown as Parameters<typeof router.replace>[0],
        { locale: nextLocale },
      );
    });
  }

  if (inline) {
    return (
      <div
        className={cn(
          "grid grid-cols-4 gap-2",
          isPending && "opacity-60 pointer-events-none",
        )}
        aria-label="Dil secimi"
      >
        {langs.map((lang) => {
          const isActive = lang.code === activeLocale;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => switchTo(lang.code)}
              className={cn(
                "flex items-center justify-center gap-2 py-3 text-sm font-semibold border transition",
                isActive
                  ? "bg-[color:var(--color-primary)] text-white border-[color:var(--color-primary)]"
                  : "bg-white text-neutral-700 border-[color:var(--color-emay-border)] hover:bg-[color:var(--color-emay-light)]",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="text-base leading-none">{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          );
        })}
        <span className="sr-only">{routing.locales.join(" ")}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "lang-bar fixed top-1/2 z-40 -translate-y-1/2 hidden lg:flex flex-col bg-white shadow-lg overflow-hidden border border-[color:var(--color-emay-border)]",
        isPending && "opacity-60 pointer-events-none",
      )}
      aria-label="Dil secimi"
    >
      {langs.map((lang) => {
        const isActive = lang.code === activeLocale;
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => switchTo(lang.code)}
            className={cn(
              "flex items-center gap-2 px-3 py-2.5 text-xs font-semibold transition-colors border-b border-[color:var(--color-emay-border)] last:border-b-0",
              isActive
                ? "bg-[color:var(--color-primary)] text-white"
                : "text-neutral-700 hover:bg-[color:var(--color-emay-light)]",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="text-base leading-none">{lang.flag}</span>
            <span>{lang.label}</span>
          </button>
        );
      })}
      <span className="sr-only">{routing.locales.join(" ")}</span>
    </div>
  );
}
