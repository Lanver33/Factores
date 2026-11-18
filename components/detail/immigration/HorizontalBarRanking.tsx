"use client";

import { useState, useMemo } from "react";
import {
  ImmigrationItem,
  COUNTRY_GEO_MAP,
  formatSpanishNumber,
  formatCompactSpanish,
} from "./utils";
import { BarChart3, Globe2 } from "lucide-react";

interface HorizontalBarRankingProps {
  activeDataMap: Record<string, number>;
  totalArrivals: number;
  pinnedCountryId: string | null;
  setPinnedCountryId: (cId: string | null) => void;
  hoveredCountryId: string | null;
  setHoveredCountryId: (cId: string | null) => void;
}

const BLOCK_COLORS: Record<string, { name: string; bar: string; badge: string }> = {
  "america-hispanohablante": {
    name: "América Hispanohablante",
    bar: "#2563EB",
    badge: "bg-blue-950 text-blue-300 border-blue-800",
  },
  "america-no-hispanohablante": {
    name: "América No Hispanohablante",
    bar: "#7C3AED",
    badge: "bg-purple-950 text-purple-300 border-purple-800",
  },
  europa: {
    name: "Europa",
    bar: "#0891B2",
    badge: "bg-cyan-950 text-cyan-300 border-cyan-800",
  },
  africa: {
    name: "África",
    bar: "#059669",
    badge: "bg-emerald-950 text-emerald-300 border-emerald-800",
  },
  asia: {
    name: "Asia",
    bar: "#D97706",
    badge: "bg-amber-950 text-amber-300 border-amber-800",
  },
  oceania: {
    name: "Oceanía",
    bar: "#64748B",
    badge: "bg-slate-800 text-slate-300 border-slate-700",
  },
};

export default function HorizontalBarRanking({
  activeDataMap,
  totalArrivals,
  pinnedCountryId,
  setPinnedCountryId,
  hoveredCountryId,
  setHoveredCountryId,
}: HorizontalBarRankingProps) {
  const rankedItems = useMemo(() => {
    return Object.entries(activeDataMap)
      .map(([cId, val]) => {
        const geo = COUNTRY_GEO_MAP[cId];
        const pct = totalArrivals > 0 ? (val / totalArrivals) * 100 : 0;
        const bId = geo?.blockId || "oceania";
        return {
          id: cId,
          name: geo?.name || cId,
          blockId: bId,
          blockName: geo?.blockName || "Otros",
          value: val,
          pct,
          style: BLOCK_COLORS[bId] || BLOCK_COLORS.oceania,
        };
      })
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [activeDataMap, totalArrivals]);

  const maxVal = rankedItems[0]?.value || 1;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl space-y-5">
      {/* Header & Legend */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            Ranking de Países de Origen por Volumen e Intensidad Geográfica
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Distribución proporcional de la inmigración por procedencia y región continental/lingüística.
          </p>
        </div>

        {/* Compact Legend */}
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          {Object.entries(BLOCK_COLORS).map(([bId, cfg]) => (
            <div key={bId} className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.bar }} />
              <span className="text-slate-300 font-medium">{cfg.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Horizontal Bars Container */}
      <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-2">
        {rankedItems.map((item, idx) => {
          const isPinned = pinnedCountryId === item.id;
          const isHovered = hoveredCountryId === item.id;
          const widthPct = (item.value / maxVal) * 100;

          return (
            <div
              key={item.id}
              onMouseEnter={() => setHoveredCountryId(item.id)}
              onMouseLeave={() => setHoveredCountryId(null)}
              onClick={() => setPinnedCountryId(isPinned ? null : item.id)}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                isPinned
                  ? "bg-blue-950/80 border-blue-500 ring-1 ring-blue-500 shadow-md"
                  : isHovered
                  ? "bg-slate-800/90 border-slate-700"
                  : "bg-slate-800/40 border-slate-800/80 hover:bg-slate-800/70"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs mb-1.5">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-slate-500 text-[11px] font-bold w-5">
                    #{idx + 1}
                  </span>
                  <span className="font-bold text-white text-sm">
                    {item.name}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${item.style.badge}`}>
                    {item.blockName}
                  </span>
                </div>

                <div className="flex items-center gap-3 font-mono font-bold">
                  <span className="text-yellow-300 text-sm">
                    {formatSpanishNumber(item.value)} pers.
                  </span>
                  <span className="text-sky-300 text-xs min-w-[45px] text-right">
                    {item.pct.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Horizontal Proportion Bar */}
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300 shadow-xs"
                  style={{
                    width: `${Math.max(2, widthPct)}%`,
                    backgroundColor: item.style.bar,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
