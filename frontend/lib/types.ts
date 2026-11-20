import { z } from "zod";

export const HttpUrlSchema = z
  .string()
  .url()
  .refine((u) => u.startsWith("https://") || u.startsWith("http://"), {
    message: "Only http(s) URLs are allowed",
  });

export const LocalizedTextSchema = z.object({
  es: z.string().min(1),
  en: z.string().min(1),
});

export const SourceSchema = z.object({
  institution: LocalizedTextSchema,
  title: LocalizedTextSchema,
  shortName: LocalizedTextSchema.optional(),
  tableId: z.string().optional(),
  period: z.string().optional(),
  lastUpdated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  url: HttpUrlSchema.optional(),
});

export const CategorySchema = z.enum([
  "housing",
  "economy-employment",
  "healthcare",
  "pensions-demography",
]);
export type Category = z.infer<typeof CategorySchema>;

export const ValueFormatSchema = z.enum([
  "number",
  "percent",
  "currency-eur",
  "currency-mmeur",
]);
export type ValueFormat = z.infer<typeof ValueFormatSchema>;

export const ConceptGuideSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().min(1),
  quickKeys: z.array(
    z.object({
      id: z.string(),
      badge: z.string(),
      title: z.string(),
      summary: z.string(),
      example: z.string().optional(),
    })
  ),
  categories: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
    })
  ),
  terms: z.array(
    z.object({
      code: z.string(),
      displayCode: z.string(),
      categoryId: z.string(),
      title: z.string(),
      shortDefinition: z.string(),
      explanation: z.string(),
      keyNote: z.string().optional(),
      relatedCodes: z.array(z.string()).optional(),
    })
  ),
});

export const BaseIndicatorSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  category: CategorySchema.default("economy-employment"),
  question: LocalizedTextSchema,
  unit: LocalizedTextSchema,
  valueFormat: ValueFormatSchema.default("number"),
  contextNotes: z.object({
    es: z.array(z.string().min(1)),
    en: z.array(z.string().min(1)),
  }),
  conceptGuide: ConceptGuideSchema.optional(),
  sources: z.array(SourceSchema).min(1),
  lastUpdated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).default("2026-01-01"),
});

export const TimeSeriesIndicatorSchema = BaseIndicatorSchema.extend({
  kind: z.literal("time-series"),
  chartStyle: z.enum(["line", "bar"]),
  points: z.array(z.object({ period: z.string(), value: z.number() })).min(1),
});

export const FiscalBalanceIndicatorSchema = BaseIndicatorSchema.extend({
  kind: z.literal("fiscal-balance"),
  availableUnits: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        decimals: z.number().optional(),
      })
    )
    .optional(),
  taxonomy: z
    .object({
      revenues: z.array(z.any()),
      expenditures: z.array(z.any()),
    })
    .optional(),
  annualBalances: z.array(z.any()).optional(),
  points: z
    .array(
      z.object({
        year: z.string(),
        ratio: z.object({ foreign: z.number(), spanish: z.number() }),
        perCapitaEur: z.object({ foreign: z.number(), spanish: z.number() }),
        stateRevenueMmEur: z.record(z.string(), z.number()),
        stateSpendingMmEur: z.record(z.string(), z.number()),
        totalRevenueMmEur: z.number(),
        totalSpendingMmEur: z.number(),
        deficitMmEur: z.number(),
      })
    )
    .optional(),
});

export const ImmigrationFlowIndicatorSchema = BaseIndicatorSchema.extend({
  kind: z.literal("immigration-flow"),
  years: z
    .array(
      z.object({
        year: z.string(),
        declaredTotal: z.number().nonnegative(),
        byCountryIso2: z.record(z.string().length(2), z.number().nonnegative()),
        residualByRegion: z.record(z.string(), z.number().nonnegative()),
      })
    )
    .min(1),
});

export const NationalityIndicatorsIndicatorSchema = BaseIndicatorSchema.extend({
  kind: z.literal("nationality-indicators"),
  annualRecords: z.array(z.any()),
  dataPoints: z.array(z.object({ year: z.string(), value: z.number() })).optional(),
});

export const AdminRegistersNationalityIndicatorSchema = BaseIndicatorSchema.extend({
  kind: z.literal("admin-registers-nationality"),
  annualRecords: z.array(z.any()).default([]),
  dataPoints: z.array(z.object({ year: z.string(), value: z.number() })).optional(),
});

export const IndicatorSchema = z.discriminatedUnion("kind", [
  TimeSeriesIndicatorSchema,
  FiscalBalanceIndicatorSchema,
  ImmigrationFlowIndicatorSchema,
  NationalityIndicatorsIndicatorSchema,
  AdminRegistersNationalityIndicatorSchema,
]);

export type Indicator = z.infer<typeof IndicatorSchema>;
export type TimeSeriesIndicator = z.infer<typeof TimeSeriesIndicatorSchema>;
export type FiscalBalanceIndicator = z.infer<typeof FiscalBalanceIndicatorSchema>;
export type ImmigrationFlowIndicator = z.infer<typeof ImmigrationFlowIndicatorSchema>;
export type NationalityIndicatorsIndicator = z.infer<typeof NationalityIndicatorsIndicatorSchema>;
export type AdminRegistersNationalityIndicator = z.infer<typeof AdminRegistersNationalityIndicatorSchema>;

export type Locale = "es" | "en";
export type Lang = Locale;

export interface DirectoryIndexItem {
  id: string;
  kind: Indicator["kind"];
  category: Category;
  question: { es: string; en: string };
  unit: { es: string; en: string };
  valueFormat: ValueFormat;
  latestValue: number;
  latestPeriod: string;
  timeHorizon: string;
  primarySource: { es: string; en: string };
  searchSummary: { es: string; en: string };
  sparkline: number[];
}

export const CATEGORIES = [
  "Todas",
  "Vivienda",
  "Economía y Empleo",
  "Sanidad",
  "Pensiones y Demografía",
] as const;

export type ChartType =
  | "line"
  | "bar"
  | "fiscal-balance"
  | "immigration-flow"
  | "nationality-indicators";

export type PopulationDefinition = "citizenship" | "birthplace";
export type PopulationGroupKey =
  | "total"
  | "nationals"
  | "foreigners"
  | "euForeigners"
  | "nonEuForeigners";

export interface AgeBandBreakdown {
  under15: number;
  workingAge15to64: number;
  senior65plus: number;
  under15Pct: number;
  workingAge15to64Pct: number;
  senior65plusPct: number;
}

export interface DemographicGroupStats {
  population: number;
  shareOfTotalPct: number;
  shareOfWorkingAgePct: number;
  oldAgeDependencyRatio: number;
  ageBands: AgeBandBreakdown;
}

export interface LaborGroupStats {
  employedThousands: number | null;
  shareOfEmployedPct: number | null;
  activityRatePct: number | null;
  employmentRatePct: number | null;
  unemploymentRatePct: number | null;
}

export interface LivingConditionsGroupStats {
  medianEquivalisedIncomeEur: number | null;
  meanEquivalisedIncomeEur: number | null;
  atRiskOfPovertyPct: number | null;
}

export interface DefinitionYearSlice {
  demographics: Partial<Record<PopulationGroupKey, DemographicGroupStats>> | null;
  laborMarket: Partial<Record<PopulationGroupKey, LaborGroupStats>> | null;
}

export interface NationalityAnnualRecord {
  year: string;
  naturalizations: number | null;
  definitions: Record<PopulationDefinition, DefinitionYearSlice>;
  livingConditions: Partial<Record<PopulationGroupKey, LivingConditionsGroupStats>> | null;
}

export interface DataPoint {
  year: string;
  value: number;
  date?: string;
}

export type MetricSeriesPoint = DataPoint;

export interface SourceInfo {
  institution: string;
  title: string;
  url: string;
  shortName?: string;
  tableId?: string;
  period?: string;
  lastUpdated?: string;
}

export type MetricSource = SourceInfo;

export interface TraceableSource {
  sources?: SourceInfo[];
  source?: SourceInfo;
}

export interface BaseEntityItem {
  id: string;
  category: Category;
  question: string;
  unit: string;
  name?: string;
  state?: string;
}

export interface KeyConceptCard {
  id: string;
  badge: string;
  title: string;
  summary: string;
  example?: string;
}

export interface GlossaryCategory {
  id: string;
  label: string;
}

export interface GlossaryTerm {
  code: string;
  displayCode: string;
  categoryId: string;
  title: string;
  shortDefinition: string;
  explanation: string;
  keyNote?: string;
  relatedCodes?: string[];
}

export interface ConceptGuide {
  title: string;
  subtitle: string;
  quickKeys: KeyConceptCard[];
  categories: GlossaryCategory[];
  terms: GlossaryTerm[];
}

export interface DatoItem extends BaseEntityItem, TraceableSource {
  chartType: ChartType;
  dataPoints: DataPoint[];
  contextNotes: string[];
  conceptGuide?: ConceptGuide;
  last_updated?: string;
  metrics?: Record<string, unknown>;
}

export type CountyDetail = DatoItem;

export interface ItemIndexItem extends BaseEntityItem {
  latestValue: number;
  latestYear: string;
  lastUpdated: string;
  latest_summary?: Record<string, number>;
}

export type CountyIndexItem = ItemIndexItem;

export interface MetricMeta {
  title: string;
  unit: string;
  description?: string;
  source?: MetricSource;
}

export interface GlobalMetadata {
  last_updated: string;
  metrics?: Record<string, MetricMeta>;
  categories?: Category[];
  total_items?: number;
}

export interface RegionalBlockData {
  total: number;
  countries: Record<string, number>;
}

export interface AnnualBlock {
  year: string;
  total: number;
  blocks: Record<string, RegionalBlockData>;
}

export interface ImmigrationItem extends TraceableSource {
  id: string;
  category?: Category | string;
  question?: string;
  unit?: string;
  blocks: Array<{
    id: string;
    name: string;
    color: string;
    countries: Array<{ id: string; name: string }>;
  }>;
  annualBlocks: AnnualBlock[];
}

export type FiscalUnitId = "MIO_EUR" | "PC_GDP";

export interface FiscalUnitOption {
  id: FiscalUnitId;
  label: string;
  decimals?: number;
}

export interface FiscalTaxonomyChild {
  code: string;
  label: string;
}

export interface FiscalRevenueTaxon {
  code: string;
  label: string;
  shortLabel: string;
  derivedFormula?: string;
  children: FiscalTaxonomyChild[];
}

export interface FiscalExpenditureTaxon {
  code: string;
  label: string;
  shortLabel: string;
  highlights: FiscalTaxonomyChild[];
}

export interface FiscalTaxonomy {
  revenues: FiscalRevenueTaxon[];
  expenditures: FiscalExpenditureTaxon[];
}

export interface FiscalTotals {
  revenue: number;
  expenditure: number;
  balance: number;
  uncollectibleAdjustment?: number;
}

export interface FiscalRevenueEntry {
  total: number;
  breakdown: Record<string, number>;
}

export interface FiscalExpenditureEntry {
  total: number;
  highlights: Record<string, number>;
}

export interface FiscalUnitMetrics {
  totals: FiscalTotals;
  revenues: Record<string, FiscalRevenueEntry>;
  expenditures: Record<string, FiscalExpenditureEntry> | null;
}

export interface AnnualBalanceRecord {
  year: string;
  cofogAvailable: boolean;
  metrics: Record<FiscalUnitId, FiscalUnitMetrics>;
}

export interface FiscalBalanceItem extends DatoItem {
  chartType: "fiscal-balance";
  availableUnits: FiscalUnitOption[];
  taxonomy: FiscalTaxonomy;
  annualBalances: AnnualBalanceRecord[];
}

export function isFiscalBalanceItem(item: DatoItem): item is FiscalBalanceItem {
  return (
    item.chartType === "fiscal-balance" &&
    "annualBalances" in item &&
    Array.isArray((item as Partial<FiscalBalanceItem>).annualBalances)
  );
}

export interface NationalityIndicatorsItem extends DatoItem {
  chartType: "nationality-indicators";
  annualRecords: NationalityAnnualRecord[];
}

export function isNationalityIndicatorsItem(
  item: DatoItem
): item is NationalityIndicatorsItem {
  return (
    item.chartType === "nationality-indicators" &&
    "annualRecords" in item &&
    Array.isArray((item as Partial<NationalityIndicatorsItem>).annualRecords)
  );
}
