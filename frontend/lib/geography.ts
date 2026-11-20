import type { Locale } from "./types";

export type RegionId =
  | "america-hispanohablante"
  | "america-no-hispanohablante"
  | "europa"
  | "africa"
  | "asia"
  | "oceania";

export interface RegionMeta {
  id: RegionId;
  name: Record<Locale, string>;
  color: string;
}

export const REGIONS: Record<RegionId, RegionMeta> = {
  "america-hispanohablante": {
    id: "america-hispanohablante",
    name: {
      es: "América (Hispanohablante)",
      en: "Americas (Spanish-speaking)",
    },
    color: "#2563EB",
  },
  "america-no-hispanohablante": {
    id: "america-no-hispanohablante",
    name: {
      es: "América (No Hispanohablante)",
      en: "Americas (Other)",
    },
    color: "#7C3AED",
  },
  europa: {
    id: "europa",
    name: {
      es: "Europa",
      en: "Europe",
    },
    color: "#0891B2",
  },
  africa: {
    id: "africa",
    name: {
      es: "África",
      en: "Africa",
    },
    color: "#059669",
  },
  asia: {
    id: "asia",
    name: {
      es: "Asia",
      en: "Asia",
    },
    color: "#D97706",
  },
  oceania: {
    id: "oceania",
    name: {
      es: "Oceanía",
      en: "Oceania",
    },
    color: "#64748B",
  },
};

export interface CountryMeta {
  iso2: string;
  name: Record<Locale, string>;
  region: RegionId;
}

export const COUNTRIES: Record<string, CountryMeta> = {
  CO: { iso2: "CO", name: { es: "Colombia", en: "Colombia" }, region: "america-hispanohablante" },
  VE: { iso2: "VE", name: { es: "Venezuela", en: "Venezuela" }, region: "america-hispanohablante" },
  PE: { iso2: "PE", name: { es: "Perú", en: "Peru" }, region: "america-hispanohablante" },
  AR: { iso2: "AR", name: { es: "Argentina", en: "Argentina" }, region: "america-hispanohablante" },
  HN: { iso2: "HN", name: { es: "Honduras", en: "Honduras" }, region: "america-hispanohablante" },
  EC: { iso2: "EC", name: { es: "Ecuador", en: "Ecuador" }, region: "america-hispanohablante" },
  CU: { iso2: "CU", name: { es: "Cuba", en: "Cuba" }, region: "america-hispanohablante" },
  PY: { iso2: "PY", name: { es: "Paraguay", en: "Paraguay" }, region: "america-hispanohablante" },
  DO: { iso2: "DO", name: { es: "República Dominicana", en: "Dominican Republic" }, region: "america-hispanohablante" },
  BO: { iso2: "BO", name: { es: "Bolivia", en: "Bolivia" }, region: "america-hispanohablante" },
  CL: { iso2: "CL", name: { es: "Chile", en: "Chile" }, region: "america-hispanohablante" },
  MX: { iso2: "MX", name: { es: "México", en: "Mexico" }, region: "america-hispanohablante" },
  NI: { iso2: "NI", name: { es: "Nicaragua", en: "Nicaragua" }, region: "america-hispanohablante" },
  UY: { iso2: "UY", name: { es: "Uruguay", en: "Uruguay" }, region: "america-hispanohablante" },
  BR: { iso2: "BR", name: { es: "Brasil", en: "Brazil" }, region: "america-no-hispanohablante" },
  US: { iso2: "US", name: { es: "Estados Unidos", en: "United States" }, region: "america-no-hispanohablante" },
  CA: { iso2: "CA", name: { es: "Canadá", en: "Canada" }, region: "america-no-hispanohablante" },
  DE: { iso2: "DE", name: { es: "Alemania", en: "Germany" }, region: "europa" },
  RO: { iso2: "RO", name: { es: "Rumanía", en: "Romania" }, region: "europa" },
  GB: { iso2: "GB", name: { es: "Reino Unido", en: "United Kingdom" }, region: "europa" },
  IT: { iso2: "IT", name: { es: "Italia", en: "Italy" }, region: "europa" },
  UA: { iso2: "UA", name: { es: "Ucrania", en: "Ukraine" }, region: "europa" },
  FR: { iso2: "FR", name: { es: "Francia", en: "France" }, region: "europa" },
  RU: { iso2: "RU", name: { es: "Rusia", en: "Russia" }, region: "europa" },
  PT: { iso2: "PT", name: { es: "Portugal", en: "Portugal" }, region: "europa" },
  BG: { iso2: "BG", name: { es: "Bulgaria", en: "Bulgaria" }, region: "europa" },
  BE: { iso2: "BE", name: { es: "Bélgica", en: "Belgium" }, region: "europa" },
  DK: { iso2: "DK", name: { es: "Dinamarca", en: "Denmark" }, region: "europa" },
  FI: { iso2: "FI", name: { es: "Finlandia", en: "Finland" }, region: "europa" },
  IE: { iso2: "IE", name: { es: "Irlanda", en: "Ireland" }, region: "europa" },
  LT: { iso2: "LT", name: { es: "Lituania", en: "Lithuania" }, region: "europa" },
  MD: { iso2: "MD", name: { es: "Moldavia", en: "Moldova" }, region: "europa" },
  NO: { iso2: "NO", name: { es: "Noruega", en: "Norway" }, region: "europa" },
  NL: { iso2: "NL", name: { es: "Países Bajos", en: "Netherlands" }, region: "europa" },
  PL: { iso2: "PL", name: { es: "Polonia", en: "Poland" }, region: "europa" },
  SE: { iso2: "SE", name: { es: "Suecia", en: "Sweden" }, region: "europa" },
  CH: { iso2: "CH", name: { es: "Suiza", en: "Switzerland" }, region: "europa" },
  MA: { iso2: "MA", name: { es: "Marruecos", en: "Morocco" }, region: "africa" },
  DZ: { iso2: "DZ", name: { es: "Argelia", en: "Algeria" }, region: "africa" },
  SN: { iso2: "SN", name: { es: "Senegal", en: "Senegal" }, region: "africa" },
  ML: { iso2: "ML", name: { es: "Mali", en: "Mali" }, region: "africa" },
  NG: { iso2: "NG", name: { es: "Nigeria", en: "Nigeria" }, region: "africa" },
  GM: { iso2: "GM", name: { es: "Gambia", en: "Gambia" }, region: "africa" },
  GQ: { iso2: "GQ", name: { es: "Guinea Ecuatorial", en: "Equatorial Guinea" }, region: "africa" },
  GH: { iso2: "GH", name: { es: "Ghana", en: "Ghana" }, region: "africa" },
  GN: { iso2: "GN", name: { es: "Guinea", en: "Guinea" }, region: "africa" },
  MR: { iso2: "MR", name: { es: "Mauritania", en: "Mauritania" }, region: "africa" },
  CN: { iso2: "CN", name: { es: "China", en: "China" }, region: "asia" },
  PK: { iso2: "PK", name: { es: "Pakistán", en: "Pakistan" }, region: "asia" },
  IN: { iso2: "IN", name: { es: "India", en: "India" }, region: "asia" },
  PH: { iso2: "PH", name: { es: "Filipinas", en: "Philippines" }, region: "asia" },
  BD: { iso2: "BD", name: { es: "Bangladesh", en: "Bangladesh" }, region: "asia" },
  ES: { iso2: "ES", name: { es: "España", en: "Spain" }, region: "europa" },
};

export function getCountryMeta(iso2: string): CountryMeta | undefined {
  return COUNTRIES[iso2.toUpperCase()];
}

export function getCountryName(iso2: string, locale: Locale): string {
  const meta = getCountryMeta(iso2);
  return meta?.name[locale] ?? iso2;
}

export function getCountryRegion(iso2: string): RegionId {
  return getCountryMeta(iso2)?.region ?? "europa";
}

export function getRegionMeta(regionId: RegionId): RegionMeta {
  return REGIONS[regionId] ?? REGIONS.europa;
}

export function getRegionName(regionId: RegionId, locale: Locale): string {
  return getRegionMeta(regionId).name[locale];
}
