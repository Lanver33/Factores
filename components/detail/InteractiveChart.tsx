"use client";

import { MetricSeriesPoint } from "@/types";
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
} from "recharts";

interface InteractiveChartProps {
  series: MetricSeriesPoint[];
  chartType?: "line" | "bar";
  unit: string;
  title?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: MetricSeriesPoint }>;
  unit: string;
}

function CustomTooltip({ active, payload, unit }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0];
    const displayValue =
      unit === "percent" ? `${data.value}%` : `${data.value.toLocaleString()} ${unit}`;
    return (
      <div className="bg-slate-900 text-white px-3.5 py-2 rounded-xl shadow-lg border border-slate-700 text-xs">
        <div className="text-slate-400 font-medium">{data.payload.date}</div>
        <div className="text-base font-bold text-white mt-0.5">
          {displayValue}
        </div>
      </div>
    );
  }
  return null;
}

export default function InteractiveChart({
  series,
  chartType = "line",
  unit,
  title,
}: InteractiveChartProps) {
  if (!series || series.length === 0) {
    return (
      <div className="w-full bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
        No series data available.
      </div>
    );
  }

  const firstDate = series[0]?.date || "";
  const lastDate = series[series.length - 1]?.date || "";

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          {title && <h3 className="text-sm font-bold text-slate-900">{title}</h3>}
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
            Monthly Time-Series ({firstDate} — {lastDate})
          </div>
        </div>
        <div className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-md">
          {unit}
        </div>
      </div>

      <div className="h-72 sm:h-80 w-full touch-pan-y">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "line" ? (
            <LineChart
              data={series}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={{ stroke: "#cbd5e1" }}
                tick={{ fill: "#64748b", fontSize: 12 }}
                dy={6}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#64748b", fontSize: 12 }}
                domain={["auto", "auto"]}
              />
              <Tooltip content={<CustomTooltip unit={unit} />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ r: 4, fill: "#2563eb", stroke: "#ffffff", strokeWidth: 2 }}
                activeDot={{ r: 7, fill: "#1d4ed8", stroke: "#ffffff", strokeWidth: 2 }}
              />
            </LineChart>
          ) : (
            <BarChart
              data={series}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={{ stroke: "#cbd5e1" }}
                tick={{ fill: "#64748b", fontSize: 12 }}
                dy={6}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#64748b", fontSize: 12 }}
                domain={["auto", "auto"]}
              />
              <Tooltip content={<CustomTooltip unit={unit} />} />
              <Bar
                dataKey="value"
                fill="#2563eb"
                radius={[6, 6, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      <p className="text-[11px] text-slate-400 text-center">
        Hover or tap data points to view exact monthly statistical values.
      </p>
    </div>
  );
}
