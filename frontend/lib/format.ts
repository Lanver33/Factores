import type { Locale, ValueFormat } from "./types";

const LOCALE_TAG: Record<Locale, string> = {
  es: "es-ES",
  en: "en-US",
};

/**
 * Formats a regular number with locale-accurate separators.
 */
export function formatNumber(
  val: number,
  locale: Locale = "es",
  options?: Intl.NumberFormatOptions
): string {
  if (!Number.isFinite(val)) return "0";
  return new Intl.NumberFormat(LOCALE_TAG[locale], options).format(val);
}

/**
 * Formats a compact number (K/M/B in English, mil/M/MM in Spanish).
 */
export function formatCompactNumber(val: number, locale: Locale = "es"): string {
  if (!Number.isFinite(val)) return "0";
  const abs = Math.abs(val);

  if (locale === "en") {
    if (abs >= 1e9) return `${(val / 1e9).toFixed(1)}B`;
    if (abs >= 1e6) return `${(val / 1e6).toFixed(1)}M`;
    if (abs >= 1e3) return `${(val / 1e3).toFixed(1)}K`;
    return val.toLocaleString("en-US");
  }

  // Spanish compact standards
  if (abs >= 1e9) return `${(val / 1e9).toFixed(1).replace(".", ",")} MM`;
  if (abs >= 1e6) return `${(val / 1e6).toFixed(1).replace(".", ",")} M`;
  if (abs >= 1e3) return `${Math.round(val / 1e3).toLocaleString("es-ES")} mil`;
  return val.toLocaleString("es-ES");
}

/**
 * Formats a percentage value.
 */
export function formatPercent(
  val: number,
  locale: Locale = "es",
  decimals = 1
): string {
  if (!Number.isFinite(val)) return "0%";
  const formatted = val.toLocaleString(LOCALE_TAG[locale], {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${formatted}%`;
}

/**
 * Formats currency values in EUR or MM€ (millions of EUR).
 */
export function formatCurrency(
  val: number,
  locale: Locale = "es",
  unit: "eur" | "mmeur" = "eur"
): string {
  if (!Number.isFinite(val)) return "0 €";
  const formatted = new Intl.NumberFormat(LOCALE_TAG[locale], {
    maximumFractionDigits: unit === "mmeur" ? 2 : 0,
    useGrouping: true,
  }).format(val);
  return `${formatted} ${unit === "mmeur" ? "MM€" : "€"}`;
}

/**
 * High-level formatter based on ValueFormat enum.
 */
export function formatIndicatorValue(
  val: number,
  format: ValueFormat,
  locale: Locale = "es",
  compact = false
): string {
  switch (format) {
    case "percent":
      return formatPercent(val, locale);
    case "currency-eur":
      return formatCurrency(val, locale, "eur");
    case "currency-mmeur":
      return formatCurrency(val, locale, "mmeur");
    case "number":
    default:
      return compact ? formatCompactNumber(val, locale) : formatNumber(val, locale);
  }
}
