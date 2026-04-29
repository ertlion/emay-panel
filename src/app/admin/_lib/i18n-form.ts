// I18nField/I18nForm icin paylasilan locale tanimi + server-side helper.
// Client component'lerden bagimsiz oldugu icin server actions'ta safely import edilir.

export const LOCALES = [
  { code: "tr", label: "Türkçe", short: "TR", dir: "ltr", flag: "🇹🇷" },
  { code: "en", label: "English", short: "EN", dir: "ltr", flag: "🇬🇧" },
  { code: "ru", label: "Русский", short: "RU", dir: "ltr", flag: "🇷🇺" },
  { code: "ar", label: "العربية", short: "AR", dir: "rtl", flag: "🇸🇦" },
] as const;

export type LocaleCode = (typeof LOCALES)[number]["code"];

// Yardimci: FormData'dan i18n object cikar (`fieldName.tr`, `.en`, ...)
export function extractI18n(
  formData: FormData,
  name: string,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const loc of LOCALES) {
    out[loc.code] = String(formData.get(`${name}.${loc.code}`) ?? "");
  }
  return out;
}
