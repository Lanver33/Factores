import fs from "node:fs";
import path from "node:path";
import {
  IndicatorSchema,
  type Indicator,
  type DirectoryIndexItem,
  type Locale,
  type DatoItem,
  type ItemIndexItem,
  type GlobalMetadata,
  type Category,
  type SourceInfo,
} from "./types";

function getDataDir(): string {
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, "frontend", "data", "datasets"))) {
    return path.join(cwd, "frontend", "data");
  }
  if (fs.existsSync(path.join(cwd, "data", "datasets"))) {
    return path.join(cwd, "data");
  }
  return path.join(cwd, "frontend", "data");
}

export function loadIndicatorSync(slug: string, requestedLang?: Locale): Indicator | null {
  if (!slug || slug === "_none" || !/^[a-z0-9-]+$/.test(slug)) {
    return null;
  }

  const dataDir = getDataDir();
  const datasetPath = path.join(dataDir, "datasets", `${slug}.json`);
  if (!fs.existsSync(datasetPath)) {
    return null;
  }

  try {
    const rawData = JSON.parse(fs.readFileSync(datasetPath, "utf-8"));
    const esPath = path.join(dataDir, "locales", "es", `${slug}.json`);
    const enPath = path.join(dataDir, "locales", "en", `${slug}.json`);

    const esText = fs.existsSync(esPath) ? JSON.parse(fs.readFileSync(esPath, "utf-8")) : {};
    const enText = fs.existsSync(enPath) ? JSON.parse(fs.readFileSync(enPath, "utf-8")) : {};

    const sources = (rawData.sources || []).map((src: any, idx: number) => {
      const esSrc = Array.isArray(esText.sources) ? esText.sources[idx] : esText.sources?.[src.id];
      const enSrc = Array.isArray(enText.sources) ? enText.sources[idx] : enText.sources?.[src.id];
      return {
        ...src,
        institution: {
          es: esSrc?.institution || (typeof src.institution === "string" ? src.institution : "Fuente Oficial"),
          en: enSrc?.institution || esSrc?.institution || (typeof src.institution === "string" ? src.institution : "Official Source"),
        },
        title: {
          es: esSrc?.title || (typeof src.title === "string" ? src.title : "Fuente Oficial"),
          en: enSrc?.title || esSrc?.title || (typeof src.title === "string" ? src.title : "Official Source"),
        },
        shortName: (esSrc?.shortName || enSrc?.shortName || src.shortName) ? {
          es: esSrc?.shortName || (typeof src.shortName === "string" ? src.shortName : esSrc?.title || "Fuente Oficial"),
          en: enSrc?.shortName || enSrc?.title || esSrc?.shortName || (typeof src.shortName === "string" ? src.shortName : "Official Source"),
        } : undefined,
      };
    });

    const merged = {
      ...rawData,
      question: {
        es: esText.question || rawData.question?.es || "",
        en: enText.question || esText.question || rawData.question?.en || "",
      },
      unit: {
        es: esText.unit || rawData.unit?.es || "",
        en: enText.unit || esText.unit || rawData.unit?.en || "",
      },
      contextNotes: {
        es: esText.contextNotes || rawData.contextNotes?.es || [],
        en: enText.contextNotes || esText.contextNotes || rawData.contextNotes?.en || [],
      },
      sources,
      conceptGuide: esText.conceptGuide || enText.conceptGuide || rawData.conceptGuide,
    };

    const result = IndicatorSchema.safeParse(merged);
    if (!result.success) {
      console.error(`[loadIndicatorSync] Invalid schema for indicator ${slug}:`, result.error);
      return null;
    }

    return result.data;
  } catch (err) {
    console.error(`[loadIndicatorSync] Failed to load indicator ${slug}:`, err);
    return null;
  }
}

export async function getAllIndicatorSlugs(): Promise<string[]> {
  try {
    const dataDir = getDataDir();
    const datasetsDir = path.join(dataDir, "datasets");
    if (fs.existsSync(datasetsDir)) {
      const files = fs.readdirSync(datasetsDir).filter((f) => f.endsWith(".json"));
      return files.map((f) => f.replace(/\.json$/, ""));
    }
  } catch (err) {
    console.error("[getAllIndicatorSlugs] Error listing indicator files:", err);
  }
  return [];
}

export async function getDirectoryIndex(lang: Locale = "es"): Promise<DirectoryIndexItem[]> {
  const slugs = await getAllIndicatorSlugs();
  const items: DirectoryIndexItem[] = [];

  for (const slug of slugs) {
    const indicator = loadIndicatorSync(slug, lang);
    if (!indicator) continue;

    let latestValue = 0;
    let latestPeriod = "";
    let timeHorizon = "";
    let sparkline: number[] = [];

    if (indicator.kind === "time-series") {
      const first = indicator.points[0];
      const last = indicator.points[indicator.points.length - 1];
      latestPeriod = last.period;
      latestValue = last.value;
      timeHorizon = indicator.points.length > 1 ? `${first.period}–${last.period}` : last.period;
      sparkline = indicator.points.map((p) => p.value);
    } else if (indicator.kind === "fiscal-balance") {
      if ((indicator as any).annualBalances && (indicator as any).annualBalances.length > 0) {
        const balances = (indicator as any).annualBalances;
        const first = balances[0];
        const last = balances[balances.length - 1];
        latestPeriod = last.year;
        latestValue = last.metrics?.PC_GDP?.totals?.balance ?? 0;
        timeHorizon = balances.length > 1 ? `${first.year}–${last.year}` : last.year;
        sparkline = balances.map((b: any) => b.metrics?.PC_GDP?.totals?.balance ?? 0);
      }
    } else if (indicator.kind === "immigration-flow") {
      if ((indicator as any).years && (indicator as any).years.length > 0) {
        const first = (indicator as any).years[0];
        const last = (indicator as any).years[(indicator as any).years.length - 1];
        latestPeriod = last.year;
        latestValue = last.declaredTotal;
        timeHorizon = (indicator as any).years.length > 1 ? `${first.year}–${last.year}` : last.year;
        sparkline = (indicator as any).years.map((y: any) => y.declaredTotal);
      } else if ((indicator as any).annualBlocks && (indicator as any).annualBlocks.length > 0) {
        const blocks = (indicator as any).annualBlocks;
        const first = blocks[0];
        const last = blocks[blocks.length - 1];
        latestPeriod = last.year;
        latestValue = last.total;
        timeHorizon = blocks.length > 1 ? `${first.year}–${last.year}` : last.year;
        sparkline = blocks.map((b: any) => b.total);
      }
    } else if (indicator.kind === "nationality-indicators") {
      const records = (indicator as any).annualRecords;
      const first = records[0];
      const last = records[records.length - 1];
      latestPeriod = last.year;
      latestValue = last.definitions?.citizenship?.demographics?.foreigners?.shareOfTotalPct ?? 0;
      timeHorizon = records.length > 1 ? `${first.year}–${last.year}` : last.year;
      sparkline = records.map((r: any) => r.definitions?.citizenship?.demographics?.foreigners?.shareOfTotalPct ?? 0);
    } else if (indicator.kind === "admin-registers-nationality") {
      const pts = indicator.dataPoints ?? [];
      const records = indicator.annualRecords;
      if (pts.length > 0) {
        const first = pts[0];
        const last = pts[pts.length - 1];
        latestPeriod = last.year;
        latestValue = last.value;
        timeHorizon = pts.length > 1 ? `${first.year}–${last.year}` : last.year;
        sparkline = pts.map((p) => p.value);
      } else if (records && records.length > 0) {
        latestPeriod = records[records.length - 1].year;
        timeHorizon = records.length > 1 ? `${records[0].year}–${latestPeriod}` : latestPeriod;
      }
    }

    items.push({
      id: indicator.id,
      kind: indicator.kind,
      category: indicator.category,
      question: indicator.question,
      unit: indicator.unit,
      valueFormat: indicator.valueFormat,
      latestValue,
      latestPeriod,
      timeHorizon,
      primarySource: {
        es: indicator.sources[0]?.institution.es || "",
        en: indicator.sources[0]?.institution.en || "",
      },
      searchSummary: {
        es: indicator.contextNotes.es[0] ?? indicator.question.es,
        en: indicator.contextNotes.en[0] ?? indicator.question.en,
      },
      sparkline,
    });
  }

  return items;
}

export async function getIndicatorBySlug(slug: string, lang: Locale = "es"): Promise<Indicator | null> {
  return loadIndicatorSync(slug, lang);
}

export async function fetchItemDetail(id: string, lang: Locale = "es"): Promise<DatoItem | null> {
  const indicator = loadIndicatorSync(id, lang);
  if (!indicator) return null;

  const sourcesList: SourceInfo[] = indicator.sources.map((s) => ({
    institution: s.institution[lang] || s.institution.es,
    title: s.title[lang] || s.title.es,
    url: s.url || "#",
    shortName: s.shortName ? (s.shortName[lang] || s.shortName.es) : undefined,
    tableId: s.tableId,
    period: s.period,
    lastUpdated: s.lastUpdated,
  }));

  return {
    ...indicator,
    question: indicator.question[lang] || indicator.question.es,
    unit: indicator.unit[lang] || indicator.unit.es,
    contextNotes: indicator.contextNotes[lang] || indicator.contextNotes.es,
    chartType: indicator.kind as any,
    sources: sourcesList,
    dataPoints: (indicator as any).dataPoints || [],
  } as DatoItem;
}

export async function fetchMetadata(lang: Locale = "es"): Promise<GlobalMetadata> {
  const slugs = await getAllIndicatorSlugs();
  return {
    last_updated: new Date().toISOString().split("T")[0],
    total_items: slugs.length,
  };
}

export async function fetchItems(lang: Locale = "es"): Promise<ItemIndexItem[]> {
  const dirIndex = await getDirectoryIndex(lang);
  return dirIndex.map((item) => ({
    id: item.id,
    category: item.category,
    question: item.question[lang] || item.question.es,
    unit: item.unit[lang] || item.unit.es,
    latestValue: item.latestValue,
    latestYear: item.latestPeriod,
    lastUpdated: new Date().toISOString().split("T")[0],
  }));
}
