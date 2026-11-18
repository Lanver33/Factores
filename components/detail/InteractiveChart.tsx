"use client";

import { useState, useMemo } from "react";
import { MetricSeriesPoint } from "@/types";
import ImmigrationView from "./immigration/ImmigrationView";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

interface RawDataPoint {
  year: string;
  value: number | Array<Record<string, number>>;
}

interface InteractiveChartProps {
  series: MetricSeriesPoint[];
  rawPoints?: RawDataPoint[];
  continentsPoints?: RawDataPoint[];
  chartType?: "line" | "bar" | "fiscal";
  unit: string;
  title?: string;
  item?: any;
}

const ITEM_LABELS: Record<string, string> = {
  // Países
  colombia: "Colombia",
  marruecos: "Marruecos",
  venezuela: "Venezuela",
  peru: "Perú",
  argentina: "Argentina",
  ecuador: "Ecuador",
  rumania: "Rumanía",
  "resto-de-sudamerica": "Resto de Sudamérica",
  "resto-de-centro-america-y-caribe": "Resto de Centro América y Caribe",
  "resto-de-europa": "Resto de Europa",
  "resto-de-africa": "Resto de África",
  "resto-de-asia": "Resto de Asia",
  "resto-de-america-del-norte": "Resto de América del Norte",
  "resto-de-oceania": "Resto de Oceanía",

  // Continentes / Macro-regiones
  "america-latina": "América Latina",
  europa: "Europa",
  africa: "África",
  asia: "Asia",
  "america-del-norte": "América del Norte",
  oceania: "Oceanía",

  // Saldo Fiscal y Nacionalidad
  "ratio-extranjeros": "Población Extranjera",
  "ratio-espanoles": "Población Española",
  "saldo-capita-extranjeros": "Extranjeros (€/hab)",
  "saldo-capita-espanoles": "Españoles (€/hab)",

  // Contabilidad Fine-Grained Estado (IGAE S.13 SEC-2010)
  "contribucion-extranjeros": "Ingresos: Extranjeros",
  "contribucion-espanoles": "Ingresos: Españoles",
  "ingresos-impuesto-sociedades": "Ingresos: Impuesto Sociedades",
  "ingresos-impuestos-especiales": "Ingresos: Impuestos Especiales",
  "ingresos-tasas-precios-publicos": "Ingresos: Tasas y Precios Públicos",
  "ingresos-fondos-ue": "Ingresos: Fondos UE",
  "ingresos-rentas-patrimoniales": "Ingresos: Rentas Patrimoniales",

  "gasto-extranjeros": "Gastos: Extranjeros",
  "gasto-espanoles": "Gastos: Españoles",
  "gastos-intereses-deuda": "Gastos: Intereses Deuda",
  "gastos-defensa-fuerzas-armadas": "Gastos: Defensa y FFAA",
  "gastos-seguridad-ciudadana-justicia": "Gastos: Seguridad y Justicia",
  "gastos-infraestructuras-transportes": "Gastos: Infraestructuras",
  "gastos-medio-ambiente-investigacion": "Gastos: Medio Ambiente e I+D",
  "gastos-servicios-generales-admon": "Gastos: Admon. General",

  "igae-deficit-total": "Déficit / Superávit Real Consolidado",
};

const ITEM_COLORS: Record<string, string> = {
  // Países
  colombia: "#1E40AF",
  marruecos: "#047857",
  venezuela: "#B91C1C",
  peru: "#D97706",
  argentina: "#7C3AED",
  ecuador: "#16A34A",
  rumania: "#0891B2",
  "resto-de-sudamerica": "#3B82F6",
  "resto-de-centro-america-y-caribe": "#F59E0B",
  "resto-de-europa": "#06B6D4",
  "resto-de-africa": "#10B981",
  "resto-de-asia": "#EAB308",
  "resto-de-america-del-norte": "#A855F7",
  "resto-de-oceania": "#94A3B8",

  // Continentes
  "america-latina": "#1E40AF",
  europa: "#0891B2",
  africa: "#047857",
  asia: "#EAB308",
  "america-del-norte": "#7C3AED",
  oceania: "#94A3B8",

  // Saldo Fiscal
  "ratio-extranjeros": "#059669",             // Verde Esmeralda (Superávit)
  "ratio-espanoles": "#64748B",               // Gris Pizarra
  "saldo-capita-extranjeros": "#059669",      // Verde Esmeralda
  "saldo-capita-espanoles": "#64748B",        // Gris Pizarra

  // Ingresos Fine-Grained
  "contribucion-extranjeros": "#059669",      // Verde Esmeralda (Base)
  "contribucion-espanoles": "#1E40AF",        // Azul Marino (Centro)
  "ingresos-impuesto-sociedades": "#7C3AED",  // Violeta
  "ingresos-impuestos-especiales": "#D97706", // Ámbar
  "ingresos-tasas-precios-publicos": "#0891B2",// Turquesa
  "ingresos-fondos-ue": "#475569",            // Gris Pizarra
  "ingresos-rentas-patrimoniales": "#64748B",  // Gris Medio

  // Gastos Fine-Grained
  "gasto-extranjeros": "#34D399",             // Verde Menta (Base)
  "gasto-espanoles": "#60A5FA",              // Azul Cielo (Centro)
  "gastos-intereses-deuda": "#B91C1C",        // Borgoña
  "gastos-defensa-fuerzas-armadas": "#475569",// Gris Pizarra
  "gastos-seguridad-ciudadana-justicia": "#64748B",
  "gastos-infraestructuras-transportes": "#16A34A",
  "gastos-medio-ambiente-investigacion": "#06B6D4",
  "gastos-servicios-generales-admon": "#94A3B8", // Gris Claro

  "igae-deficit-total": "#EAB308",            // Amarillo
};

function formatLabel(slug: string): string {
  if (ITEM_LABELS[slug]) return ITEM_LABELS[slug];
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatSpanishNumber(val: number): string {
  if (Math.abs(val) >= 1_000_000) {
    return `${(val / 1_000_000).toLocaleString("es-ES", { maximumFractionDigits: 2 })}M`;
  }
  return val.toLocaleString("es-ES");
}

function CustomFiscalTooltip({ active, payload, label, fiscalTab }: any) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs max-w-xs space-y-2">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 font-bold">
        <span>Año {label}</span>
        <span className="text-blue-400 font-semibold">
          {fiscalTab === "ratio"
            ? "Ratio Contribución/Gasto"
            : fiscalTab === "capita"
            ? "Saldo Neto (€/hab)"
            : "Balance Total Estado (IGAE S.13)"}
        </span>
      </div>
      <div className="space-y-1.5 text-[11px]">
        {payload.map((entry: any, i: number) => {
          const labelText = formatLabel(entry.dataKey || entry.name);
          const val = Number(entry.value) || 0;
          let displayVal = "";
          if (fiscalTab === "ratio") {
            displayVal = `${val.toFixed(1)}% (${val >= 100 ? "Superávit" : "Déficit"})`;
          } else if (fiscalTab === "capita") {
            displayVal = `${val >= 0 ? "+" : ""}${val.toLocaleString("es-ES")} €/hab`;
          } else {
            displayVal = `${val.toLocaleString("es-ES")} MM€`;
          }

          return (
            <div key={i} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="truncate text-slate-300">{labelText}</span>
              </div>
              <span className="font-semibold text-white tabular-nums">
                {displayVal}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CustomTooltipContent({ active, payload, label, unit }: any) {
  if (!active || !payload || !payload.length) return null;

  const total = payload.reduce(
    (sum: number, entry: any) => sum + (Number(entry.value) || 0),
    0
  );

  return (
    <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs max-w-xs space-y-2">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 font-bold">
        <span>Año {label}</span>
        <span className="text-blue-400 font-extrabold">
          {total.toLocaleString("es-ES")} {unit}
        </span>
      </div>
      <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1 text-[11px]">
        {payload
          .slice()
          .reverse()
          .map((entry: any, i: number) => {
            const labelText = formatLabel(entry.dataKey || entry.name);
            const val = Number(entry.value) || 0;

            return (
              <div key={i} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="truncate text-slate-300">{labelText}</span>
                </div>
                <span className="font-semibold text-white tabular-nums">
                  {val.toLocaleString("es-ES")} {unit}
                </span>
              </div>
            );
          })}
      </div>
    </div>
  );
}

export default function InteractiveChart({
  series,
  rawPoints = [],
  chartType = "line",
  unit,
  title,
  item,
}: InteractiveChartProps) {
  if (item && (item.id === "inmigracion-procedencia" || item.annualBlocks)) {
    return <ImmigrationView item={item} />;
  }
  const isFiscalCard = rawPoints.some((p) =>
    Array.isArray(p.value) && p.value.some((v) => "ratio-extranjeros" in v)
  );

  const [fiscalTab, setFiscalTab] = useState<"ratio" | "capita" | "total">("ratio");
  const [scaleMode, setScaleMode] = useState<"abs" | "percent">("abs");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  // Transformar datos para Recharts
  const { chartData, itemKeys, fiscalAbsData, fiscalPctData } = useMemo(() => {
    if (!rawPoints || rawPoints.length === 0) {
      return { chartData: series, itemKeys: [], fiscalAbsData: [], fiscalPctData: [] };
    }

    const keysSet = new Set<string>();
    const fAbsData: any[] = [];
    const fPctData: any[] = [];
    const cData: any[] = [];

    rawPoints.forEach((p) => {
      const yearStr = String(p.year);
      const row: Record<string, any> = { year: yearStr, date: yearStr };

      if (Array.isArray(p.value)) {
        p.value.forEach((item) => {
          if (item && typeof item === "object") {
            const [k, v] = Object.entries(item)[0] || [];
            if (k && k !== "total" && typeof v === "number") {
              row[k] = v;
              keysSet.add(k);
            }
          }
        });
      }
      cData.push(row);

      const tot_ing = row["igae-ingresos-total"] || 1;
      const tot_gas = row["igae-gastos-total"] || 1;

      const pctRow: Record<string, any> = { year: yearStr, date: yearStr };
      Object.entries(row).forEach(([k, v]) => {
        if (typeof v === "number") {
          if (k.startsWith("contribucion") || k.startsWith("ingresos")) {
            pctRow[k] = (v / tot_ing) * 100;
          } else if (k.startsWith("gasto")) {
            pctRow[k] = (v / tot_gas) * 100;
          } else {
            pctRow[k] = v;
          }
        }
      });

      fAbsData.push(row);
      fPctData.push(pctRow);
    });

    const sortedKeys = Array.from(keysSet);
    return { chartData: cData, itemKeys: sortedKeys, fiscalAbsData: fAbsData, fiscalPctData: fPctData };
  }, [rawPoints, series]);

  if (!series || series.length === 0) {
    return (
      <div className="w-full bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
        Sin datos disponibles.
      </div>
    );
  }

  const firstDate = series[0]?.date || series[0]?.year || "2015";
  const lastDate =
    series[series.length - 1]?.date ||
    series[series.length - 1]?.year ||
    "2024";

  // RENDERIZADO PARA TARJETA DE SALDO FISCAL
  if (isFiscalCard) {
    const activeFiscalData = scaleMode === "percent" ? fiscalPctData : fiscalAbsData;

    return (
      <div className="w-full bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-5">
        {/* Header y Control de Pestañas alineado en UNA SOLA FILA HORIZONTAL */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            {title && <h3 className="text-sm font-bold text-slate-900">{title}</h3>}
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
              {fiscalTab === "ratio"
                ? `1. Comparativa Ratio Contribución / Gasto (%)`
                : fiscalTab === "capita"
                ? `2. Saldo Neto Anual (€ Per Cápita)`
                : `3. Balance Total Estado IGAE S.13 (${scaleMode === "percent" ? "% 100%" : "MM€"} — Categorías Fine-Grained)`}
            </div>
          </div>

          {/* Alineación Horizontal Única de Pestañas */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold gap-0.5">
              <button
                onClick={() => setFiscalTab("ratio")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  fiscalTab === "ratio"
                    ? "bg-white text-blue-700 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                1. Ratio (%)
              </button>
              <button
                onClick={() => setFiscalTab("capita")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  fiscalTab === "capita"
                    ? "bg-white text-blue-700 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                2. Saldo (€/hab)
              </button>
              <button
                onClick={() => setFiscalTab("total")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  fiscalTab === "total"
                    ? "bg-white text-blue-700 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🏛️ 3. Total Estado
              </button>
            </div>

            {/* Conmutador de Escala (MM€ | %) para Pestaña 3 */}
            {fiscalTab === "total" && (
              <div className="inline-flex rounded-xl bg-slate-200/80 p-1 text-xs font-semibold">
                <button
                  onClick={() => setScaleMode("abs")}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    scaleMode === "abs"
                      ? "bg-white text-slate-900 shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  MM€
                </button>
                <button
                  onClick={() => setScaleMode("percent")}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    scaleMode === "percent"
                      ? "bg-white text-slate-900 shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  % 100%
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Gráficos según la Pestaña Seleccionada */}
        <div className="h-80 sm:h-96 w-full touch-pan-y">
          <ResponsiveContainer width="100%" height="100%">
            {fiscalTab === "ratio" ? (
              // PESTAÑA 1: RATIO FISCAL CONTRIBUCIÓN / GASTO (%)
              <LineChart
                data={fiscalAbsData}
                margin={{ top: 10, right: 15, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="year"
                  tickLine={false}
                  axisLine={{ stroke: "#cbd5e1" }}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  dy={6}
                />
                <YAxis
                  width={55}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  domain={[0, 220]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip content={<CustomFiscalTooltip fiscalTab="ratio" unit="%" />} />
                <ReferenceLine
                  y={100}
                  stroke="#94a3b8"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: "100% (Equilibrio Fiscal)",
                    fill: "#64748b",
                    fontSize: 10,
                    position: "insideTopRight",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="ratio-extranjeros"
                  name="Población Extranjera"
                  stroke={ITEM_COLORS["ratio-extranjeros"]}
                  strokeWidth={3}
                  dot={{ r: 5, fill: ITEM_COLORS["ratio-extranjeros"] }}
                  activeDot={{ r: 7 }}
                />
                <Line
                  type="monotone"
                  dataKey="ratio-espanoles"
                  name="Población Española"
                  stroke={ITEM_COLORS["ratio-espanoles"]}
                  strokeWidth={3}
                  dot={{ r: 5, fill: ITEM_COLORS["ratio-espanoles"] }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            ) : fiscalTab === "capita" ? (
              // PESTAÑA 2: SALDO NETO ANUAL (€ PER CÁPITA)
              <LineChart
                data={fiscalAbsData}
                margin={{ top: 10, right: 15, left: 15, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="year"
                  tickLine={false}
                  axisLine={{ stroke: "#cbd5e1" }}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  dy={6}
                />
                <YAxis
                  width={75}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  domain={[-4000, 3000]}
                  tickFormatter={(v) => `${v > 0 ? "+" : ""}${v.toLocaleString("es-ES")} €`}
                />
                <Tooltip content={<CustomFiscalTooltip fiscalTab="capita" unit="€/hab" />} />
                <ReferenceLine
                  y={0}
                  stroke="#94a3b8"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: "0 €/hab (Saldo Neutro)",
                    fill: "#64748b",
                    fontSize: 10,
                    position: "insideTopRight",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="saldo-capita-extranjeros"
                  name="Extranjeros (€/hab)"
                  stroke={ITEM_COLORS["saldo-capita-extranjeros"]}
                  strokeWidth={3}
                  dot={{ r: 5, fill: ITEM_COLORS["saldo-capita-extranjeros"] }}
                  activeDot={{ r: 7 }}
                />
                <Line
                  type="monotone"
                  dataKey="saldo-capita-espanoles"
                  name="Españoles (€/hab)"
                  stroke={ITEM_COLORS["saldo-capita-espanoles"]}
                  strokeWidth={3}
                  dot={{ r: 5, fill: ITEM_COLORS["saldo-capita-espanoles"] }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            ) : (
              // PESTAÑA 3: BALANCE TOTAL ESTADO (FINE-GRAINED EN APILADO SIMÉTRICO)
              <BarChart
                data={activeFiscalData}
                margin={{ top: 10, right: 15, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="year"
                  tickLine={false}
                  axisLine={{ stroke: "#cbd5e1" }}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  dy={6}
                />
                <YAxis
                  width={75}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  domain={scaleMode === "percent" ? [0, 100] : [0, 800]}
                  tickFormatter={scaleMode === "percent" ? (v) => `${v}%` : formatSpanishNumber}
                />
                <Tooltip content={<CustomFiscalTooltip fiscalTab="total" unit={scaleMode === "percent" ? "%" : "MM€"} />} />
                
                {/* BARRA 1: INGRESOS AAPP (Stack ID ing) FINE-GRAINED */}
                <Bar
                  dataKey="contribucion-extranjeros"
                  name="Ingresos: Extranjeros"
                  stackId="ing"
                  fill={ITEM_COLORS["contribucion-extranjeros"]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="contribucion-espanoles"
                  name="Ingresos: Españoles"
                  stackId="ing"
                  fill={ITEM_COLORS["contribucion-espanoles"]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="ingresos-impuesto-sociedades"
                  name="Ingresos: Impuesto Sociedades"
                  stackId="ing"
                  fill={ITEM_COLORS["ingresos-impuesto-sociedades"]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="ingresos-impuestos-especiales"
                  name="Ingresos: Impuestos Especiales"
                  stackId="ing"
                  fill={ITEM_COLORS["ingresos-impuestos-especiales"]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="ingresos-tasas-precios-publicos"
                  name="Ingresos: Tasas y Precios Públicos"
                  stackId="ing"
                  fill={ITEM_COLORS["ingresos-tasas-precios-publicos"]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="ingresos-fondos-ue"
                  name="Ingresos: Fondos UE"
                  stackId="ing"
                  fill={ITEM_COLORS["ingresos-fondos-ue"]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="ingresos-rentas-patrimoniales"
                  name="Ingresos: Rentas Patrimoniales"
                  stackId="ing"
                  fill={ITEM_COLORS["ingresos-rentas-patrimoniales"]}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={28}
                />

                {/* BARRA 2: GASTOS AAPP (Stack ID gas) FINE-GRAINED */}
                <Bar
                  dataKey="gasto-extranjeros"
                  name="Gastos: Extranjeros"
                  stackId="gas"
                  fill={ITEM_COLORS["gasto-extranjeros"]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="gasto-espanoles"
                  name="Gastos: Españoles"
                  stackId="gas"
                  fill={ITEM_COLORS["gasto-espanoles"]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="gastos-intereses-deuda"
                  name="Gastos: Intereses Deuda"
                  stackId="gas"
                  fill={ITEM_COLORS["gastos-intereses-deuda"]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="gastos-defensa-fuerzas-armadas"
                  name="Gastos: Defensa y FFAA"
                  stackId="gas"
                  fill={ITEM_COLORS["gastos-defensa-fuerzas-armadas"]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="gastos-seguridad-ciudadana-justicia"
                  name="Gastos: Seguridad y Justicia"
                  stackId="gas"
                  fill={ITEM_COLORS["gastos-seguridad-ciudadana-justicia"]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="gastos-infraestructuras-transportes"
                  name="Gastos: Infraestructuras"
                  stackId="gas"
                  fill={ITEM_COLORS["gastos-infraestructuras-transportes"]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="gastos-medio-ambiente-investigacion"
                  name="Gastos: Medio Ambiente e I+D"
                  stackId="gas"
                  fill={ITEM_COLORS["gastos-medio-ambiente-investigacion"]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="gastos-servicios-generales-admon"
                  name="Gastos: Admon. General"
                  stackId="gas"
                  fill={ITEM_COLORS["gastos-servicios-generales-admon"]}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Leyenda Explicativa de la Pestaña */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {fiscalTab === "ratio" || fiscalTab === "capita" ? (
              <>
                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                  <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
                  <span>Población Extranjera</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                  <span className="w-3 h-3 rounded-full bg-slate-500 inline-block" />
                  <span>Población Española</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                  <span className="w-3 h-3 rounded-md bg-emerald-600 inline-block" />
                  <span>Extranjeros</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                  <span className="w-3 h-3 rounded-md bg-blue-800 inline-block" />
                  <span>Españoles</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                  <span className="w-3 h-3 rounded-md bg-purple-700 inline-block" />
                  <span>Imp. Sociedades</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                  <span className="w-3 h-3 rounded-md bg-amber-600 inline-block" />
                  <span>Imp. Especiales/Tasas</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                  <span className="w-3 h-3 rounded-md bg-red-700 inline-block" />
                  <span>Intereses Deuda</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                  <span className="w-3 h-3 rounded-md bg-slate-600 inline-block" />
                  <span>Defensa/Seguridad</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                  <span className="w-3 h-3 rounded-md bg-green-600 inline-block" />
                  <span>Infraestructuras/I+D</span>
                </div>
              </>
            )}
          </div>
          <span className="text-[11px] text-slate-400">
            {fiscalTab === "ratio"
              ? "Línea horizontal punteada en 100% = Equilibrio fiscal."
              : fiscalTab === "capita"
              ? "Valores por encima de 0 = Aportación neta positiva al sistema."
              : `Ingresos vs Gastos IGAE AAPP desglosados en categorías fine-grained específicas. Escala actual: ${scaleMode === "percent" ? "Porcentual 100%" : "Absoluta MM€"}.`}
          </span>
        </div>
      </div>
    );
  }

  // RENDERIZADO LIMPIO ESTÁNDAR PARA OTRAS TARJETAS
  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          {title && <h3 className="text-sm font-bold text-slate-900">{title}</h3>}
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
            Serie Histórica ({firstDate} — {lastDate})
          </div>
        </div>

        <div className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1.5 rounded-lg">
          {unit}
        </div>
      </div>

      <div className="h-80 sm:h-96 w-full touch-pan-y">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "bar" && itemKeys.length > 0 ? (
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 15, left: 10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="year"
                tickLine={false}
                axisLine={{ stroke: "#cbd5e1" }}
                tick={{ fill: "#64748b", fontSize: 11 }}
                dy={6}
              />
              <YAxis
                width={70}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#64748b", fontSize: 11 }}
                domain={[0, "auto"]}
                tickFormatter={formatSpanishNumber}
              />
              <Tooltip content={<CustomTooltipContent unit={unit} />} />
              {itemKeys.map((k, idx) => {
                const color =
                  ITEM_COLORS[k] || `hsl(${(idx * 43) % 360}, 65%, 45%)`;
                const isSelected = selectedKey === k;
                const isDimmed = selectedKey !== null && !isSelected;

                return (
                  <Bar
                    key={k}
                    dataKey={k}
                    stackId="a"
                    fill={color}
                    fillOpacity={isDimmed ? 0.2 : 1}
                    maxBarSize={42}
                    radius={
                      idx === itemKeys.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]
                    }
                  />
                );
              })}
            </BarChart>
          ) : (
            <LineChart
              data={chartData.length ? chartData : series}
              margin={{ top: 10, right: 15, left: 10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey={chartData.length ? "year" : "date"}
                tickLine={false}
                axisLine={{ stroke: "#cbd5e1" }}
                tick={{ fill: "#64748b", fontSize: 11 }}
                dy={6}
              />
              <YAxis
                width={70}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#64748b", fontSize: 11 }}
                domain={[0, "auto"]}
                tickFormatter={formatSpanishNumber}
              />
              <Tooltip content={<CustomTooltipContent unit={unit} />} />
              {itemKeys.length > 0 ? (
                itemKeys.map((k, idx) => {
                  const color =
                    ITEM_COLORS[k] || `hsl(${(idx * 43) % 360}, 65%, 45%)`;
                  const isSelected = selectedKey === k;
                  const isDimmed = selectedKey !== null && !isSelected;

                  return (
                    <Line
                      key={k}
                      type="monotone"
                      dataKey={k}
                      name={formatLabel(k)}
                      stroke={color}
                      strokeWidth={isSelected ? 4 : isDimmed ? 1 : 2.5}
                      strokeOpacity={isDimmed ? 0.2 : 1}
                      dot={isSelected ? { r: 5, fill: color } : false}
                      activeDot={{ r: 6, strokeWidth: 2 }}
                    />
                  );
                })
              ) : (
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#2563eb", stroke: "#ffffff", strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: "#1d4ed8", stroke: "#ffffff", strokeWidth: 2 }}
                />
              )}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {itemKeys.length > 0 && (
        <div className="space-y-2 border-t border-slate-100 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Leyenda (Haz clic para destacar):
            </span>
            {selectedKey && (
              <button
                onClick={() => setSelectedKey(null)}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Restablecer
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {itemKeys.map((k, idx) => {
              const color =
                ITEM_COLORS[k] || `hsl(${(idx * 43) % 360}, 65%, 45%)`;
              const isSelected = selectedKey === k;
              return (
                <button
                  key={k}
                  onClick={() => setSelectedKey(isSelected ? null : k)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                    isSelected
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs scale-105 font-bold"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span>{formatLabel(k)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-[11px] text-slate-400 text-center">
        Pasa el cursor o toca sobre cualquier punto para consultar el desglose exacto.
      </p>
    </div>
  );
}