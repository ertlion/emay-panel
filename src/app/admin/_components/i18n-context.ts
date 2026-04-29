"use client";

// I18nForm + I18nField paylasilan React context.
// Iki dosyada `createContext` cagirsa farkli context'ler olur - paylasimi
// bu modulden gerceklestirip, ayni instance'i kullanirlar.

import { createContext } from "react";
import type { LocaleCode } from "../_lib/i18n-form";

export type I18nCtxValue = {
  active: LocaleCode;
  setActive: (l: LocaleCode) => void;
};

export const I18nCtx = createContext<I18nCtxValue | null>(null);
