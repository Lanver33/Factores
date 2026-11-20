export type AdminSexFilter = "total" | "male" | "female";
export type AdminNationalityKey = "spanish" | "foreign" | "total";

export interface AeatAgeMetrics {
  headcount?: number;
  recipients?: number;
  paymentsPerPerson?: number;
  totalWagesEur?: number;
  averageAnnualWageEur?: number;
  totalBenefitsEur?: number;
  averageBenefitEur?: number;
  totalPensionsEur?: number | null;
  averagePensionEur?: number | null;
}

export type AeatAgeBandMap = Record<string, AeatAgeMetrics>;

export interface AeatPopulationData {
  spanish?: Partial<Record<AdminSexFilter, AeatAgeBandMap>>;
  foreign?: Partial<Record<AdminSexFilter, AeatAgeBandMap>>;
  total?: Partial<Record<AdminSexFilter, AeatAgeBandMap>>;
}

export interface AeatYearPayload {
  salariedWorkers?: AeatPopulationData;
  unemploymentRecipients?: AeatPopulationData;
  pensionRecipients?: AeatPopulationData;
}

export interface TgssYearPayload {
  referencePeriod: string;
  periodsAvailable: string[];
  affiliatesByCountryAndRegime: Record<string, Record<string, number>>;
}

export interface IneYearPayload {
  contributoryPensionersByNationality?: {
    total?: number;
    spanish?: number;
    foreign?: number;
  } | null;
}

export interface AdminRegisterYearRecord {
  year: string;
  aeat?: AeatYearPayload | null;
  tgss?: TgssYearPayload | null;
  ine?: IneYearPayload | null;
}

export interface GroupSummaryCardData {
  nationality: "spanish" | "foreign";
  salariedHeadcount: number | null;
  totalWagesEur: number | null;
  unemploymentCostEur: number | null;
  unemploymentRecipients: number | null;
  pensionsCostEur: number | null;
  isPensionCostEstimated: boolean;
  appliedPensionWeightPct: number | null;
  impliedAveragePensionEur: number | null;
  pensionRecipients: number | null;
  totalSystemPensionsEur: number | null;
  totalSystemPensionRecipients: number | null;
  systemAveragePensionEur: number | null;
  totalBenefitsAndPensionsEur: number | null;
  wageToBenefitRatio: number | null;
}

export interface AgeBracketDetailRow {
  id: string;
  label: string;
  headcount: number;
  paymentsPerPerson: number | null;
  totalWagesEur: number;
  averageAnnualWageEur: number;
  shareOfGroupWagesPct: number;
  unemploymentCostEur: number | null;
  pensionsCostEur: number | null;
  totalReceivedEur: number | null;
  ratio: number | null;
}

export interface TgssCountryRow {
  country: string;
  affiliates: number;
  shareOfTotalPct: number;
}

export function getAvailableYears(records: AdminRegisterYearRecord[]): string[] {
  if (!Array.isArray(records)) return [];
  return records
    .filter((r) => r && r.aeat)
    .map((r) => r.year)
    .sort((a, b) => Number(a) - Number(b));
}

export function getLatestYear(records: AdminRegisterYearRecord[]): string {
  const years = getAvailableYears(records);
  return years[years.length - 1] ?? "2025";
}

function getTotalEntry(map: AeatAgeBandMap | undefined): AeatAgeMetrics | undefined {
  if (!map) return undefined;
  if (map["Total"]) return map["Total"];
  const totalKey = Object.keys(map).find((k) => k.toLowerCase().startsWith("total"));
  return totalKey ? map[totalKey] : undefined;
}

function getAgeMap(
  popData: AeatPopulationData | undefined,
  nationality: AdminNationalityKey
): AeatAgeBandMap | undefined {
  if (!popData) return undefined;
  return popData[nationality]?.total ?? popData.total?.total;
}

export function buildGroupSummary(
  record: AdminRegisterYearRecord | undefined,
  nationality: "spanish" | "foreign",
  foreignPensionWeightPct: number = 40
): GroupSummaryCardData {
  const salMap = getAgeMap(record?.aeat?.salariedWorkers, nationality);
  const unempMap = getAgeMap(record?.aeat?.unemploymentRecipients, nationality);

  const natPenBandMap = record?.aeat?.pensionRecipients?.[nationality]?.total;
  const penTotal = getTotalEntry(natPenBandMap);

  const sysPenBandMap = record?.aeat?.pensionRecipients?.total?.total;
  const sysPenTotal = getTotalEntry(sysPenBandMap);

  const salTotal = getTotalEntry(salMap);
  const unempTotal = getTotalEntry(unempMap);

  const salariedHeadcount = salTotal?.headcount ?? null;
  const totalWagesEur = salTotal?.totalWagesEur ?? null;
  const unemploymentCostEur = unempTotal?.totalBenefitsEur ?? null;
  const unemploymentRecipients = unempTotal?.recipients ?? null;

  const totalSystemPensionsEur = sysPenTotal?.totalPensionsEur ?? null;
  const totalSystemPensionRecipients = sysPenTotal?.recipients ?? null;
  const systemAveragePensionEur =
    sysPenTotal?.averagePensionEur ??
    (totalSystemPensionsEur !== null &&
    totalSystemPensionRecipients !== null &&
    totalSystemPensionRecipients > 0
      ? totalSystemPensionsEur / totalSystemPensionRecipients
      : null);

  const ineByNat = record?.ine?.contributoryPensionersByNationality;
  const ineHeadcount = ineByNat?.[nationality] ?? null;
  const pensionRecipients = penTotal?.recipients ?? ineHeadcount;

  let pensionsCostEur: number | null = penTotal?.totalPensionsEur ?? null;
  let isPensionCostEstimated = false;
  let appliedPensionWeightPct: number | null = null;
  let impliedAveragePensionEur: number | null = penTotal?.averagePensionEur ?? null;

  if (pensionsCostEur === null && totalSystemPensionsEur !== null) {
    const spanishCount =
      record?.aeat?.pensionRecipients?.spanish?.total?.Total?.recipients ??
      ineByNat?.spanish ??
      null;
    const foreignCount =
      record?.aeat?.pensionRecipients?.foreign?.total?.Total?.recipients ??
      ineByNat?.foreign ??
      null;

    if (spanishCount !== null && foreignCount !== null) {
      const foreignWeight = Math.min(80, Math.max(20, foreignPensionWeightPct));
      const spanishWeight = 100 - foreignWeight;
      const weightedTotal = spanishCount * spanishWeight + foreignCount * foreignWeight;

      if (weightedTotal > 0) {
        const estimatedForeignCost = Math.round(
          totalSystemPensionsEur * ((foreignCount * foreignWeight) / weightedTotal)
        );
        const estimatedSpanishCost = Math.max(0, totalSystemPensionsEur - estimatedForeignCost);

        if (nationality === "foreign") {
          pensionsCostEur = estimatedForeignCost;
          appliedPensionWeightPct = foreignWeight;
          impliedAveragePensionEur = foreignCount > 0 ? estimatedForeignCost / foreignCount : null;
        } else {
          pensionsCostEur = estimatedSpanishCost;
          appliedPensionWeightPct = spanishWeight;
          impliedAveragePensionEur = spanishCount > 0 ? estimatedSpanishCost / spanishCount : null;
        }
        isPensionCostEstimated = true;
      }
    }
  }

  const hasAnyBenefit = unemploymentCostEur !== null || pensionsCostEur !== null;
  const totalBenefitsAndPensionsEur = hasAnyBenefit
    ? (unemploymentCostEur ?? 0) + (pensionsCostEur ?? 0)
    : null;

  const wageToBenefitRatio =
    totalWagesEur !== null &&
    totalBenefitsAndPensionsEur !== null &&
    totalBenefitsAndPensionsEur > 0
      ? totalWagesEur / totalBenefitsAndPensionsEur
      : null;

  return {
    nationality,
    salariedHeadcount,
    totalWagesEur,
    unemploymentCostEur,
    unemploymentRecipients,
    pensionsCostEur,
    isPensionCostEstimated,
    appliedPensionWeightPct,
    impliedAveragePensionEur,
    pensionRecipients,
    totalSystemPensionsEur,
    totalSystemPensionRecipients,
    systemAveragePensionEur,
    totalBenefitsAndPensionsEur,
    wageToBenefitRatio,
  };
}

export function buildGroupAgeBrackets(
  record: AdminRegisterYearRecord | undefined,
  nationality: "spanish" | "foreign"
): {
  rows: AgeBracketDetailRow[];
  hasBenefitsData: boolean;
  maxWageEur: number;
  maxRatio: number;
} {
  const salMap = getAgeMap(record?.aeat?.salariedWorkers, nationality);
  const unempMap = getAgeMap(record?.aeat?.unemploymentRecipients, nationality);
  const penMap = record?.aeat?.pensionRecipients?.[nationality]?.total;

  if (!salMap) {
    return { rows: [], hasBenefitsData: false, maxWageEur: 0, maxRatio: 0 };
  }

  const groupTotalWages = getTotalEntry(salMap)?.totalWagesEur ?? 0;
  const hasBenefitsData = Boolean(unempMap);

  const rows: AgeBracketDetailRow[] = [];
  let maxWageEur = 0;
  let maxRatio = 0;

  for (const [ageLabel, metrics] of Object.entries(salMap)) {
    if (ageLabel.toLowerCase().startsWith("total")) continue;
    const headcount = metrics.headcount ?? 0;
    const totalWagesEur = metrics.totalWagesEur ?? 0;
    const averageAnnualWageEur = metrics.averageAnnualWageEur ?? 0;

    if (averageAnnualWageEur > maxWageEur) {
      maxWageEur = averageAnnualWageEur;
    }

    const uMetrics = unempMap?.[ageLabel];
    const pMetrics = penMap?.[ageLabel];
    const unemploymentCostEur = uMetrics?.totalBenefitsEur ?? null;
    const pensionsCostEur = pMetrics?.totalPensionsEur ?? null;

    const totalReceivedEur =
      unemploymentCostEur !== null || pensionsCostEur !== null
        ? (unemploymentCostEur ?? 0) + (pensionsCostEur ?? 0)
        : null;

    const ratio =
      totalReceivedEur !== null && totalReceivedEur > 0
        ? totalWagesEur / totalReceivedEur
        : null;

    if (ratio !== null && ratio > maxRatio) {
      maxRatio = ratio;
    }

    rows.push({
      id: ageLabel,
      label: ageLabel,
      headcount,
      paymentsPerPerson: metrics.paymentsPerPerson ?? null,
      totalWagesEur,
      averageAnnualWageEur,
      shareOfGroupWagesPct:
        groupTotalWages > 0 ? (totalWagesEur / groupTotalWages) * 100 : 0,
      unemploymentCostEur,
      pensionsCostEur,
      totalReceivedEur,
      ratio,
    });
  }

  return { rows, hasBenefitsData, maxWageEur, maxRatio };
}

export function getTgssBreakdown(record: AdminRegisterYearRecord | undefined): {
  totalForeign: number | null;
  byCountry: TgssCountryRow[];
} {
  const map = record?.tgss?.affiliatesByCountryAndRegime;
  if (!map) return { totalForeign: null, byCountry: [] };

  const regimeSet = new Set<string>();
  Object.values(map).forEach((regObj) => {
    Object.keys(regObj).forEach((r) => regimeSet.add(r));
  });
  const regimes = Array.from(regimeSet);
  const totalRegimeKey =
    regimes.find((r) => r.toLowerCase().includes("total")) ?? regimes[0];

  let totalForeign: number | null = null;
  const totalEntry = map["TOTAL"] ?? map["Total"];
  if (totalEntry && totalRegimeKey && typeof totalEntry[totalRegimeKey] === "number") {
    totalForeign = totalEntry[totalRegimeKey];
  }

  const rows: TgssCountryRow[] = [];
  for (const [country, regObj] of Object.entries(map)) {
    if (country.toUpperCase() === "TOTAL") continue;
    const val = totalRegimeKey ? regObj[totalRegimeKey] : undefined;
    if (typeof val === "number" && val > 0) {
      rows.push({
        country,
        affiliates: val,
        shareOfTotalPct: totalForeign && totalForeign > 0 ? (val / totalForeign) * 100 : 0,
      });
    }
  }

  rows.sort((a, b) => b.affiliates - a.affiliates);
  return { totalForeign, byCountry: rows };
}