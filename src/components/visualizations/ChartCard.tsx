import React from "react";

export const CHART_THEME = {
  grid: {
    stroke: "#334155",
    strokeDasharray: "3 3",
    vertical: false,
  },
  axis: {
    stroke: "#475569",
    tick: {
      fill: "#94a3b8",
      fontSize: 11,
      fontFamily: "inherit",
    },
    tickLine: { stroke: "#475569" },
  },
  tooltip: {
    contentStyle: {
      backgroundColor: "#0f172a",
      borderColor: "#334155",
      borderRadius: "0.75rem",
      color: "#f8fafc",
      boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.5)",
      padding: "0.75rem 1rem",
    },
    itemStyle: {
      fontSize: "12px",
      padding: "2px 0",
    },
  },
  colors: {
    primary: "#3b82f6",
    secondary: "#10b981",
    accent: "#8b5cf6",
    amber: "#f59e0b",
    rose: "#f43f5e",
    slate: "#64748b",
  },
};

interface ChartCardProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerRight?: React.ReactNode;
  className?: string;
}

export function ChartCard({
  children,
  title,
  subtitle,
  headerRight,
  className = "",
}: ChartCardProps) {
  return (
    <div
      className={`bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4 ${className}`}
    >
      {(title || subtitle || headerRight) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div>
            {title && <h3 className="text-sm font-bold text-white tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {headerRight && <div className="flex items-center gap-2">{headerRight}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}
