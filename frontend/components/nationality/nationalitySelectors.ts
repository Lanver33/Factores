import type {
  NationalityAnnualRecord,
  PopulationDefinition,
  DemographicGroupStats,
  LaborGroupStats,
  LivingConditionsGroupStats,
} from "@/lib/types";

export type LaborMetricKey =
  | "employmentRatePct"
  | "activityRatePct"
  | "unemploymentRatePct"
  | "employedThousands";

export type LivingConditionsMetricKey =
  | "medianEquivalisedIncomeEur"
  | "meanEquivalisedIncomeEur"
  | "atRiskOfPovertyPct";

export interface KpiCardData {
  titleKey: string;
  foreignValue: string;
  nationalValue: string;
  foreignSubtext: string;
  nationalSubtext: string;
  yoyDelta: string | null;
  notice?: string;
}

export interface RepresentationComparisonRow {
  labelKey: string;
  foreignSharePct: number;
  nationalSharePct: number;
  foreignCount?: number;
  totalCount?: number;
}

export interface LaborTimeSeriesRow {
  year: string;
  nationals: number | null;
  foreigners: number | null;
  euForeigners?: number | null;
  nonEuForeigners?: number | null;
  total: number | null;
}

export interface LivingConditionsTimeSeriesRow {
  year: string;
  nationals: number | null;
  foreigners: number | null;
  euForeigners?: number | null;
  nonEuForeigners?: number | null;
  total: number | null;
  ratioPct: number | null;
}

export interface NaturalizationPoint {
  year: string;
  naturalizations: number | null;
  cumulativeSinceStart: number;
}

/** Formateo compacto en millones o miles con coma decimal española */
export function formatHeadcount(num: number | null | undefined, locale: string = "es"): string {
  if (num === null || num === undefined || Number.isNaN(num)) return "—";
  if (num >= 1_000_000) {
    const val = (num / 1_000_000).toFixed(2);
    return locale === "en" ? `${val} M` : `${val.replace(".", ",")} M`;
  }
  if (num >= 1_000) {
    const val = (num / 1_000).toFixed(1);
    return locale === "en" ? `${val} k` : `${val.replace(".", ",")} mil`;
  }
  return num.toLocaleString(locale === "en" ? "en-US" : "es-ES");
}

export function formatExactNumber(num: number | null | undefined, locale: string = "es"): string {
  if (num === null || num === undefined || Number.isNaN(num)) return "—";
  return num.toLocaleString(locale === "en" ? "en-US" : "es-ES");
}

export function formatPercent(num: number | null | undefined, decimals: number = 1, locale: string = "es"): string {
  if (num === null || num === undefined || Number.isNaN(num)) return "—";
  const fixed = num.toFixed(decimals);
  return `${locale === "en" ? fixed : fixed.replace(".", ",")}%`;
}

export function formatCurrencyEur(num: number | null | undefined, locale: string = "es"): string {
  if (num === null || num === undefined || Number.isNaN(num)) return "—";
  const intPart = Math.round(num).toLocaleString(locale === "en" ? "en-US" : "es-ES");
  return `${intPart} €`;
}

export function formatDelta(
  delta: number | null | undefined,
  unit: string = "pp",
  decimals: number = 1,
  locale: string = "es"
): string {
  if (delta === null || delta === undefined || Number.isNaN(delta)) return "";
  const sign = delta > 0 ? "+" : "";
  const valStr = delta.toFixed(decimals);
  const formatted = locale === "en" ? valStr : valStr.replace(".", ",");
  return `${sign}${formatted} ${unit}`;
}

export function getAvailableYears(records: NationalityAnnualRecord[]): string[] {
  if (!Array.isArray(records)) return [];
  return records.map((r) => r.year).sort((a, b) => Number(a) - Number(b));
}

export function getLatestCompleteYear(
  records: NationalityAnnualRecord[],
  definition: PopulationDefinition = "citizenship"
): string {
  if (!Array.isArray(records) || records.length === 0) return "2024";

  for (let i = records.length - 1; i >= 0; i--) {
    const r = records[i];
    const slice = r.definitions?.[definition];
    if (slice?.demographics?.foreigners && slice?.laborMarket?.foreigners) {
      return r.year;
    }
  }

  // Fallback a cualquier año con demografía
  for (let i = records.length - 1; i >= 0; i--) {
    const r = records[i];
    if (r.definitions?.[definition]?.demographics?.foreigners) {
      return r.year;
    }
  }

  return records[records.length - 1]?.year ?? "2024";
}

export function getRecordForYear(
  records: NationalityAnnualRecord[],
  year: string
): NationalityAnnualRecord | undefined {
  return records.find((r) => r.year === year);
}

export function getPreviousRecord(
  records: NationalityAnnualRecord[],
  year: string
): NationalityAnnualRecord | undefined {
  const sorted = [...records].sort((a, b) => Number(a.year) - Number(b.year));
  const idx = sorted.findIndex((r) => r.year === year);
  if (idx > 0) return sorted[idx - 1];
  return undefined;
}

export function getHeadlineKpis(
  records: NationalityAnnualRecord[],
  year: string,
  definition: PopulationDefinition = "citizenship",
  locale: string = "es"
): {
  popKpi: KpiCardData;
  workingAgeKpi: KpiCardData;
  employmentKpi: KpiCardData;
  incomeKpi: KpiCardData;
} {
  const current = getRecordForYear(records, year);
  const prev = getPreviousRecord(records, year);

  const curSlice = current?.definitions?.[definition];
  const prevSlice = prev?.definitions?.[definition];

  const curDemoFor = curSlice?.demographics?.foreigners;
  const curDemoNat = curSlice?.demographics?.nationals;
  const prevDemoFor = prevSlice?.demographics?.foreigners;

  // 1. Población total
  const popShare = curDemoFor?.shareOfTotalPct ?? 0;
  const prevPopShare = prevDemoFor?.shareOfTotalPct;
  const popDelta = prevPopShare !== undefined ? popShare - prevPopShare : null;

  const popKpi: KpiCardData = {
    titleKey: definition === "citizenship" ? "foreignPopulation" : "foreignBornPopulation",
    foreignValue: formatPercent(popShare, 1, locale),
    nationalValue: formatPercent(curDemoNat?.shareOfTotalPct ?? 100 - popShare, 1, locale),
    foreignSubtext: `${formatHeadcount(curDemoFor?.population, locale)} (${locale === "en" ? "of total" : "del total"})`,
    nationalSubtext: `${formatHeadcount(curDemoNat?.population, locale)}`,
    yoyDelta: popDelta !== null ? formatDelta(popDelta, "pp", 2, locale) : null,
  };

  // 2. Edad laboral (15-64)
  const workForPct = curDemoFor?.ageBands.workingAge15to64Pct ?? 0;
  const workNatPct = curDemoNat?.ageBands.workingAge15to64Pct ?? 0;
  const prevWorkForPct = prevDemoFor?.ageBands.workingAge15to64Pct;
  const workDelta = prevWorkForPct !== undefined ? workForPct - prevWorkForPct : null;

  const workingAgeKpi: KpiCardData = {
    titleKey: "workingAgeShare",
    foreignValue: formatPercent(workForPct, 1, locale),
    nationalValue: formatPercent(workNatPct, 1, locale),
    foreignSubtext: locale === "en" ? "Foreigners 15–64" : "Extranjeros (15–64)",
    nationalSubtext: locale === "en" ? "Spanish 15–64" : "Españoles (15–64)",
    yoyDelta: workDelta !== null ? formatDelta(workDelta, "pp", 1, locale) : null,
  };

  // 3. Tasa de empleo (15-64)
  const curLaborFor = curSlice?.laborMarket?.foreigners;
  const curLaborNat = curSlice?.laborMarket?.nationals;
  const prevLaborFor = prevSlice?.laborMarket?.foreigners;

  const empForRate = curLaborFor?.employmentRatePct;
  const empNatRate = curLaborNat?.employmentRatePct;
  const prevEmpForRate = prevLaborFor?.employmentRatePct;
  const empDelta = empForRate !== undefined && prevEmpForRate !== undefined && empForRate !== null && prevEmpForRate !== null
    ? empForRate - prevEmpForRate
    : null;

  const employmentKpi: KpiCardData = {
    titleKey: "metricEmploymentRate",
    foreignValue: formatPercent(empForRate, 1, locale),
    nationalValue: formatPercent(empNatRate, 1, locale),
    foreignSubtext: locale === "en" ? "Foreign 15–64" : "Extranjeros (15–64)",
    nationalSubtext: locale === "en" ? "Spanish 15–64" : "Españoles (15–64)",
    yoyDelta: empDelta !== null ? formatDelta(empDelta, "pp", 1, locale) : null,
  };

  // 4. Renta mediana
  const curLivFor = current?.livingConditions?.foreigners;
  const curLivNat = current?.livingConditions?.nationals;
  const prevLivFor = prev?.livingConditions?.foreigners;

  const medForInc = curLivFor?.medianEquivalisedIncomeEur;
  const medNatInc = curLivNat?.medianEquivalisedIncomeEur;
  const prevMedForInc = prevLivFor?.medianEquivalisedIncomeEur;
  const incDelta = medForInc !== undefined && prevMedForInc !== undefined && medForInc !== null && prevMedForInc !== null
    ? medForInc - prevMedForInc
    : null;

  const incomeKpi: KpiCardData = {
    titleKey: "metricMedianIncome",
    foreignValue: formatCurrencyEur(medForInc, locale),
    nationalValue: formatCurrencyEur(medNatInc, locale),
    foreignSubtext: locale === "en" ? "Foreign median" : "Extranjeros (mediana)",
    nationalSubtext: locale === "en" ? "Spanish median" : "Españoles (mediana)",
    yoyDelta: incDelta !== null ? formatDelta(incDelta, "€", 0, locale) : null,
    notice: definition === "birthplace"
      ? (locale === "en" ? "EU-SILC published by passport" : "ECV oficial por pasaporte")
      : undefined,
  };

  return { popKpi, workingAgeKpi, employmentKpi, incomeKpi };
}

export function buildRepresentationComparison(
  record: NationalityAnnualRecord | undefined,
  definition: PopulationDefinition = "citizenship"
): RepresentationComparisonRow[] {
  if (!record) return [];
  const slice = record.definitions?.[definition];
  const demoFor = slice?.demographics?.foreigners;
  const demoNat = slice?.demographics?.nationals;
  const demoTot = slice?.demographics?.total;

  const laborFor = slice?.laborMarket?.foreigners;
  const laborTot = slice?.laborMarket?.total;

  const popShare = demoFor?.shareOfTotalPct ?? 0;
  const workShare = demoFor?.shareOfWorkingAgePct ?? 0;
  const empShare = laborFor?.shareOfEmployedPct ?? 0;

  return [
    {
      labelKey: "totalPopulation",
      foreignSharePct: popShare,
      nationalSharePct: demoNat?.shareOfTotalPct ?? (100 - popShare),
      foreignCount: demoFor?.population,
      totalCount: demoTot?.population,
    },
    {
      labelKey: "workingAgeShare",
      foreignSharePct: workShare,
      nationalSharePct: demoNat?.shareOfWorkingAgePct ?? (100 - workShare),
      foreignCount: demoFor?.ageBands.workingAge15to64,
      totalCount: demoTot?.ageBands.workingAge15to64,
    },
    {
      labelKey: "employedShare",
      foreignSharePct: empShare,
      nationalSharePct: laborTot ? Math.max(0, 100 - empShare) : 0,
      foreignCount: laborFor?.employedThousands ? Math.round(laborFor.employedThousands * 1000) : undefined,
      totalCount: laborTot?.employedThousands ? Math.round(laborTot.employedThousands * 1000) : undefined,
    },
  ];
}

export function buildLaborTimeSeries(
  records: NationalityAnnualRecord[],
  definition: PopulationDefinition,
  metric: LaborMetricKey,
  includeEuSplit: boolean = false
): LaborTimeSeriesRow[] {
  if (!Array.isArray(records)) return [];

  return records.map((rec) => {
    const labor = rec.definitions?.[definition]?.laborMarket;
    const row: LaborTimeSeriesRow = {
      year: rec.year,
      nationals: labor?.nationals?.[metric] ?? null,
      foreigners: labor?.foreigners?.[metric] ?? null,
      total: labor?.total?.[metric] ?? null,
    };

    if (includeEuSplit) {
      row.euForeigners = labor?.euForeigners?.[metric] ?? null;
      row.nonEuForeigners = labor?.nonEuForeigners?.[metric] ?? null;
    }

    return row;
  });
}

export function buildNaturalizationsSeries(
  records: NationalityAnnualRecord[]
): NaturalizationPoint[] {
  if (!Array.isArray(records)) return [];

  let cumulative = 0;
  return records.map((rec) => {
    const val = rec.naturalizations;
    if (val !== null && val !== undefined) {
      cumulative += val;
    }
    return {
      year: rec.year,
      naturalizations: val,
      cumulativeSinceStart: cumulative,
    };
  });
}

export function buildLivingConditionsSeries(
  records: NationalityAnnualRecord[],
  metric: LivingConditionsMetricKey,
  includeEuSplit: boolean = false
): LivingConditionsTimeSeriesRow[] {
  if (!Array.isArray(records)) return [];

  return records.map((rec) => {
    const liv = rec.livingConditions;
    const natVal = liv?.nationals?.[metric] ?? null;
    const forVal = liv?.foreigners?.[metric] ?? null;

    let ratio: number | null = null;
    if (natVal !== null && forVal !== null && natVal > 0) {
      ratio = roundTo((forVal / natVal) * 100, 1);
    }

    const row: LivingConditionsTimeSeriesRow = {
      year: rec.year,
      nationals: natVal,
      foreigners: forVal,
      total: liv?.total?.[metric] ?? null,
      ratioPct: ratio,
    };

    if (includeEuSplit) {
      row.euForeigners = liv?.euForeigners?.[metric] ?? null;
      row.nonEuForeigners = liv?.nonEuForeigners?.[metric] ?? null;
    }

    return row;
  });
}

function roundTo(val: number, decimals: number): number {
  const p = Math.pow(10, decimals);
  return Math.round(val * p) / p;
}
