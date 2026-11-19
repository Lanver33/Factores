"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import { Briefcase, Info } from "lucide-react";
import type { NationalityAnnualRecord, PopulationDefinition, Lang } from "@/types";
import {
  buildLaborTimeSeries,
  type LaborMetricKey,
  formatPercent,
  formatHeadcount,
} from "./nationalitySelectors";
import {
  NATIONALS_COLOR,
  FOREIGNERS_COLOR,
  EU_FOREIGNERS_COLOR,
  NON_EU_FOREIGNERS_COLOR,
  TOTAL_COLOR,
} from "./nationalityPalette";
import { t } from "@/lib/i18n";
import { ConceptHelpTrigger } from "@/components/detail/guide/ConceptHelpTrigger";

interface LaborMarketComparisonChartProps {
  records: NationalityAnnualRecord[];
  selectedYear: string;
  onSelectYear: (year: string) => void;
  definition: PopulationDefinition;
  lang?: Lang;
}

export function LaborMarketComparisonChart({
  records,
  selectedYear,
  onSelectYear,
  definition,
  lang = "es",
}: LaborMarketComparisonChartProps) {
  const [metric, setMetric] = useState<LaborMetricKey>("employmentRatePct");
  const [includeEuSplit, setIncludeEuSplit] = useState<boolean>(true);

  const isCitizenship = definition === "citizenship";
  const natGroupLabel = isCitizenship ? t("groupNationals", lang) : t("groupNativeBorn", lang);
  const forGroupLabel = isCitizenship ? t("groupForeigners", lang) : t("groupForeignBorn", lang);

  const data = buildLaborTimeSeries(records, definition, metric, includeEuSplit);

  const isRate = metric !== "employedThousands";

  const formatYAxis = (val: number) => {
    if (isRate) return `${val}%`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}M`;
    return `${val}k`;
  };

  const formatTooltipVal = (val: number | null | undefined) => {
    if (val === null || val === undefined) return "—";
    if (isRate) return formatPercent(val, 1, lang);
    return `${val.toLocaleString(lang === "en" ? "en-US" : "es-ES")} ${lang === "en" ? "thousand" : "miles"}`;
  };

  const handleChartClick = (e: any) => {
    if (e && e.activeLabel) {
      onSelectYear(String(e.activeLabel));
    }
  };

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {t("laborMarketTitle", lang)}
            </h2>
          </div>
          <div className="text-xs text-slate-400">
            {lang === "en"
              ? "Harmonized Eurostat Labour Force Survey (LFS / INE EPA, population 15–64)"
              : "Encuesta de Población Activa (EPA armonizada Eurostat, tramo 15–64 años)"}
          </div>
        </div>

        {/* Metrics Switcher Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div
            role="group"
            aria-label="Selección de métrica laboral"
            className="inline-flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl flex-wrap"
          >
            <button
              type="button"
              onClick={() => setMetric("employmentRatePct")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                metric === "employmentRatePct"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {t("metricEmploymentRate", lang)}
            </button>
            <button
              type="button"
              onClick={() => setMetric("activityRatePct")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                metric === "activityRatePct"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {t("metricActivityRate", lang)}
            </button>
            <button
              type="button"
              onClick={() => setMetric("unemploymentRatePct")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                metric === "unemploymentRatePct"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {t("metricUnemploymentRate", lang)}
            </button>
            <button
              type="button"
              onClick={() => setMetric("employedThousands")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                metric === "employedThousands"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {t("metricEmployedThousands", lang)}
            </button>
          </div>

          {metric === "employmentRatePct" && <ConceptHelpTrigger code="EMPLOYMENT_RATE" lang={lang} />}
          {metric === "activityRatePct" && <ConceptHelpTrigger code="ACTIVITY_RATE" lang={lang} />}
          {metric === "unemploymentRatePct" && <ConceptHelpTrigger code="UNEMPLOYMENT_RATE" lang={lang} />}
        </div>
      </div>

      {/* Sub-bar: EU Drilldown Checkbox */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <label className="inline-flex items-center gap-2 cursor-pointer select-none hover:text-slate-200 transition-colors">
          <input
            type="checkbox"
            checked={includeEuSplit}
            onChange={(e) => setIncludeEuSplit(e.target.checked)}
            className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
          />
          <span className="font-semibold text-slate-300">{t("toggleEuSplit", lang)}</span>
          <ConceptHelpTrigger code="EU_VS_NEU" lang={lang} />
        </label>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: NATIONALS_COLOR }} />
          <span>{natGroupLabel}</span>
          <span className="mx-1">·</span>
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: FOREIGNERS_COLOR }} />
          <span>{forGroupLabel}</span>
          {includeEuSplit && (
            <>
              <span className="mx-1">·</span>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: EU_FOREIGNERS_COLOR }} />
              <span>{t("groupEuForeigners", lang)}</span>
              <span className="mx-1">·</span>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: NON_EU_FOREIGNERS_COLOR }} />
              <span>{t("groupNonEuForeigners", lang)}</span>
            </>
          )}
        </div>
      </div>

      {/* Recharts Chart */}
      <div className="h-80 w-full pt-2">
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
              width={48}
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

            {/* Reference line on active year */}
            <ReferenceLine
              x={selectedYear}
              stroke="#818CF8"
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />

            {/* Main Lines */}
            <Line
              type="monotone"
              dataKey="nationals"
              name={natGroupLabel}
              stroke={NATIONALS_COLOR}
              strokeWidth={2.5}
              dot={{ r: 2, fill: NATIONALS_COLOR }}
              activeDot={{ r: 5 }}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="foreigners"
              name={forGroupLabel}
              stroke={FOREIGNERS_COLOR}
              strokeWidth={2.5}
              dot={{ r: 2, fill: FOREIGNERS_COLOR }}
              activeDot={{ r: 5 }}
              connectNulls={false}
            />

            {includeEuSplit && (
              <Line
                key="euForeigners"
                type="monotone"
                dataKey="euForeigners"
                name={t("groupEuForeigners", lang)}
                stroke={EU_FOREIGNERS_COLOR}
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 2, fill: EU_FOREIGNERS_COLOR }}
                activeDot={{ r: 5 }}
                connectNulls={false}
              />
            )}
            {includeEuSplit && (
              <Line
                key="nonEuForeigners"
                type="monotone"
                dataKey="nonEuForeigners"
                name={t("groupNonEuForeigners", lang)}
                stroke={NON_EU_FOREIGNERS_COLOR}
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 2, fill: NON_EU_FOREIGNERS_COLOR }}
                activeDot={{ r: 5 }}
                connectNulls={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Helpful Hint */}
      <div className="flex items-center gap-1.5 text-xs text-slate-400/90 pt-1">
        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>{t("laborClickHint", lang)}</span>
      </div>
    </section>
  );
}

export default LaborMarketComparisonChart;
