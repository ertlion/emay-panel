"use client";

// 4 dil input/textarea field. I18nForm wrapper'i icindeki active dile gore
// sadece tek bir input gorunur, digerleri DOM'da ama display: none.
// Form submit'inde 4 dilin degerleri de FormData'da gonderilir.
//
// I18nForm DISINDA kullanilirsa (eski yerler) 4 dil yan yana fallback'e duser.

import { useContext } from "react";
import { LOCALES } from "../_lib/i18n-form";
import { I18nCtx } from "./i18n-context";

type Props = {
  name: string;
  label: string;
  values?: Record<string, string> | null;
  type?: "input" | "textarea" | "richtext";
  rows?: number;
  required?: boolean;
  hint?: string;
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
  // Aktif locale'i I18nForm'dan al; yoksa tum dilleri grid'de goster.
  const ctx = useContext(I18nCtx);
  const active = ctx?.active;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <label className="text-sm font-medium text-neutral-900">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
        <span className="text-[10px] text-neutral-500">
          {active ? "aktif dil" : "4 dil"}
        </span>
      </div>
      {hint && <p className="mb-3 text-xs text-neutral-600">{hint}</p>}

      <div className={active ? "" : "grid gap-3 lg:grid-cols-2"}>
        {LOCALES.map((loc) => {
          const fieldName = `${name}.${loc.code}`;
          const baseClass =
            "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";
          const isHiddenByTab = active && active !== loc.code;
          return (
            <div
              key={loc.code}
              style={isHiddenByTab ? { display: "none" } : undefined}
            >
              {/* I18nForm icindeyken label'i gizle (zaten tab'larda var) */}
              {!active && (
                <label
                  htmlFor={fieldName}
                  className="mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-neutral-600"
                >
                  <span className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono">
                    {loc.short}
                  </span>
                </label>
              )}
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

// Backwards compat: extractI18n eskiden buradan export ediliyordu.
// Server action import'larini kirmamak icin re-export.
export { extractI18n, LOCALES } from "../_lib/i18n-form";
