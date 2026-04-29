// 4 dilde input/textarea field'i. Sade, server-side render edilir.
// 4 box yan yana (lg) veya stack (mobile).
import type { ReactNode } from "react";

const LOCALES = [
  { code: "tr", label: "TR", dir: "ltr" },
  { code: "en", label: "EN", dir: "ltr" },
  { code: "ru", label: "RU", dir: "ltr" },
  { code: "ar", label: "AR", dir: "rtl" },
] as const;

type Props = {
  name: string; // "title" -> input names: title.tr, title.en, title.ru, title.ar
  label: string;
  values?: Record<string, string> | null;
  type?: "input" | "textarea" | "richtext";
  rows?: number;
  required?: boolean;
  hint?: string;
  rtlForArabic?: boolean;
  children?: ReactNode;
};

export function I18nField({
  name,
  label,
  values,
  type = "input",
  rows = 3,
  required = false,
  hint,
}: Props) {
  const v = values ?? {};

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <label className="text-sm font-medium text-neutral-900">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
        <span className="text-[10px] text-neutral-500">4 dil</span>
      </div>
      {hint && <p className="mb-3 text-xs text-neutral-600">{hint}</p>}

      <div className="grid gap-3 lg:grid-cols-2">
        {LOCALES.map((loc) => {
          const fieldName = `${name}.${loc.code}`;
          const baseClass =
            "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";
          return (
            <div key={loc.code}>
              <label
                htmlFor={fieldName}
                className="mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-neutral-600"
              >
                <span className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono">
                  {loc.label}
                </span>
              </label>
              {type === "input" ? (
                <input
                  id={fieldName}
                  name={fieldName}
                  type="text"
                  defaultValue={v[loc.code] ?? ""}
                  dir={loc.dir}
                  required={required && loc.code === "tr"}
                  className={baseClass}
                />
              ) : (
                <textarea
                  id={fieldName}
                  name={fieldName}
                  defaultValue={v[loc.code] ?? ""}
                  dir={loc.dir}
                  rows={rows}
                  required={required && loc.code === "tr"}
                  className={`${baseClass} font-mono text-xs`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
