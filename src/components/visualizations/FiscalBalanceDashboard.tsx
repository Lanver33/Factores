"use client";

import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  type TooltipProps,
} from "recharts";
import type { FiscalBalanceIndicator, Locale } from "@/domain/indicator.schema";
import { ChartCard, CHART_THEME } from "./ChartCard";
import { t } from "@/lib/i18n";
import { formatNumber, formatPercent } from "@/lib/format";

interface FiscalBalanceDashboardProps {
  indicator: FiscalBalanceIndicator;
  locale: Locale;
}

type TabMode = "ratio" | "capita" | "total";

interface FiscalTooltipProps extends TooltipProps<number, string> {
  activeTab: TabMode;
  locale: Locale;
}

function FiscalTooltip({ active, payload, label, activeTab, locale }: FiscalTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-2xl border border-slate-700 text-xs max-w-xs space-y-2">
      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 font-bold">
        <span>
          {t("yearLabel", locale)} {label}
        </span>
        <span className="text-blue-400 font-semibold">
          {activeTab === "ratio"
            ? t("fiscalTabRatio", locale)
            : activeTab === "capita"
            ? t("fiscalTabCapita", locale)
            : t("fiscalTabTotal", locale)}
        </span>
      </div>
      <div className="space-y-1 text-[11px]">
        {payload.map((entry, idx) => {
          const val = Number(entry.value) || 0;
          let displayVal = "";
          if (activeTab === "ratio") {
            const isSurplus = val >= 100;
            displayVal = `${formatPercent(val, locale)} (${
              isSurplus ? t("fiscalSurplus", locale) : t("fiscalDeficit", locale)
            })`;
          } else if (activeTab === "capita") {
            displayVal = `${val >= 0 ? "+" : ""}${formatNumber(val, locale)} €/hab`;
          } else {
            displayVal = `${formatNumber(val, locale)} MM€`;
          }

          return (
            <div key={idx} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="truncate text-slate-300">{entry.name}</span>
              </div>
              <span className="font-semibold text-white tabular-nums font-mono">
                {displayVal}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function FiscalBalanceDashboard({
  indicator,
  locale,
}: FiscalBalanceDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabMode>("ratio");

  const { points } = indicator;

  const ratioData = useMemo(
    () =>
      points.map((p) => ({
        year: p.year,
        foreignRatio: p.ratio.foreign,
        spanishRatio: p.ratio.spanish,
      })),
    [points]
  );

  const capitaData = useMemo(
    () =>
      points.map((p) => ({
        year: p.year,
        foreignCapita: p.perCapitaEur.foreign,
        spanishCapita: p.perCapitaEur.spanish,
      })),
    [points]
  );

  const totalData = useMemo(
    () =>
      points.map((p) => ({
        year: p.year,
        totalRevenue: p.totalRevenueMmEur,
        totalSpending: p.totalSpendingMmEur,
        deficit: p.deficitMmEur,
      })),
    [points]
  );

  const tabSubtitle =
    activeTab === "ratio"
      ? t("fiscalRatioDesc", locale)
      : activeTab === "capita"
      ? t("fiscalCapitaDesc", locale)
      : t("fiscalTotalDesc", locale);

  return (
    <ChartCard
      title={
        <div className="flex items-center gap-2">
          <span className="text-base">⚖️</span>
          <span>{indicator.question[locale]}</span>
        </div>
      }
      subtitle={tabSubtitle}
      headerRight={
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs font-bold">
          <button
            onClick={() => setActiveTab("ratio")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "ratio"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {t("fiscalTabRatio", locale)}
          </button>
          <button
            onClick={() => setActiveTab("capita")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "capita"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {t("fiscalTabCapita", locale)}
          </button>
          <button
            onClick={() => setActiveTab("total")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "total"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {t("fiscalTabTotal", locale)}
          </button>
        </div>
      }
    >
      <div className="w-full h-[380px] sm:h-[440px] pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {activeTab === "ratio" ? (
            <BarChart data={ratioData} margin={{ top: 12, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid {...CHART_THEME.grid} />
              <XAxis dataKey="year" {...CHART_THEME.axis} />
              <YAxis
                {...CHART_THEME.axis}
                domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.15)]}
                tickFormatter={(v: number) => `${v}%`}
              />
              <Tooltip content={<FiscalTooltip activeTab="ratio" locale={locale} />} />
              <ReferenceLine
                y={100}
                stroke="#ef4444"
                strokeDasharray="4 4"
                label={{
                  value: "100% (Equilibrio)",
                  fill: "#ef4444",
                  fontSize: 10,
                  position: "top",
                }}
              />
              <Bar
                dataKey="foreignRatio"
                name={t("fiscalForeignRatio", locale)}
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="spanishRatio"
                name={t("fiscalSpanishRatio", locale)}
                fill="#64748b"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          ) : activeTab === "capita" ? (
            <BarChart data={capitaData} margin={{ top: 12, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid {...CHART_THEME.grid} />
              <XAxis dataKey="year" {...CHART_THEME.axis} />
              <YAxis
                {...CHART_THEME.axis}
                domain={[
                  (dataMin: number) => Math.floor(dataMin * 1.15),
                  (dataMax: number) => Math.ceil(dataMax * 1.15),
                ]}
                tickFormatter={(v: number) => `${v} €`}
              />
              <Tooltip content={<FiscalTooltip activeTab="capita" locale={locale} />} />
              <ReferenceLine y={0} stroke="#94a3b8" />
              <Bar
                dataKey="foreignCapita"
                name={t("fiscalForeignCapita", locale)}
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="spanishCapita"
                name={t("fiscalSpanishCapita", locale)}
                fill="#64748b"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          ) : (
            <BarChart data={totalData} margin={{ top: 12, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid {...CHART_THEME.grid} />
              <XAxis dataKey="year" {...CHART_THEME.axis} />
              <YAxis
                {...CHART_THEME.axis}
                domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.15)]}
                tickFormatter={(v: number) => `${v} MM€`}
              />
              <Tooltip content={<FiscalTooltip activeTab="total" locale={locale} />} />
              <Bar
                dataKey="totalRevenue"
                name={t("fiscalTotalRevenue", locale)}
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="totalSpending"
                name={t("fiscalTotalSpending", locale)}
                fill="#8b5cf6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
