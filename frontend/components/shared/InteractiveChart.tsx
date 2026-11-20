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
import type { DatoItem, Lang } from "@/lib/types";
import { formatNumber, formatPercent } from "@/lib/format";

interface InteractiveChartProps {
  item: DatoItem;
  lang?: Lang;
  locale?: Lang;
}

interface CustomTooltipProps extends TooltipProps<number, string> {
  unit: string;
  lang: Lang;
}

function StandardTooltip({ active, payload, label, unit, lang }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const entry = payload[0];
  const val = Number(entry.value) || 0;

  const isPercent = unit.includes("%");
  const formattedVal = isPercent ? formatPercent(val, lang) : formatNumber(val, lang);

  return (
    <div className="bg-slate-900 text-white p-3 rounded-xl shadow-2xl border border-slate-700 text-xs space-y-1 font-sans">
      <div className="font-semibold text-slate-300">{label}</div>
      <div className="text-sm font-bold text-blue-400 font-mono tabular-nums">
        {formattedVal} {unit ? `(${unit})` : ""}
      </div>
    </div>
  );
}

export function InteractiveChart({ item, lang, locale = "es" }: InteractiveChartProps) {
  const activeLang = lang || locale || "es";
  const { chartType, unit } = item;

  const rawPoints = (item as any).dataPoints || (item as any).points || [];

  const data = useMemo(() => {
    return rawPoints.map((pt: any) => ({
      period: pt.year || pt.period || "",
      value: typeof pt.value === "number" ? pt.value : Number(pt.value) || 0,
    }));
  }, [rawPoints]);

  if (!data || data.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs">
        No hay datos suficientes para mostrar la gráfica.
      </div>
    );
  }

  const isBar = chartType === "bar";

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-3">
      <div className="w-full h-[360px] sm:h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          {isBar ? (
            <BarChart data={data} margin={{ top: 12, right: 16, left: -10, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
              <XAxis
                dataKey="period"
                stroke="#64748B"
                tick={{ fill: "#94A3B8", fontSize: 11, fontFamily: "monospace" }}
                axisLine={{ stroke: "#334155" }}
                tickLine={false}
              />
              <YAxis
                stroke="#64748B"
                tick={{ fill: "#94A3B8", fontSize: 11, fontFamily: "monospace" }}
                axisLine={{ stroke: "#334155" }}
                domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.1)]}
                tickFormatter={(v: number) => formatNumber(v, activeLang)}
              />
              <Tooltip
                content={<StandardTooltip unit={unit} lang={activeLang} />}
              />
              <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={data} margin={{ top: 12, right: 16, left: -10, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
              <XAxis
                dataKey="period"
                stroke="#64748B"
                tick={{ fill: "#94A3B8", fontSize: 11, fontFamily: "monospace" }}
                axisLine={{ stroke: "#334155" }}
                tickLine={false}
              />
              <YAxis
                stroke="#64748B"
                tick={{ fill: "#94A3B8", fontSize: 11, fontFamily: "monospace" }}
                axisLine={{ stroke: "#334155" }}
                domain={[
                  (dataMin: number) => (dataMin < 0 ? Math.floor(dataMin * 1.1) : 0),
                  (dataMax: number) => Math.ceil(dataMax * 1.1),
                ]}
                tickFormatter={(v: number) => formatNumber(v, activeLang)}
              />
              <Tooltip
                content={<StandardTooltip unit={unit} lang={activeLang} />}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ r: 3, fill: "#3B82F6" }}
                activeDot={{ r: 6, fill: "#60a5fa" }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default InteractiveChart;
