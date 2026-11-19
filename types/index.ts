export * from "@/src/domain/indicator.schema";

export const CATEGORIES = [
  "Todas",
  "Vivienda",
  "Economía y Empleo",
  "Sanidad",
  "Pensiones y Demografía",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type Lang = "es" | "en";

export type ChartType = "line" | "bar" | "fiscal-balance" | "immigration-flow";

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

// Specific domain types for Immigration series
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
