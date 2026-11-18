export const CATEGORIES = [
  "Todas",
  "Vivienda",
  "Economía y Empleo",
  "Sanidad",
  "Pensiones y Demografía",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type ChartType = "line" | "bar";

export interface DataPoint {
  year: string;
  value: number;
  date?: string;
}

export type MetricSeriesPoint = DataPoint;

export interface MetricSource {
  institution: string;
  url: string;
  lastUpdated?: string;
}

export interface SourceInfo extends MetricSource {
  title?: string;
  shortName?: string;
  tableId?: string;
  period?: string;
}

export interface TraceableSource {
  source?: SourceInfo;
  sources?: SourceInfo[];
}

export interface BaseEntityItem {
  id: string;
  category: Category;
  question: string;
  unit: string;
  name?: string;
  state?: string;
}

export interface DatoItem extends BaseEntityItem, TraceableSource {
  chartType: ChartType;
  dataPoints: DataPoint[];
  contextNotes: string[];
  last_updated?: string;
  metrics?: Record<string, any>;
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
