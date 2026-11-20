import type {
  AnnualBalanceRecord,
  FiscalUnitId,
  FiscalTaxonomy,
  FiscalUnitMetrics,
  Lang,
} from "@/lib/types";
import { getTaxonColor, DEFICIT_BRIDGE, SURPLUS_BRIDGE, REVENUE_COLOR, EXPENDITURE_COLOR } from "./fiscalPalette";

export interface AnatomyChildItem {
  code: string;
  label: string;
  value: number;
  shareOfParentPct: number;
  shareOfTotalPct: number;
}

export interface AnatomyItem {
  code: string;
  label: string;
  shortLabel: string;
  value: number;
  sharePct: number;
  children: AnatomyChildItem[];
}

export interface BridgeItem {
  side: "revenues" | "expenditures";
  type: "deficit" | "surplus";
  value: number;
  sharePct: number;
}

export interface AnatomyBreakdownResult {
  revenues: AnatomyItem[];
  expenditures: AnatomyItem[];
  bridgeItem: BridgeItem | null;
  uncollectibleAdjustment: number | null;
  cofogAvailable: boolean;
}

export interface EraComparisonItem {
  code: string;
  label: string;
  shortLabel: string;
  valueA: number;
  valueB: number;
  delta: number;
  sharePctA: number;
  sharePctB: number;
}

export interface EraComparisonResult {
  items: EraComparisonItem[];
  maxAbsDelta: number;
  missingCofogYears: string[];
}

export interface SankeyNode {
  id: string;
  code: string;
  label: string;
  shortLabel: string;
  value: number;
  sharePct: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  column: 0 | 1 | 2;
  subNotes?: string[];
  isBridge?: boolean;
}

export interface SankeyLink {
  id: string;
  sourceId: string;
  targetId: string;
  value: number;
  color: string;
  path: string;
}

export interface SankeyGraphResult {
  nodes: SankeyNode[];
  links: SankeyLink[];
  cofogAvailable: boolean;
}

/**
 * Returns chronologically sorted list of years (ascending).
 */
export function getAvailableYears(balances: AnnualBalanceRecord[]): string[] {
  if (!balances || balances.length === 0) return [];
  return balances
    .map((b) => b.year)
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
}

/**
 * Scans from newest to oldest and returns latest year where cofogAvailable === true and metrics exist.
 */
export function getLatestCofogYear(balances: AnnualBalanceRecord[]): string | null {
  if (!balances || balances.length === 0) return null;
  const sorted = [...balances].sort((a, b) => parseInt(b.year, 10) - parseInt(a.year, 10));
  for (const b of sorted) {
    if (b.cofogAvailable && b.metrics?.PC_GDP?.expenditures !== null) {
      return b.year;
    }
  }
  return null;
}

/**
 * Finds requested record and its unit metrics + previous year metrics for YoY calculations.
 */
export function getYearMetrics(
  balances: AnnualBalanceRecord[],
  year: string,
  unit: FiscalUnitId
): { record: AnnualBalanceRecord; metrics: FiscalUnitMetrics; prevMetrics: FiscalUnitMetrics | null } | null {
  if (!balances || balances.length === 0) return null;
  const sorted = [...balances].sort((a, b) => parseInt(a.year, 10) - parseInt(b.year, 10));

  let idx = sorted.findIndex((b) => b.year === year);
  if (idx === -1) {
    idx = sorted.length - 1; // Fallback to latest
  }

  const record = sorted[idx];
  const metrics = record.metrics[unit];
  const prevMetrics = idx > 0 ? sorted[idx - 1].metrics[unit] : null;

  return { record, metrics, prevMetrics };
}

/**
 * Formats a fiscal numeric value based on unit (PC_GDP or MIO_EUR) and locale.
 */
export function formatFiscalValue(
  value: number,
  unit: FiscalUnitId,
  lang: Lang = "es",
  opts?: { signed?: boolean; compact?: boolean }
): string {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return "—";
  }

  const isEs = lang === "es";

  if (unit === "PC_GDP") {
    const formattedNum = Math.abs(value).toLocaleString(isEs ? "es-ES" : "en-US", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    const unitSuffix = isEs ? "% PIB" : "% GDP";
    const sign = value < 0 ? "-" : opts?.signed && value > 0 ? "+" : "";
    return `${sign}${formattedNum} ${unitSuffix}`;
  }

  // unit === "MIO_EUR"
  // Eurostat MIO_EUR values are already in millions of euros (e.g. 661500 = 661,5 MM€).
  const absVal = Math.abs(value);
  const sign = value < 0 ? "-" : opts?.signed && value > 0 ? "+" : "";

  if (opts?.compact && absVal >= 1000) {
    const billions = absVal / 1000;
    const formattedB = billions.toLocaleString(isEs ? "es-ES" : "en-US", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    return isEs ? `${sign}${formattedB} MM€` : `${sign}€${formattedB}B`;
  }

  const formattedM = Math.round(absVal).toLocaleString(isEs ? "es-ES" : "en-US");
  return isEs ? `${sign}${formattedM} M€` : `${sign}€${formattedM}M`;
}

/**
 * Formats a YoY or era delta value with explicit sign.
 */
export function formatFiscalDelta(
  delta: number,
  unit: FiscalUnitId,
  lang: Lang = "es"
): string {
  if (delta === undefined || delta === null || !Number.isFinite(delta)) {
    return "—";
  }

  const isEs = lang === "es";
  const sign = delta > 0 ? "+" : delta < 0 ? "-" : "";

  if (unit === "PC_GDP") {
    const abs = Math.abs(delta).toLocaleString(isEs ? "es-ES" : "en-US", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    return `${sign}${abs} pp`;
  }

  // MIO_EUR
  const absVal = Math.abs(delta);
  if (absVal >= 1000) {
    const billions = (absVal / 1000).toLocaleString(isEs ? "es-ES" : "en-US", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    return isEs ? `${sign}${billions} MM€` : `${sign}€${billions}B`;
  }

  const millions = Math.round(absVal).toLocaleString(isEs ? "es-ES" : "en-US");
  return isEs ? `${sign}${millions} M€` : `${sign}€${millions}M`;
}

/**
 * Builds array of macro time series points for Layer 1.
 */
export function buildMacroTimeSeries(
  balances: AnnualBalanceRecord[],
  unit: FiscalUnitId
) {
  if (!balances) return [];
  const sorted = [...balances].sort((a, b) => parseInt(a.year, 10) - parseInt(b.year, 10));
  return sorted.map((b) => {
    const m = b.metrics[unit];
    const revenue = m.totals.revenue;
    const expenditure = m.totals.expenditure;
    const balance = m.totals.balance;
    return {
      year: b.year,
      revenue,
      expenditure,
      balance,
      isSurplus: balance >= 0,
      cofogAvailable: b.cofogAvailable,
    };
  });
}

/**
 * Builds stacked composition series for Recharts AreaChart.
 */
export function buildCompositionSeries(
  balances: AnnualBalanceRecord[],
  taxonomy: FiscalTaxonomy,
  side: "revenues" | "expenditures",
  unit: FiscalUnitId,
  scaleMode: "unit" | "percent"
) {
  if (!balances || !taxonomy) return [];
  const sorted = [...balances].sort((a, b) => parseInt(a.year, 10) - parseInt(b.year, 10));
  const taxa = taxonomy[side];

  return sorted.map((b) => {
    const m = b.metrics[unit];
    const row: Record<string, any> = { year: b.year };

    if (side === "expenditures" && (!b.cofogAvailable || !m.expenditures)) {
      taxa.forEach((t) => {
        row[t.code] = null;
      });
    } else {
      const dataMap = side === "revenues" ? m.revenues : m.expenditures;
      const columnTotal = side === "revenues" ? m.totals.revenue : m.totals.expenditure;

      taxa.forEach((t) => {
        const entry = dataMap ? dataMap[t.code] : null;
        if (!entry || entry.total === undefined || entry.total === null) {
          row[t.code] = null;
        } else {
          row[t.code] =
            scaleMode === "percent" && columnTotal > 0
              ? (entry.total / columnTotal) * 100
              : entry.total;
        }
      });
    }

    return row;
  });
}

/**
 * Builds top-level breakdown for Layer 2 Anatomy Split view.
 */
export function buildAnatomyBreakdown(
  record: AnnualBalanceRecord,
  taxonomy: FiscalTaxonomy,
  unit: FiscalUnitId
): AnatomyBreakdownResult {
  const defaultResult: AnatomyBreakdownResult = {
    revenues: [],
    expenditures: [],
    bridgeItem: null,
    uncollectibleAdjustment: null,
    cofogAvailable: record.cofogAvailable,
  };

  if (!record || !taxonomy) return defaultResult;
  const metrics = record.metrics[unit];
  if (!metrics) return defaultResult;

  const totalRev = metrics.totals.revenue;
  const totalExp = metrics.totals.expenditure;
  const balance = metrics.totals.balance;

  // 1. Revenues Breakdown
  const revenues: AnatomyItem[] = taxonomy.revenues
    .map((taxon) => {
      const entry = metrics.revenues ? metrics.revenues[taxon.code] : null;
      const val = entry?.total ?? 0;
      const sharePct = totalRev > 0 ? (val / totalRev) * 100 : 0;

      const children: AnatomyChildItem[] = taxon.children.map((child) => {
        const childVal = entry?.breakdown ? entry.breakdown[child.code] ?? 0 : 0;
        return {
          code: child.code,
          label: child.label,
          value: childVal,
          shareOfParentPct: val > 0 ? (childVal / val) * 100 : 0,
          shareOfTotalPct: totalRev > 0 ? (childVal / totalRev) * 100 : 0,
        };
      });

      return {
        code: taxon.code,
        label: taxon.label,
        shortLabel: taxon.shortLabel,
        value: val,
        sharePct,
        children,
      };
    })
    .sort((a, b) => b.value - a.value);

  // 2. Expenditures Breakdown
  let expenditures: AnatomyItem[] = [];
  if (record.cofogAvailable && metrics.expenditures) {
    expenditures = taxonomy.expenditures
      .map((taxon) => {
        const entry = metrics.expenditures ? metrics.expenditures[taxon.code] : null;
        const val = entry?.total ?? 0;
        const sharePct = totalExp > 0 ? (val / totalExp) * 100 : 0;

        const children: AnatomyChildItem[] = taxon.highlights.map((child) => {
          const childVal = entry?.highlights ? entry.highlights[child.code] ?? 0 : 0;
          return {
            code: child.code,
            label: child.label,
            value: childVal,
            shareOfParentPct: val > 0 ? (childVal / val) * 100 : 0,
            shareOfTotalPct: totalExp > 0 ? (childVal / totalExp) * 100 : 0,
          };
        });

        return {
          code: taxon.code,
          label: taxon.label,
          shortLabel: taxon.shortLabel,
          value: val,
          sharePct,
          children,
        };
      })
      .sort((a, b) => b.value - a.value);
  }

  // 3. Accounting Bridge Item
  let bridgeItem: BridgeItem | null = null;
  if (balance < 0) {
    // Deficit: added to Revenue side to balance
    const absDef = Math.abs(balance);
    bridgeItem = {
      side: "revenues",
      type: "deficit",
      value: absDef,
      sharePct: totalRev > 0 ? (absDef / totalRev) * 100 : 0,
    };
  } else if (balance > 0) {
    // Surplus: added to Expenditure side to balance
    bridgeItem = {
      side: "expenditures",
      type: "surplus",
      value: balance,
      sharePct: totalExp > 0 ? (balance / totalExp) * 100 : 0,
    };
  }

  const uncollectibleAdjustment =
    Math.abs(metrics.totals.uncollectibleAdjustment ?? 0) > 0.05
      ? metrics.totals.uncollectibleAdjustment ?? null
      : null;

  return {
    revenues,
    expenditures,
    bridgeItem,
    uncollectibleAdjustment,
    cofogAvailable: record.cofogAvailable,
  };
}

/**
 * Computes era comparison between Year A and Year B.
 */
export function computeEraComparison(
  balances: AnnualBalanceRecord[],
  taxonomy: FiscalTaxonomy,
  yearA: string,
  yearB: string,
  side: "revenues" | "expenditures",
  unit: FiscalUnitId
): EraComparisonResult {
  const missingCofogYears: string[] = [];

  const recA = balances.find((b) => b.year === yearA);
  const recB = balances.find((b) => b.year === yearB);

  if (!recA || !recB || !taxonomy) {
    return { items: [], maxAbsDelta: 0, missingCofogYears };
  }

  if (side === "expenditures") {
    if (!recA.cofogAvailable) missingCofogYears.push(yearA);
    if (!recB.cofogAvailable) missingCofogYears.push(yearB);
  }

  if (missingCofogYears.length > 0) {
    return { items: [], maxAbsDelta: 0, missingCofogYears };
  }

  const metricsA = recA.metrics[unit];
  const metricsB = recB.metrics[unit];
  const dataA = side === "revenues" ? metricsA.revenues : metricsA.expenditures;
  const dataB = side === "revenues" ? metricsB.revenues : metricsB.expenditures;
  const totalA = side === "revenues" ? metricsA.totals.revenue : metricsA.totals.expenditure;
  const totalB = side === "revenues" ? metricsB.totals.revenue : metricsB.totals.expenditure;

  const taxa = taxonomy[side];

  let maxAbsDelta = 0;

  const items: EraComparisonItem[] = taxa.map((taxon) => {
    const valA = dataA?.[taxon.code]?.total ?? 0;
    const valB = dataB?.[taxon.code]?.total ?? 0;
    const delta = valB - valA;
    if (Math.abs(delta) > maxAbsDelta) {
      maxAbsDelta = Math.abs(delta);
    }
    return {
      code: taxon.code,
      label: taxon.label,
      shortLabel: taxon.shortLabel,
      valueA: valA,
      valueB: valB,
      delta,
      sharePctA: totalA > 0 ? (valA / totalA) * 100 : 0,
      sharePctB: totalB > 0 ? (valB / totalB) * 100 : 0,
    };
  });

  items.sort((a, b) => b.delta - a.delta);

  return { items, maxAbsDelta, missingCofogYears };
}

/**
 * Pure deterministic SVG geometry calculator for 3-Column Sankey Diagram.
 */
export function buildSankeyGraph(
  record: AnnualBalanceRecord,
  taxonomy: FiscalTaxonomy,
  unit: FiscalUnitId,
  width: number,
  height: number
): SankeyGraphResult {
  if (!record || !taxonomy || !record.cofogAvailable || !record.metrics[unit].expenditures) {
    return { nodes: [], links: [], cofogAvailable: false };
  }

  const metrics = record.metrics[unit];
  const totalRev = metrics.totals.revenue;
  const totalExp = metrics.totals.expenditure;
  const balance = metrics.totals.balance;

  const nodeWidth = 22;
  const paddingTop = 28;
  const paddingBottom = 28;
  const availableH = height - paddingTop - paddingBottom;
  const nodeGap = 10;

  // Prepare Column 0 (Revenues + Deficit Bridge if B.9 < 0)
  type RawSankeyNode = {
    id: string;
    code: string;
    label: string;
    shortLabel: string;
    value: number;
    sharePct: number;
    color: string;
    column: 0 | 1 | 2;
    subNotes: string[];
    isBridge?: boolean;
  };

  const rawRevNodes: RawSankeyNode[] = taxonomy.revenues
    .map((t) => {
      const val = metrics.revenues?.[t.code]?.total ?? 0;
      const subNotes: string[] = [];
      const entry = metrics.revenues?.[t.code];
      if (entry?.breakdown) {
        Object.entries(entry.breakdown).forEach(([c, v]) => {
          const childMeta = t.children.find((ch) => ch.code === c);
          if (childMeta && v > 0) {
            subNotes.push(`${childMeta.label.split("(")[0].trim()}: ${v}`);
          }
        });
      }
      return {
        id: `node-rev-${t.code}`,
        code: t.code,
        label: t.label,
        shortLabel: t.shortLabel,
        value: val,
        sharePct: totalRev > 0 ? (val / totalRev) * 100 : 0,
        color: getTaxonColor(t.code),
        column: 0 as const,
        subNotes,
      };
    })
    .sort((a, b) => b.value - a.value);

  if (balance < 0) {
    const absDef = Math.abs(balance);
    rawRevNodes.push({
      id: "node-bridge-deficit",
      code: "DEFICIT_BRIDGE",
      label: "Necesidad de financiación (Déficit B.9)",
      shortLabel: "Déficit B.9",
      value: absDef,
      sharePct: totalRev > 0 ? (absDef / totalRev) * 100 : 0,
      color: DEFICIT_BRIDGE,
      column: 0 as const,
      subNotes: ["Financiación mediante endeudamiento neto"],
      isBridge: true,
    });
  }

  const col0Total = rawRevNodes.reduce((sum, n) => sum + n.value, 0);

  // Layout Column 0
  const col0Gaps = (rawRevNodes.length - 1) * nodeGap;
  const col0HeightBudget = availableH - col0Gaps;

  let currentY0 = paddingTop;
  const col0Nodes: SankeyNode[] = rawRevNodes.map((n) => {
    const nodeH = col0Total > 0 ? Math.max(8, (n.value / col0Total) * col0HeightBudget) : 8;
    const node: SankeyNode = {
      ...n,
      x: 0,
      y: currentY0,
      width: nodeWidth,
      height: nodeH,
    };
    currentY0 += nodeH + nodeGap;
    return node;
  });

  // Prepare Column 2 (Expenditures + Surplus Bridge if B.9 > 0)
  const rawExpNodes: RawSankeyNode[] = taxonomy.expenditures
    .map((t) => {
      const val = metrics.expenditures?.[t.code]?.total ?? 0;
      const subNotes: string[] = [];
      const entry = metrics.expenditures?.[t.code];
      if (entry?.highlights) {
        Object.entries(entry.highlights).forEach(([c, v]) => {
          const childMeta = t.highlights.find((ch) => ch.code === c);
          if (childMeta && v > 0) {
            subNotes.push(`${childMeta.label.split("(")[0].trim()}: ${v}`);
          }
        });
      }
      return {
        id: `node-exp-${t.code}`,
        code: t.code,
        label: t.label,
        shortLabel: t.shortLabel,
        value: val,
        sharePct: totalExp > 0 ? (val / totalExp) * 100 : 0,
        color: getTaxonColor(t.code),
        column: 2 as const,
        subNotes,
      };
    })
    .sort((a, b) => b.value - a.value);

  if (balance > 0) {
    rawExpNodes.push({
      id: "node-bridge-surplus",
      code: "SURPLUS_BRIDGE",
      label: "Capacidad de financiación (Superávit B.9)",
      shortLabel: "Superávit B.9",
      value: balance,
      sharePct: totalExp > 0 ? (balance / totalExp) * 100 : 0,
      color: SURPLUS_BRIDGE,
      column: 2 as const,
      subNotes: ["Capacidad neta de desendeudamiento"],
      isBridge: true,
    });
  }

  const col2Total = rawExpNodes.reduce((sum, n) => sum + n.value, 0);

  // Layout Column 2
  const col2Gaps = (rawExpNodes.length - 1) * nodeGap;
  const col2HeightBudget = availableH - col2Gaps;
  const xCol2 = width - nodeWidth;

  let currentY2 = paddingTop;
  const col2Nodes: SankeyNode[] = rawExpNodes.map((n) => {
    const nodeH = col2Total > 0 ? Math.max(8, (n.value / col2Total) * col2HeightBudget) : 8;
    const node: SankeyNode = {
      ...n,
      x: xCol2,
      y: currentY2,
      width: nodeWidth,
      height: nodeH,
    };
    currentY2 += nodeH + nodeGap;
    return node;
  });

  // Column 1 Hub: Central Government S.13
  const hubX = Math.round(width / 2 - nodeWidth / 2);
  const hubNode: SankeyNode = {
    id: "node-hub-s13",
    code: "S13",
    label: "Administraciones Públicas (Consolidado AAPP S.13)",
    shortLabel: "AAPP Consolidado",
    value: Math.max(totalRev, totalExp),
    sharePct: 100,
    x: hubX,
    y: paddingTop,
    width: nodeWidth,
    height: availableH,
    color: "#64748B",
    column: 1,
    subNotes: [
      `Ingresos Totales: ${totalRev}`,
      `Gastos Totales: ${totalExp}`,
      `Saldo Fiscal B.9: ${balance >= 0 ? "+" : ""}${balance}`,
    ],
  };

  const nodes: SankeyNode[] = [...col0Nodes, hubNode, ...col2Nodes];
  const links: SankeyLink[] = [];

  // Left Links: Col 0 -> Col 1 Hub
  let hubLeftY = paddingTop;
  col0Nodes.forEach((srcNode) => {
    const x0 = srcNode.x + srcNode.width;
    const y0 = srcNode.y;
    const h = srcNode.height;
    const x1 = hubNode.x;
    const y1 = hubLeftY;
    const cx = (x0 + x1) / 2;

    const path = `M ${x0} ${y0} C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1} L ${x1} ${y1 + h} C ${cx} ${
      y1 + h
    }, ${cx} ${y0 + h}, ${x0} ${y0 + h} Z`;

    links.push({
      id: `link-left-${srcNode.code}`,
      sourceId: srcNode.id,
      targetId: hubNode.id,
      value: srcNode.value,
      color: srcNode.color,
      path,
    });

    hubLeftY += h;
  });

  // Right Links: Col 1 Hub -> Col 2
  let hubRightY = paddingTop;
  col2Nodes.forEach((tgtNode) => {
    const x0 = hubNode.x + hubNode.width;
    const y0 = hubRightY;
    const h = tgtNode.height;
    const x1 = tgtNode.x;
    const y1 = tgtNode.y;
    const cx = (x0 + x1) / 2;

    const path = `M ${x0} ${y0} C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1} L ${x1} ${y1 + h} C ${cx} ${
      y1 + h
    }, ${cx} ${y0 + h}, ${x0} ${y0 + h} Z`;

    links.push({
      id: `link-right-${tgtNode.code}`,
      sourceId: hubNode.id,
      targetId: tgtNode.id,
      value: tgtNode.value,
      color: tgtNode.color,
      path,
    });

    hubRightY += h;
  });

  return { nodes, links, cofogAvailable: true };
}
