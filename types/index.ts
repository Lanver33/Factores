export type Category =
  | "Todas"
  | "Vivienda"
  | "Economía y Empleo"
  | "Sanidad"
  | "Pensiones y Demografía";

export interface DataPoint {
  year: string;
  value: number;
  date?: string;
}

export type MetricSeriesPoint = DataPoint;

export interface SourceInfo {
  institution: string;
  lastUpdated?: string;
  url: string;
}

export interface DatoItem {
  id: string;
  category: Category;
  question: string;
  chartType: "line" | "bar";
  unit: string;
  dataPoints: DataPoint[];
  contextNotes: string[];
  source: SourceInfo;
  last_updated?: string;
  name?: string;
  state?: string;
  metrics?: Record<string, any>;
}

export type CountyDetail = DatoItem;

export interface ItemIndexItem {
  id: string;
  category: Category;
  question: string;
  unit: string;
  latestValue: number;
  latestYear: string;
  lastUpdated: string;
  name?: string;
  state?: string;
  latest_summary?: Record<string, number>;
}

export type CountyIndexItem = ItemIndexItem;

export interface MetricSource {
  institution: string;
  url: string;
  lastUpdated?: string;
}

export interface MetricMeta {
  title: string;
  unit: string;
  description?: string;
  source?: MetricSource;
}

export interface GlobalMetadata {
  last_updated: string;
  metrics?: Record<string, MetricMeta>;
  categories?: string[];
  total_items?: number;
}
