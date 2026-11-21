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

export interface OverallSummaryData {
  salariedHeadcount: number | null;
  totalWagesEur: number | null;
  averageAnnualWageEur: number | null;
  unemploymentCostEur: number | null;
  unemploymentRecipients: number | null;
  pensionsCostEur: number | null;
  pensionRecipients: number | null;
  averagePensionEur: number | null;
  totalBenefitsAndPensionsEur: number | null;
  wageToBenefitRatio: number | null;
  foreignShareOfWagesPct: number | null;
  foreignShareOfSalariedPct: number | null;
  foreignShareOfUnemploymentCostPct: number | null;
  foreignShareOfPensionersPct: number | null;
  tgssForeignAffiliates: number | null;
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
  unemploymentRecipients: number | null;
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

type CanonicalAgeId = "under_26" | "26_35" | "36_45" | "46_55" | "over_55";

const CANONICAL_AGE_ORDER: CanonicalAgeId[] = [
  "under_26",
  "26_35",
  "36_45",
  "46_55",
  "over_55",
];

const CANONICAL_AGE_LABELS: Record<CanonicalAgeId, string> = {
  under_26: "Menores de 26 años",
  "26_35": "De 26 a 35 años",
  "36_45": "De 36 a 45 años",
  "46_55": "De 46 a 55 años",
  over_55: "Mayores de 55 años",
};

function classifyCanonicalAge(rawLabel: string): CanonicalAgeId | null {
  const s = rawLabel.toLowerCase().replace(/\s+/g, " ").trim();
  if (s === "total" || s.startsWith("total")) return null;

  if (
    s.includes("menor de 18") ||
    s.includes("18 a 25") ||
    s.includes("menores de 26") ||
    s.includes("menor de 26") ||
    s.includes("hasta 25")
  ) {
    return "under_26";
  }
  if (s.includes("26 a 35")) {
    return "26_35";
  }
  if (s.includes("36 a 45")) {
    return "36_45";
  }
  if (s.includes("46 a 55")) {
    return "46_55";
  }
  if (
    s.includes("56 a 65") ||
    s.includes("56 a 64") ||
    s.includes("mayor de 65") ||
    s.includes("mayores de 65") ||
    s.includes("65 y más") ||
    s.includes("65 y mas") ||
    s.includes("más de 55") ||
    s.includes("mas de 55") ||
    s.includes("mayores de 55") ||
    s.includes("mayor de 55")
  ) {
    return "over_55";
  }

  return null;
}

export function buildOverallSummary(
  record: AdminRegisterYearRecord | undefined
): OverallSummaryData {
  const salTotalMap = record?.aeat?.salariedWorkers?.total?.total;
  const unempTotalMap = record?.aeat?.unemploymentRecipients?.total?.total;
  const penTotalMap = record?.aeat?.pensionRecipients?.total?.total;

  const salTot = getTotalEntry(salTotalMap);
  const unempTot = getTotalEntry(unempTotalMap);
  const penTot = getTotalEntry(penTotalMap);

  const salFor = getTotalEntry(record?.aeat?.salariedWorkers?.foreign?.total);
  const salEsp = getTotalEntry(record?.aeat?.salariedWorkers?.spanish?.total);
  const unempFor = getTotalEntry(record?.aeat?.unemploymentRecipients?.foreign?.total);
  const unempEsp = getTotalEntry(record?.aeat?.unemploymentRecipients?.spanish?.total);

  const salariedHeadcount =
    salTot?.headcount ??
    (salEsp?.headcount !== undefined && salFor?.headcount !== undefined
      ? salEsp.headcount + salFor.headcount
      : null);

  const totalWagesEur =
    salTot?.totalWagesEur ??
    (salEsp?.totalWagesEur !== undefined && salFor?.totalWagesEur !== undefined
      ? salEsp.totalWagesEur + salFor.totalWagesEur
      : null);

  const averageAnnualWageEur =
    salTot?.averageAnnualWageEur ??
    (totalWagesEur !== null && salariedHeadcount !== null && salariedHeadcount > 0
      ? totalWagesEur / salariedHeadcount
      : null);

  const unemploymentCostEur =
    unempTot?.totalBenefitsEur ??
    (unempEsp?.totalBenefitsEur !== undefined && unempFor?.totalBenefitsEur !== undefined
      ? unempEsp.totalBenefitsEur + unempFor.totalBenefitsEur
      : null);

  const unemploymentRecipients =
    unempTot?.recipients ??
    (unempEsp?.recipients !== undefined && unempFor?.recipients !== undefined
      ? unempEsp.recipients + unempFor.recipients
      : null);

  const pensionsCostEur = penTot?.totalPensionsEur ?? null;
  const pensionRecipients = penTot?.recipients ?? null;
  const averagePensionEur =
    penTot?.averagePensionEur ??
    (pensionsCostEur !== null && pensionRecipients !== null && pensionRecipients > 0
      ? pensionsCostEur / pensionRecipients
      : null);

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

  const foreignShareOfWagesPct =
    salFor?.totalWagesEur !== undefined && totalWagesEur !== null && totalWagesEur > 0
      ? (salFor.totalWagesEur / totalWagesEur) * 100
      : null;

  const foreignShareOfSalariedPct =
    salFor?.headcount !== undefined && salariedHeadcount !== null && salariedHeadcount > 0
      ? (salFor.headcount / salariedHeadcount) * 100
      : null;

  const foreignShareOfUnemploymentCostPct =
    unempFor?.totalBenefitsEur !== undefined &&
    unemploymentCostEur !== null &&
    unemploymentCostEur > 0
      ? (unempFor.totalBenefitsEur / unemploymentCostEur) * 100
      : null;

  const ineByNat = record?.ine?.contributoryPensionersByNationality;
  const foreignPensioners =
    record?.aeat?.pensionRecipients?.foreign?.total?.Total?.recipients ??
    ineByNat?.foreign ??
    null;
  const spanishPensioners =
    record?.aeat?.pensionRecipients?.spanish?.total?.Total?.recipients ??
    ineByNat?.spanish ??
    null;
  const totInePensioners =
    ineByNat?.total ??
    (foreignPensioners !== null && spanishPensioners !== null
      ? foreignPensioners + spanishPensioners
      : null);

  const foreignShareOfPensionersPct =
    foreignPensioners !== null && totInePensioners !== null && totInePensioners > 0
      ? (foreignPensioners / totInePensioners) * 100
      : null;

  const tgssInfo = getTgssBreakdown(record);

  return {
    salariedHeadcount,
    totalWagesEur,
    averageAnnualWageEur,
    unemploymentCostEur,
    unemploymentRecipients,
    pensionsCostEur,
    pensionRecipients,
    averagePensionEur,
    totalBenefitsAndPensionsEur,
    wageToBenefitRatio,
    foreignShareOfWagesPct,
    foreignShareOfSalariedPct,
    foreignShareOfUnemploymentCostPct,
    foreignShareOfPensionersPct,
    tgssForeignAffiliates: tgssInfo.totalForeign,
  };
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
  nationality: AdminNationalityKey
): {
  rows: AgeBracketDetailRow[];
  hasBenefitsData: boolean;
  maxWageEur: number;
  maxSectionEur: number;
  maxRatio: number;
} {
  const salMap = getAgeMap(record?.aeat?.salariedWorkers, nationality);
  const unempMap = getAgeMap(record?.aeat?.unemploymentRecipients, nationality);

  if (!salMap) {
    return { rows: [], hasBenefitsData: false, maxWageEur: 0, maxSectionEur: 0, maxRatio: 0 };
  }

  const groupTotalWages = getTotalEntry(salMap)?.totalWagesEur ?? 0;
  const hasBenefitsData = Boolean(unempMap);

  const buckets: Record<
    CanonicalAgeId,
    {
      headcount: number;
      totalWagesEur: number;
      unemploymentCostEur: number;
      unemploymentRecipients: number;
      hasWages: boolean;
      hasUnemp: boolean;
    }
  > = {
    under_26: {
      headcount: 0,
      totalWagesEur: 0,
      unemploymentCostEur: 0,
      unemploymentRecipients: 0,
      hasWages: false,
      hasUnemp: false,
    },
    "26_35": {
      headcount: 0,
      totalWagesEur: 0,
      unemploymentCostEur: 0,
      unemploymentRecipients: 0,
      hasWages: false,
      hasUnemp: false,
    },
    "36_45": {
      headcount: 0,
      totalWagesEur: 0,
      unemploymentCostEur: 0,
      unemploymentRecipients: 0,
      hasWages: false,
      hasUnemp: false,
    },
    "46_55": {
      headcount: 0,
      totalWagesEur: 0,
      unemploymentCostEur: 0,
      unemploymentRecipients: 0,
      hasWages: false,
      hasUnemp: false,
    },
    over_55: {
      headcount: 0,
      totalWagesEur: 0,
      unemploymentCostEur: 0,
      unemploymentRecipients: 0,
      hasWages: false,
      hasUnemp: false,
    },
  };

  for (const [ageLabel, metrics] of Object.entries(salMap)) {
    const cid = classifyCanonicalAge(ageLabel);
    if (!cid) continue;
    buckets[cid].headcount += metrics.headcount ?? 0;
    buckets[cid].totalWagesEur += metrics.totalWagesEur ?? 0;
    buckets[cid].hasWages = true;
  }

  if (unempMap) {
    for (const [ageLabel, metrics] of Object.entries(unempMap)) {
      const cid = classifyCanonicalAge(ageLabel);
      if (!cid) continue;
      if (typeof metrics.totalBenefitsEur === "number") {
        buckets[cid].unemploymentCostEur += metrics.totalBenefitsEur;
        buckets[cid].hasUnemp = true;
      }
      if (typeof metrics.recipients === "number") {
        buckets[cid].unemploymentRecipients += metrics.recipients;
      }
    }
  }

  const rows: AgeBracketDetailRow[] = [];
  let maxWageEur = 0;
  let maxSectionEur = 0;
  let maxRatio = 0;

  for (const cid of CANONICAL_AGE_ORDER) {
    const b = buckets[cid];
    if (!b.hasWages && !b.hasUnemp) continue;

    const averageAnnualWageEur = b.headcount > 0 ? Math.round(b.totalWagesEur / b.headcount) : 0;
    if (averageAnnualWageEur > maxWageEur) {
      maxWageEur = averageAnnualWageEur;
    }

    const unemploymentCostEur = b.hasUnemp ? b.unemploymentCostEur : null;

    if (b.totalWagesEur > maxSectionEur) maxSectionEur = b.totalWagesEur;
    if (unemploymentCostEur !== null && unemploymentCostEur > maxSectionEur) {
      maxSectionEur = unemploymentCostEur;
    }

    const ratio =
      unemploymentCostEur !== null && unemploymentCostEur > 0
        ? b.totalWagesEur / unemploymentCostEur
        : null;

    if (ratio !== null && ratio > maxRatio) {
      maxRatio = ratio;
    }

    rows.push({
      id: cid,
      label: CANONICAL_AGE_LABELS[cid],
      headcount: b.headcount,
      paymentsPerPerson: null,
      totalWagesEur: b.totalWagesEur,
      averageAnnualWageEur,
      shareOfGroupWagesPct:
        groupTotalWages > 0 ? (b.totalWagesEur / groupTotalWages) * 100 : 0,
      unemploymentCostEur,
      unemploymentRecipients: b.hasUnemp ? b.unemploymentRecipients : null,
      ratio,
    });
  }

  return { rows, hasBenefitsData, maxWageEur, maxSectionEur, maxRatio };
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