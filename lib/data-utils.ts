import { GlobalMetadata, DatoItem, ItemIndexItem, Category, SourceInfo } from "@/types";

export const DATA_BASE_URL =
  process.env.NEXT_PUBLIC_DATA_BASE_URL || "/data";

const cleanBaseUrl = DATA_BASE_URL.replace(/\/$/, "");

export async function fetchMetadata(lang: "es" | "en" = "es"): Promise<GlobalMetadata> {
  try {
    let res = await fetch(`${cleanBaseUrl}/${lang}/metadata.json`);
    if (!res.ok) {
      res = await fetch(`${cleanBaseUrl}/metadata.json`);
    }
    if (!res.ok) {
      return { last_updated: new Date().toISOString().split("T")[0], total_items: 0 };
    }
    return await res.json();
  } catch (err) {
    console.warn("Could not fetch metadata.json:", err);
    return { last_updated: new Date().toISOString().split("T")[0], total_items: 0 };
  }
}

export async function fetchItems(lang: "es" | "en" = "es"): Promise<ItemIndexItem[]> {
  try {
    let res = await fetch(`${cleanBaseUrl}/${lang}/items.json`);
    if (!res.ok) {
      res = await fetch(`${cleanBaseUrl}/items.json`);
    }
    if (!res.ok) {
      const fallbackRes = await fetch(`${cleanBaseUrl}/counties.json`);
      if (!fallbackRes.ok) return [];
      const counties = await fallbackRes.json();
      return counties.map((c: any) => ({
        id: c.id,
        category: "Economía y Empleo",
        question: c.name,
        unit: "",
        latestValue: c.latest_summary ? Object.values(c.latest_summary)[0] as number : 0,
        latestYear: "2026",
        lastUpdated: c.last_updated || "2026-11-01"
      }));
    }
    return await res.json();
  } catch (err) {
    console.warn("Could not fetch items index:", err);
    return [];
  }
}

export const fetchCounties = fetchItems;

export async function fetchItemDetail(id: string, lang: "es" | "en" = "es"): Promise<DatoItem | null> {
  try {
    let res = await fetch(`${cleanBaseUrl}/${lang}/items/${id}.json`);
    if (!res.ok && lang === "en") {
      // Automatic Fallback to Spanish if English translation is missing
      res = await fetch(`${cleanBaseUrl}/es/items/${id}.json`);
      if (!res.ok) {
        res = await fetch(`${cleanBaseUrl}/items/${id}.json`);
      }
    } else if (!res.ok) {
      res = await fetch(`${cleanBaseUrl}/items/${id}.json`);
    }
    if (!res.ok) {
      res = await fetch(`${cleanBaseUrl}/counties/${id}.json`);
    }
    if (!res.ok) return null;
    const raw = await res.json();

    const normalizeSourcesList = (r: any): SourceInfo[] => {
      if (Array.isArray(r.sources) && r.sources.length > 0) {
        return r.sources.map((s: any) => ({
          institution: s.institution || "Fuente Oficial",
          title: s.title || r.question || "Fuente Oficial de Datos",
          url: s.url || "#",
          shortName: s.shortName,
          tableId: s.tableId,
          period: s.period,
          lastUpdated: s.lastUpdated || r.last_updated || r.lastUpdated
        }));
      }
      if (r.source) {
        return [{
          institution: r.source.institution || "Fuente Oficial",
          title: r.source.title || r.question || "Fuente Oficial de Datos",
          url: r.source.url || "#",
          shortName: r.source.shortName,
          tableId: r.source.tableId,
          period: r.source.period,
          lastUpdated: r.source.lastUpdated || r.last_updated || r.lastUpdated
        }];
      }
      return [{
        institution: "Fuente Oficial",
        title: r.question || "Fuente Oficial de Datos",
        url: "#",
        lastUpdated: r.last_updated || r.lastUpdated
      }];
    };

    if (raw.metrics) {
      const metricKey = Object.keys(raw.metrics)[0];
      const metric = raw.metrics[metricKey];
      return {
        id: raw.county_id || raw.id,
        category: raw.category || "Economía y Empleo",
        question: raw.name || raw.question || metricKey,
        chartType: "line",
        unit: metric?.unit || raw.unit || "",
        dataPoints: (metric?.series || []).map((s: any) => ({
          year: s.date || s.year,
          value: s.value
        })),
        contextNotes: raw.contextNotes || [],
        sources: normalizeSourcesList(raw)
      };
    }

    return {
      ...raw,
      sources: normalizeSourcesList(raw)
    } as DatoItem;
  } catch (err) {
    console.warn(`Could not fetch item detail for ${id}:`, err);
    return null;
  }
}

export const fetchCountyDetail = fetchItemDetail;

export function getAllCategories(): Category[] {
  return [
    "Todas",
    "Vivienda",
    "Economía y Empleo",
    "Sanidad",
    "Pensiones y Demografía",
  ];
}
