export type Category = 
  | "Todas"
  | "Vivienda"
  | "Economía y Empleo"
  | "Sanidad"
  | "Pensiones y Demografía";

export interface DataPoint {
  year: string;
  value: number;
}

export interface SourceInfo {
  institution: string;
  lastUpdated: string;
  url: string;
}

export interface DatoItem {
  id: string;
  category: "Vivienda" | "Economía y Empleo" | "Sanidad" | "Pensiones y Demografía";
  question: string;
  chartType: "line" | "bar";
  unit: string;
  dataPoints: DataPoint[];
  contextNotes: string[];
  source: SourceInfo;
}
