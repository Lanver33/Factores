"use client";

import { useMemo } from "react";
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
  type TooltipProps,
} from "recharts";
import type { TimeSeriesIndicator, Locale } from "@/domain/indicator.schema";
import { ChartCard, CHART_THEME } from "./ChartCard";
import { formatIndicatorValue } from "@/lib/format";

interface TimeSeriesChartProps {
  indicator: TimeSeriesIndicator;
  locale: Locale;
}

interface CustomTooltipProps extends TooltipProps<number, string> {
  unit: string;
  format: TimeSeriesIndicator["valueFormat"];
  locale: Locale;
}

function SeriesTooltip({ active, payload, label, unit, format, locale }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const entry = payload[0];
  const val = Number(entry.value) || 0;

  return (
    <div className="bg-slate-900 text-white p-3 rounded-xl shadow-2xl border border-slate-700 text-xs space-y-1">
      <div className="font-semibold text-slate-300">{label}</div>
      <div className="text-sm font-bold text-blue-400 font-mono tabular-nums">
        {formatIndicatorValue(val, format, locale)} {unit ? `(${unit})` : ""}
      </div>
    </div>
  );
}

export default function TimeSeriesChart({ indicator, locale }: TimeSeriesChartProps) {
  const { points, chartStyle, unit, valueFormat } = indicator;

  const data = useMemo(
    () =>
      points.map((pt) => ({
        period: pt.period,
        value: pt.value,
      })),
    [points]
  );

  const unitStr = unit[locale];

  return (
    <ChartCard>
      <div className="w-full h-[360px] sm:h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          {chartStyle === "bar" ? (
            <BarChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid {...CHART_THEME.grid} />
              <XAxis dataKey="period" {...CHART_THEME.axis} />
              <YAxis
                {...CHART_THEME.axis}
                domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.1)]}
                tickFormatter={(v: number) => formatIndicatorValue(v, valueFormat, locale, true)}
              />
              <Tooltip
                content={<SeriesTooltip unit={unitStr} format={valueFormat} locale={locale} />}
              />
              <Bar dataKey="value" fill={CHART_THEME.colors.primary} radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid {...CHART_THEME.grid} />
              <XAxis dataKey="period" {...CHART_THEME.axis} />
              <YAxis
                {...CHART_THEME.axis}
                domain={[
                  (dataMin: number) => (dataMin < 0 ? Math.floor(dataMin * 1.1) : 0),
                  (dataMax: number) => Math.ceil(dataMax * 1.1),
                ]}
                tickFormatter={(v: number) => formatIndicatorValue(v, valueFormat, locale, true)}
              />
              <Tooltip
                content={<SeriesTooltip unit={unitStr} format={valueFormat} locale={locale} />}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={CHART_THEME.colors.primary}
                strokeWidth={3}
                dot={{ r: 3, fill: CHART_THEME.colors.primary }}
                activeDot={{ r: 6, fill: "#60a5fa" }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
