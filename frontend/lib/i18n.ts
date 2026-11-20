import type { Category, Locale } from "./types";
import esCommon from "../data/locales/es/common.json";
import enCommon from "../data/locales/en/common.json";
export { formatNumber, formatCompactNumber } from "./format";

const DICTIONARY: Record<Locale, Record<string, string>> = {
  es: esCommon,
  en: enCommon,
};

export const routes = {
  home: (locale: Locale = "es"): string => (locale === "en" ? "/en" : "/es"),
  indicator: (locale: Locale = "es", slug: string): string =>
    locale === "en" ? `/en/dato/${slug}` : `/es/dato/${slug}`,
  toggleLocale: (pathname: string, targetLocale: Locale): string => {
    const clean = pathname.replace(/\/$/, "");
    if (targetLocale === "en") {
      if (!clean || clean === "" || clean === "/es") return "/en";
      if (clean === "/en") return "/en";
      if (clean.startsWith("/en/")) return clean;
      if (clean.startsWith("/es/")) return clean.replace(/^\/es/, "/en");
      return `/en${clean}`;
    } else {
      if (clean === "/en" || !clean || clean === "") return "/es";
      if (clean.startsWith("/en/")) {
        return clean.replace(/^\/en/, "/es");
      }
      if (clean.startsWith("/es")) return clean;
      return `/es${clean}`;
    }
  },
};

export const CATEGORY_LABELS: Record<Category | "all", Record<Locale, string>> = {
  all: {
    es: "Todas",
    en: "All",
  },
  "pensions-demography": {
    es: "Pensiones y Demografía",
    en: "Pensions & Demography",
  },
  "economy-employment": {
    es: "Economía y Empleo",
    en: "Economy & Employment",
  },
  housing: {
    es: "Vivienda",
    en: "Housing",
  },
  healthcare: {
    es: "Sanidad",
    en: "Healthcare",
  },
};

export const CATEGORY_ICONS: Record<Category | "all", string> = {
  all: "📊",
  housing: "🏠",
  "economy-employment": "📈",
  healthcare: "🏥",
  "pensions-demography": "👥",
};

export function t(key: string, locale: Locale = "es"): string {
  return DICTIONARY[locale]?.[key] ?? DICTIONARY.es[key] ?? key;
}

export function translateCategory(category: Category | "all", locale: Locale = "es"): string {
  return CATEGORY_LABELS[category]?.[locale] ?? category;
}
