export type Lang = "es" | "en";

const DICTIONARY: Record<Lang, Record<string, string>> = {
  es: {
    appName: "Factor.es",
    tagline: "Directorio unificado de indicadores oficiales de España. Cifras abreviadas, trazabilidad directa y cero ruido político.",
    backToExplorer: "Volver al explorador",
    loadingDirectory: "Cargando directorio unificado...",
    loadingData: "Cargando dato vía HTTP...",
    noResults: "No se encontraron indicadores que coincidan con",
    clearSearch: "Limpiar búsqueda",
    searchPlaceholder: "Buscar indicador, categoría o término (ej. paro, alquiler)...",
    sourceTitle: "Fuente Oficial de Datos y Trazabilidad",
    lastUpdated: "Última actualización",
    period: "Período",
    institution: "Institución",
    officialTable: "Tabla oficial",
    viewOriginalSource: "Ver fuente original",
    noDataYet: "No hay datos registrados aún",
    people: "personas",
    totalGlobal: "Total Global",
    continentsTitle: "Continentes (Anillo 1):",
    showAllContinents: "Mostrar todos los continentes",
    concentricTitle: "Distribución Concéntrica (Anillo 1: Continentes → Anillo 2: Países)",
    rankingTitle: "Ranking de Países de Origen por Volumen e Intensidad Geográfica",
    hoverHint: "Pasa el cursor sobre los anillos concéntricos o haz clic en un continente para filtrar.",
    indicatorsCount: "indicadores",
    indicatorCount: "indicador",
  },
  en: {
    appName: "Factor.es",
    tagline: "Unified directory of official Spanish indicators. Condensed figures, direct traceability, and zero political noise.",
    backToExplorer: "Back to explorer",
    loadingDirectory: "Loading unified directory...",
    loadingData: "Loading data via HTTP...",
    noResults: "No indicators found matching",
    clearSearch: "Clear search",
    searchPlaceholder: "Search indicator, category or term (e.g., unemployment, rent)...",
    sourceTitle: "Official Data Source & Traceability",
    lastUpdated: "Last updated",
    period: "Period",
    institution: "Institution",
    officialTable: "Official table",
    viewOriginalSource: "View original source",
    noDataYet: "No data registered yet",
    people: "people",
    totalGlobal: "Total Global",
    continentsTitle: "Continents (Ring 1):",
    showAllContinents: "Show all continents",
    concentricTitle: "Concentric Distribution (Ring 1: Continents → Ring 2: Countries)",
    rankingTitle: "Origin Country Ranking by Volume & Geographic Intensity",
    hoverHint: "Hover over concentric rings or click a continent to filter.",
    indicatorsCount: "indicators",
    indicatorCount: "indicator",
  },
};

const CATEGORY_TRANSLATIONS: Record<string, Record<Lang, string>> = {
  "Pensiones y Demografía": {
    es: "Pensiones y Demografía",
    en: "Pensions & Demographics",
  },
  "Economía y Empleo": {
    es: "Economía y Empleo",
    en: "Economy & Employment",
  },
  Vivienda: {
    es: "Vivienda",
    en: "Housing",
  },
  Sanidad: {
    es: "Sanidad",
    en: "Healthcare",
  },
  Todas: {
    es: "Todas",
    en: "All",
  },
};

export function t(key: string, lang: Lang = "es"): string {
  return DICTIONARY[lang]?.[key] || DICTIONARY.es[key] || key;
}

export function translateCategory(category: string, lang: Lang = "es"): string {
  return CATEGORY_TRANSLATIONS[category]?.[lang] || category;
}

export function formatNumber(val: number, lang: Lang = "es"): string {
  if (lang === "en") {
    return val.toLocaleString("en-US");
  }
  return val.toLocaleString("es-ES");
}

export function formatCompactNumber(val: number, lang: Lang = "en"): string {
  if (lang === "en") {
    if (val >= 1e9) return (val / 1e9).toFixed(1) + "B";
    if (val >= 1e6) return (val / 1e6).toFixed(1) + "M";
    if (val >= 1e3) return (val / 1e3).toFixed(1) + "K";
    return val.toLocaleString("en-US");
  } else {
    if (val >= 1e9) return (val / 1e9).toFixed(1).replace(".", ",") + " MM";
    if (val >= 1e6) return (val / 1e6).toFixed(1).replace(".", ",") + " M";
    if (val >= 1e3) return Math.round(val / 1e3).toLocaleString("es-ES") + " mil";
    return val.toLocaleString("es-ES");
  }
}
