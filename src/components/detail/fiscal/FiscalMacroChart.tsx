"use client";

import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell,
  type TooltipProps,
} from "recharts";
import type { AnnualBalanceRecord, FiscalTaxonomy, FiscalUnitId, Lang } from "@/types";
import {
  buildMacroTimeSeries,
  buildCompositionSeries,
  formatFiscalValue,
  getLatestCofogYear,
} from "./fiscalSelectors";
import {
  REVENUE_COLOR,
  EXPENDITURE_COLOR,
  SURPLUS_COLOR,
  DEFICIT_COLOR,
  getTaxonColor,
} from "./fiscalPalette";
import { t } from "@/lib/i18n";
import ConceptHelpTrigger from "@/components/detail/guide/ConceptHelpTrigger";

interface FiscalMacroChartProps {
  balances: AnnualBalanceRecord[];
  taxonomy: FiscalTaxonomy;
  unit: FiscalUnitId;
  selectedYear: string;
  onSelectYear: (year: string) => void;
  lang?: Lang;
}

type MacroTab = "gap" | "rev-comp" | "exp-comp";
type ScaleMode = "unit" | "percent";

function MacroTooltip({
  active,
  payload,
  label,
  unit,
  balances,
  lang = "es",
}: TooltipProps<number, string> & {
  unit: FiscalUnitId;
  balances: AnnualBalanceRecord[];
  lang?: Lang;
}) {
  if (!active || !payload || !payload.length || !label) return null;

  const yearStr = String(label);
  const rec = balances.find((b) => b.year === yearStr);
  const m = rec?.metrics?.[unit];

  if (!m) return null;

  const rev = m.totals.revenue;
  const exp = m.totals.expenditure;
  const bal = m.totals.balance;
  const isSurplus = bal >= 0;

  return (
    <div className="bg-slate-950 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-2 max-w-xs font-sans">
      <div className="font-bold text-white border-b border-slate-800 pb-1 flex items-center justify-between">
        <span>
          {t("yearLabel", lang)} {yearStr}
        </span>
        <span className="text-slate-400 font-mono font-normal">
          {unit === "PC_GDP" ? t("unitPcGdp", lang) : t("unitMioEur", lang)}
        </span>
      </div>

      <div className="space-y-1 font-mono tabular-nums text-[11px]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-sky-400">
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            <span>Ingresos (TR):</span>
          </div>
          <span className="font-bold text-white">
            {formatFiscalValue(rev, unit, lang, { compact: true })}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-indigo-400">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            <span>Gastos (TE):</span>
          </div>
          <span className="font-bold text-white">
            {formatFiscalValue(exp, unit, lang, { compact: true })}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-800">
          <div
            className={`flex items-center gap-1.5 ${
              isSurplus ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isSurplus ? "bg-emerald-400" : "bg-rose-400"
              }`}
            />
            <span>Saldo (B.9):</span>
          </div>
          <span
            className={`font-bold ${
              isSurplus ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {formatFiscalValue(bal, unit, lang, { signed: true, compact: true })}
          </span>
        </div>
      </div>
    </div>
  );
}

export function FiscalMacroChart({
  balances,
  taxonomy,
  unit,
  selectedYear,
  onSelectYear,
  lang = "es",
}: FiscalMacroChartProps) {
  const [activeTab, setActiveTab] = useState<MacroTab>("gap");
  const [scaleMode, setScaleMode] = useState<ScaleMode>("unit");
  const [isolatedTaxon, setIsolatedTaxon] = useState<string | null>(null);

  const macroData = useMemo(
    () => buildMacroTimeSeries(balances, unit),
    [balances, unit]
  );

  const compData = useMemo(() => {
    if (activeTab === "gap") return [];
    const side = activeTab === "rev-comp" ? "revenues" : "expenditures";
    return buildCompositionSeries(balances, taxonomy, side, unit, scaleMode);
  }, [balances, taxonomy, activeTab, unit, scaleMode]);

  const activeSideTaxa = useMemo(() => {
    if (activeTab === "gap") return [];
    return activeTab === "rev-comp" ? taxonomy.revenues : taxonomy.expenditures;
  }, [taxonomy, activeTab]);

  const handleChartClick = (e: any) => {
    if (e && e.activeLabel) {
      onSelectYear(String(e.activeLabel));
    }
  };

  const latestRec = balances[balances.length - 1];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>{t("historicalEvolution", lang)}</span>
            <ConceptHelpTrigger code="SEC2010" lang={lang} />
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
            <span>{t("clickYearHint", lang)}</span>
            {activeTab === "exp-comp" && <ConceptHelpTrigger code="COFOG" lang={lang} />}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Main Mode Tabs */}
          <div className="inline-flex p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold">
            <button
              onClick={() => {
                setActiveTab("gap");
                setIsolatedTaxon(null);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === "gap"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {t("revenueVsExpenditure", lang)}
            </button>
            <button
              onClick={() => {
                setActiveTab("rev-comp");
                setIsolatedTaxon(null);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === "rev-comp"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {t("revenueComposition", lang)}
            </button>
            <button
              onClick={() => {
                setActiveTab("exp-comp");
                setIsolatedTaxon(null);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === "exp-comp"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {t("expenditureComposition", lang)}
            </button>
          </div>

          {/* Scale Toggle for Composition modes */}
          {activeTab !== "gap" && (
            <div className="inline-flex p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setScaleMode("unit")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  scaleMode === "unit"
                    ? "bg-slate-700 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {unit === "PC_GDP" ? "% PIB" : "M€"}
              </button>
              <button
                onClick={() => setScaleMode("percent")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  scaleMode === "percent"
                    ? "bg-slate-700 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                % Total
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODE 1: GAP (Revenues vs Expenditure + Synchronized Balance Strip) */}
      {activeTab === "gap" && (
        <div className="space-y-2">
          {/* Upper Gap Chart */}
          <div className="w-full h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                syncId="fiscal-macro"
                data={macroData}
                onClick={handleChartClick}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis
                  dataKey="year"
                  stroke="#64748B"
                  tick={{ fill: "#94A3B8", fontSize: 11, fontFamily: "monospace" }}
                  axisLine={{ stroke: "#334155" }}
                  tickLine={false}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  stroke="#64748B"
                  tick={{ fill: "#94A3B8", fontSize: 11, fontFamily: "monospace" }}
                  axisLine={{ stroke: "#334155" }}
                  tickFormatter={(val: number) =>
                    formatFiscalValue(val, unit, lang, { compact: true })
                  }
                />
                <Tooltip
                  content={
                    <MacroTooltip unit={unit} balances={balances} lang={lang} />
                  }
                />
                <ReferenceLine
                  x={selectedYear}
                  stroke="#94A3B8"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Ingresos (TR)"
                  stroke={REVENUE_COLOR}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: REVENUE_COLOR }}
                />
                <Line
                  type="monotone"
                  dataKey="expenditure"
                  name="Gastos (TE)"
                  stroke={EXPENDITURE_COLOR}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: EXPENDITURE_COLOR }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Lower Synchronized Balance Strip */}
          <div className="w-full h-28 pt-2 border-t border-slate-800/60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                syncId="fiscal-macro"
                data={macroData}
                onClick={handleChartClick}
                margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="year" hide />
                <YAxis
                  domain={["auto", "auto"]}
                  stroke="#64748B"
                  tick={{ fill: "#94A3B8", fontSize: 10, fontFamily: "monospace" }}
                  tickFormatter={(val: number) => (val === 0 ? "0" : `${val}`)}
                />
                <ReferenceLine y={0} stroke="#475569" strokeWidth={1} />
                <ReferenceLine
                  x={selectedYear}
                  stroke="#94A3B8"
                  strokeDasharray="4 4"
                />
                <Bar dataKey="balance" radius={[2, 2, 0, 0]}>
                  {macroData.map((entry) => {
                    const isSelected = entry.year === selectedYear;
                    const fill = entry.balance >= 0 ? SURPLUS_COLOR : DEFICIT_COLOR;
                    return (
                      <Cell
                        key={entry.year}
                        fill={fill}
                        opacity={isSelected ? 1.0 : 0.75}
                        cursor="pointer"
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* MODE 2 & 3: Composition Area Chart */}
      {activeTab !== "gap" && (
        <div className="space-y-3">
          <div className="w-full h-80 sm:h-96">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={compData}
                onClick={handleChartClick}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis
                  dataKey="year"
                  stroke="#64748B"
                  tick={{ fill: "#94A3B8", fontSize: 11, fontFamily: "monospace" }}
                  axisLine={{ stroke: "#334155" }}
                  tickLine={false}
                />
                <YAxis
                  stroke="#64748B"
                  tick={{ fill: "#94A3B8", fontSize: 11, fontFamily: "monospace" }}
                  axisLine={{ stroke: "#334155" }}
                  tickFormatter={(val: number) =>
                    scaleMode === "percent"
                      ? `${val.toFixed(0)}%`
                      : formatFiscalValue(val, unit, lang, { compact: true })
                  }
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length || !label) return null;
                    return (
                      <div className="bg-slate-950 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1.5 max-w-xs font-sans">
                        <div className="font-bold text-white border-b border-slate-800 pb-1 flex items-center justify-between">
                          <span>Año {label}</span>
                          <span className="text-slate-400 font-mono text-[11px]">
                            {scaleMode === "percent" ? "% del Total" : unit}
                          </span>
                        </div>
                        <div className="space-y-1 font-mono tabular-nums text-[11px]">
                          {payload.map((entry) => {
                            if (entry.value === null || entry.value === undefined)
                              return null;
                            const taxon = activeSideTaxa.find(
                              (t) => t.code === entry.dataKey
                            );
                            const valNum = Number(entry.value);
                            return (
                              <div
                                key={String(entry.dataKey)}
                                className="flex items-center justify-between gap-3"
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: entry.color }}
                                  />
                                  <span className="truncate text-slate-300">
                                    {taxon?.shortLabel ?? entry.dataKey}
                                  </span>
                                </div>
                                <span className="font-bold text-white">
                                  {scaleMode === "percent"
                                    ? `${valNum.toFixed(1)}%`
                                    : formatFiscalValue(valNum, unit, lang, {
                                        compact: true,
                                      })}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }}
                />
                <ReferenceLine
                  x={selectedYear}
                  stroke="#94A3B8"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                />
                {activeSideTaxa.map((t) => {
                  const color = getTaxonColor(t.code);
                  const isDimmed = isolatedTaxon !== null && isolatedTaxon !== t.code;
                  return (
                    <Area
                      key={t.code}
                      type="monotone"
                      dataKey={t.code}
                      name={t.shortLabel}
                      stackId="1"
                      stroke={color}
                      fill={color}
                      fillOpacity={isDimmed ? 0.08 : 0.85}
                      strokeOpacity={isDimmed ? 0.2 : 1.0}
                      connectNulls={false}
                    />
                  );
                })}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Clickable Legend Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
            {activeSideTaxa.map((t) => {
              const color = getTaxonColor(t.code);
              const isSelected = isolatedTaxon === t.code;
              return (
                <button
                  key={t.code}
                  onClick={() =>
                    setIsolatedTaxon(isSelected ? null : t.code)
                  }
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                    isSelected
                      ? "bg-slate-700 text-white ring-1 ring-white/40"
                      : isolatedTaxon !== null
                      ? "bg-slate-950/40 text-slate-500 opacity-60"
                      : "bg-slate-950 text-slate-300 hover:text-white border border-slate-800"
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span>{t.shortLabel}</span>
                  <span className="font-mono text-[10px] opacity-60">({t.code})</span>
                </button>
              );
            })}

            {isolatedTaxon && (
              <button
                onClick={() => setIsolatedTaxon(null)}
                className="px-2.5 py-1 rounded-full text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
              >
                Restablecer
              </button>
            )}
          </div>

          {/* Footnote for missing COFOG in recent years */}
          {activeTab === "exp-comp" && !latestRec.cofogAvailable && (
            <p className="text-[11px] text-slate-400 italic">
              * Nota: El desglose por funciones COFOG finaliza en {getLatestCofogYear(balances)} (el ejercicio {latestRec.year} aún no cuenta con desglose funcional por la IGAE/Eurostat).
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default FiscalMacroChart;
