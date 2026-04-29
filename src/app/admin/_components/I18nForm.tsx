"use client";

// Form-level dil secici. Tum I18nField'lari sarmalar.
// Aktif dile gore sadece o dilin input'lari gorunur (digerleri display:none
// ama DOM'da, form submit'inde 4 dil de gonderilir).

import { useContext, useState, type ReactNode } from "react";
import { LOCALES, type LocaleCode } from "../_lib/i18n-form";
import { I18nCtx } from "./i18n-context";

export function useI18nLocale(): LocaleCode {
  const ctx = useContext(I18nCtx);
  return ctx?.active ?? "tr";
}

type I18nFormProps = {
  children: ReactNode;
  defaultLocale?: LocaleCode;
  className?: string;
};

export function I18nForm({
  children,
  defaultLocale = "tr",
  className = "",
}: I18nFormProps) {
  const [active, setActive] = useState<LocaleCode>(defaultLocale);

  return (
    <I18nCtx.Provider value={{ active, setActive }}>
      <div className={className}>
        <LanguageTabs />
        {children}
      </div>
    </I18nCtx.Provider>
  );
}

function LanguageTabs() {
  const ctx = useContext(I18nCtx);
  if (!ctx) return null;

  return (
    <div className="sticky top-0 z-10 mb-4 flex items-center gap-2 rounded-lg border border-neutral-200 bg-white p-2 shadow-sm">
      <span className="px-2 text-xs font-medium text-neutral-500">Dil:</span>
      {LOCALES.map((loc) => {
        const isActive = ctx.active === loc.code;
        return (
          <button
            key={loc.code}
            type="button"
            onClick={() => ctx.setActive(loc.code)}
            className={
              "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition " +
              (isActive
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-neutral-50 text-neutral-700 hover:bg-neutral-100")
            }
          >
            <span aria-hidden>{loc.flag}</span>
            <span>{loc.short}</span>
            <span className="text-xs opacity-70">{loc.label}</span>
          </button>
        );
      })}
    </div>
  );
}
