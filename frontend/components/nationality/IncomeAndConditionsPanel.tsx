"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import { Wallet, AlertCircle } from "lucide-react";
import type { NationalityAnnualRecord, PopulationDefinition, Lang } from "@/lib/types";
import {
  buildLivingConditionsSeries,
  getRecordForYear,
  type LivingConditionsMetricKey,
  formatCurrencyEur,
  formatPercent,
} from "./nationalitySelectors";
import {
  NATIONALS_COLOR,
  FOREIGNERS_COLOR,
  EU_FOREIGNERS_COLOR,
  NON_EU_FOREIGNERS_COLOR,
} from "./nationalityPalette";
import { t } from "@/lib/i18n";
import { ConceptHelpTrigger } from "@/components/detail/guide/ConceptHelpTrigger";

interface IncomeAndConditionsPanelProps {
  records: NationalityAnnualRecord[];
  selectedYear: string;
  onSelectYear: (year: string) => void;
  definition: PopulationDefinition;
  lang?: Lang;
}

export function IncomeAndConditionsPanel({
  records,
  selectedYear,
  onSelectYear,
  definition,
  lang = "es",
}: IncomeAndConditionsPanelProps) {
  const [metric, setMetric] = useState<LivingConditionsMetricKey>("medianEquivalisedIncomeEur");

  const currentRecord = getRecordForYear(records, selectedYear);
  const livStats = currentRecord?.livingConditions;

  const data = buildLivingConditionsSeries(records, metric, true);

  const isCurrency = metric !== "atRiskOfPovertyPct";

  const formatYAxis = (val: number) => {
    if (!isCurrency) return `${val}%`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}k€`;
    return `${val}€`;
  };

  const formatTooltipVal = (val: number | null | undefined) => {
    if (val === null || val === undefined) return "—";
    if (isCurrency) return formatCurrencyEur(val, lang);
    return formatPercent(val, 1, lang);
  };

  const handleChartClick = (e: any) => {
    if (e && e.activeLabel) {
      onSelectYear(String(e.activeLabel));
    }
  };

  // Metric values for selectedYear summary
  const natVal = livStats?.nationals?.[metric];
  const forVal = livStats?.foreigners?.[metric];
  const euVal = livStats?.euForeigners?.[metric];
  const nonEuVal = livStats?.nonEuForeigners?.[metric];

  let incomeRatio: number | null = null;
  if (natVal !== null && natVal !== undefined && forVal !== null && forVal !== undefined && natVal > 0) {
    incomeRatio = Math.round((forVal / natVal) * 1000) / 10;
  }

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-purple-400" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {t("livingConditionsTitle", lang)}
            </h2>
            <ConceptHelpTrigger code="EQUIVALISED_INCOME" lang={lang} />
            <ConceptHelpTrigger code="AROP_RATE" lang={lang} />
          </div>
          <div className="text-xs text-slate-400">
            {lang === "en"
              ? "Living Conditions Survey (EU-SILC / INE ECV, adult population 18+)"
              : "Encuesta de Condiciones de Vida (INE ECV / EU-SILC, adultos 18+ años)"}
          </div>
        </div>

        {/* Metric Switcher Tabs (only relevant when definition === "citizenship") */}
        {definition === "citizenship" && (
          <div
            role="group"
            aria-label="Selección de métrica de condiciones de vida"
            className="inline-flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl flex-wrap"
          >
            <button
              type="button"
              onClick={() => setMetric("medianEquivalisedIncomeEur")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                metric === "medianEquivalisedIncomeEur"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {t("metricMedianIncome", lang)}
            </button>
            <button
              type="button"
              onClick={() => setMetric("meanEquivalisedIncomeEur")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                metric === "meanEquivalisedIncomeEur"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {t("metricMeanIncome", lang)}
            </button>
            <button
              type="button"
              onClick={() => setMetric("atRiskOfPovertyPct")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                metric === "atRiskOfPovertyPct"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {t("metricPovertyRate", lang)}
            </button>
          </div>
        )}
      </div>

      {/* When definition === "birthplace", ECV data does not exist by country of birth: show only the notice and NO chart */}
      {definition === "birthplace" ? (
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-6 sm:p-8 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="max-w-xl mx-auto space-y-2">
            <h3 className="text-sm font-bold text-white">
              {lang === "en"
                ? "No official data by country of birth"
                : "Sin datos oficiales por país de nacimiento"}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t("citizenshipOnlyNotice", lang)}
            </p>
          </div>
        </div>
      ) : (
        /* 2-Column Layout (only rendered when definition === "citizenship") */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Historical Line Chart */}
        <div className="lg:col-span-2 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-300">
              {t("historicalEvolution", lang)} (2008–{data[data.length - 1]?.year})
            </span>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: NATIONALS_COLOR }} />
                {t("groupNationals", lang)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: FOREIGNERS_COLOR }} />
                {t("groupForeigners", lang)}
              </span>
            </div>
          </div>

          <div className="h-72 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                onClick={handleChartClick}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                <XAxis
                  dataKey="year"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: "#334155" }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: "#334155" }}
                  domain={["auto", "auto"]}
                  tickFormatter={formatYAxis}
                  width={52}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    return (
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 shadow-2xl text-xs space-y-1.5 min-w-44">
                        <div className="font-bold text-white border-b border-slate-800 pb-1 flex items-center justify-between">
                          <span>{t("yearLabel", lang)} {label}</span>
                          {label === selectedYear && (
                            <span className="text-[10px] text-blue-400 font-normal">● Activo</span>
                          )}
                        </div>
                        {payload.map((entry: any) => (
                          <div key={entry.name} className="flex items-center justify-between gap-3">
                            <span className="flex items-center gap-1.5 text-slate-300">
                              <span
                                className="w-2 h-2 rounded-full inline-block"
                                style={{ backgroundColor: entry.color }}
                              />
                              {entry.name}:
                            </span>
                            <span className="font-mono font-bold text-white tabular-nums">
                              {formatTooltipVal(entry.value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }}
                />

                <ReferenceLine
                  x={selectedYear}
                  stroke="#818CF8"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                />

                <Line
                  type="monotone"
                  dataKey="nationals"
                  name={t("groupNationals", lang)}
                  stroke={NATIONALS_COLOR}
                  strokeWidth={2.5}
                  dot={{ r: 2, fill: NATIONALS_COLOR }}
                  activeDot={{ r: 5 }}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="foreigners"
                  name={t("groupForeigners", lang)}
                  stroke={FOREIGNERS_COLOR}
                  strokeWidth={2.5}
                  dot={{ r: 2, fill: FOREIGNERS_COLOR }}
                  activeDot={{ r: 5 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 1 Col: Summary Card */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-800 flex items-center justify-between">
              <span>{t("summaryYear", lang)} {selectedYear}</span>
              <span className="text-[11px] font-normal text-slate-400 lowercase font-mono">
                {metric === "medianEquivalisedIncomeEur" && (lang === "en" ? "median" : "mediana")}
                {metric === "meanEquivalisedIncomeEur" && (lang === "en" ? "mean" : "media")}
                {metric === "atRiskOfPovertyPct" && (lang === "en" ? "poverty" : "pobreza")}
              </span>
            </div>

            <div className="space-y-3 pt-3">
              {/* Españoles */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: NATIONALS_COLOR }} />
                  {t("groupNationals", lang)}:
                </span>
                <span className="font-mono font-bold text-white text-sm tabular-nums">
                  {formatTooltipVal(natVal)}
                </span>
              </div>

              {/* Extranjeros */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: FOREIGNERS_COLOR }} />
                  {t("groupForeigners", lang)}:
                </span>
                <span className="font-mono font-bold text-amber-400 text-sm tabular-nums">
                  {formatTooltipVal(forVal)}
                </span>
              </div>

              {/* Ratio */}
              {incomeRatio !== null && (
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400">{t("incomeRatioLabel", lang)}:</span>
                  <span className="font-mono font-bold text-purple-300 tabular-nums">
                    {incomeRatio}%
                  </span>
                </div>
              )}

              {/* Desglose UE vs No-UE */}
              {(euVal !== null || nonEuVal !== null) && (
                <div className="pt-3 border-t border-slate-800/80 space-y-1.5 text-xs">
                  <span className="text-[11px] text-slate-400 block font-semibold">
                    {lang === "en" ? "Foreign breakdown:" : "Desglose extranjeros:"}
                  </span>
                  {euVal !== null && euVal !== undefined && (
                    <div className="flex items-center justify-between text-slate-300 pl-1">
                      <span className="flex items-center gap-1.5 text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: EU_FOREIGNERS_COLOR }} />
                        {t("groupEuForeigners", lang)}:
                      </span>
                      <span className="font-mono font-semibold tabular-nums text-slate-200">
                        {formatTooltipVal(euVal)}
                      </span>
                    </div>
                  )}
                  {nonEuVal !== null && nonEuVal !== undefined && (
                    <div className="flex items-center justify-between text-slate-300 pl-1">
                      <span className="flex items-center gap-1.5 text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: NON_EU_FOREIGNERS_COLOR }} />
                        {t("groupNonEuForeigners", lang)}:
                      </span>
                      <span className="font-mono font-semibold tabular-nums text-slate-200">
                        {formatTooltipVal(nonEuVal)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="text-[11px] text-slate-400/90 leading-relaxed pt-2 border-t border-slate-800/60">
            {lang === "en"
              ? "Equivalised net income measures household disposable income adjusted for household size (modified OECD scale) to allow genuine personal purchasing power comparisons."
              : "La renta neta equivalente mide los ingresos disponibles ajustados por el tamaño familiar (escala modificada OCDE) para comparar el poder adquisitivo individual real."}
          </div>
        </div>
      </div>
      )}
    </section>
  );
}

export default IncomeAndConditionsPanel;
