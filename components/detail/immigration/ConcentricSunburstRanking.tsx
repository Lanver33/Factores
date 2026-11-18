"use client";

import { useState, useMemo } from "react";
import {
  ImmigrationItem,
  formatSpanishNumber,
  formatCompactSpanish,
  describeArc,
} from "./utils";
import { PieChart, Filter, Sparkles } from "lucide-react";

interface ConcentricSunburstRankingProps {
  item: ImmigrationItem;
  activeDataMap: Record<string, number>;
  totalArrivals: number;
  pinnedCountryId: string | null;
  setPinnedCountryId: (cId: string | null) => void;
  hoveredCountryId: string | null;
  setHoveredCountryId: (cId: string | null) => void;
  selectedTimeframeLabel: string;
}

const BLOCK_COLORS: Record<string, string> = {
  "america-hispanohablante": "#2563EB", // Blue
  "america-no-hispanohablante": "#7C3AED", // Purple
  europa: "#0891B2", // Cyan
  africa: "#059669", // Emerald
  asia: "#D97706", // Amber
  oceania: "#64748B", // Slate
};

export default function ConcentricSunburstRanking({
  item,
  activeDataMap,
  totalArrivals,
  pinnedCountryId,
  setPinnedCountryId,
  hoveredCountryId,
  setHoveredCountryId,
  selectedTimeframeLabel,
}: ConcentricSunburstRankingProps) {
  const [activeDrillBlockId, setActiveDrillBlockId] = useState<string | null>(null);
  const [hoveredSector, setHoveredSector] = useState<{
    type: "block" | "country";
    name: string;
    value: number;
    globalPct: number;
    parentPct?: number;
    color: string;
    id: string;
  } | null>(null);

  // Compute hierarchical sectors for Sunburst / Concentric Rings
  const { blockSectors, countrySectors, blockRankings } = useMemo(() => {
    const totalGlobal = totalArrivals || 1;
    const cx = 240;
    const cy = 240;
    const rInBlock = 80;
    const rOutBlock = 145;
    const rInCountry = 152;
    const rOutCountry = 220;

    let currentAngle = -Math.PI / 2;

    const blocksToRender = activeDrillBlockId
      ? item.blocks.filter((b) => b.id === activeDrillBlockId)
      : item.blocks;

    const blockTotals: Array<{
      id: string;
      name: string;
      color: string;
      total: number;
      countries: Array<{ id: string; name: string; value: number }>;
    }> = [];

    let filteredTotal = 0;
    blocksToRender.forEach((block) => {
      let bSum = 0;
      const cList: Array<{ id: string; name: string; value: number }> = [];

      block.countries.forEach((c) => {
        const val = activeDataMap[c.id] || 0;
        if (val > 0) {
          bSum += val;
          cList.push({ id: c.id, name: c.name, value: val });
        }
      });

      cList.sort((a, b) => b.value - a.value);
      if (bSum > 0) {
        filteredTotal += bSum;
        blockTotals.push({
          id: block.id,
          name: block.name,
          color: BLOCK_COLORS[block.id] || "#64748B",
          total: bSum,
          countries: cList,
        });
      }
    });

    blockTotals.sort((a, b) => b.total - a.total);

    const bSectors: any[] = [];
    const cSectors: any[] = [];

    blockTotals.forEach((block) => {
      const angleSpan = (block.total / (filteredTotal || 1)) * (2 * Math.PI);
      const startAngle = currentAngle;
      const endAngle = currentAngle + angleSpan;

      const pathD = describeArc(cx, cy, rInBlock, rOutBlock, startAngle, endAngle);
      const globalPct = (block.total / totalGlobal) * 100;

      bSectors.push({
        id: block.id,
        name: block.name,
        color: block.color,
        value: block.total,
        globalPct,
        startAngle,
        endAngle,
        pathD,
      });

      let cCurrentAngle = startAngle;
      block.countries.forEach((country) => {
        const cAngleSpan = (country.value / (block.total || 1)) * angleSpan;
        const cStartAngle = cCurrentAngle;
        const cEndAngle = cCurrentAngle + cAngleSpan;

        const cPathD = describeArc(cx, cy, rInCountry, rOutCountry, cStartAngle, cEndAngle);
        const cGlobalPct = (country.value / totalGlobal) * 100;
        const cParentPct = (country.value / block.total) * 100;

        cSectors.push({
          id: country.id,
          name: country.name,
          blockId: block.id,
          blockName: block.name,
          color: block.color,
          value: country.value,
          globalPct: cGlobalPct,
          parentPct: cParentPct,
          startAngle: cStartAngle,
          endAngle: cEndAngle,
          pathD: cPathD,
        });

        cCurrentAngle = cEndAngle;
      });

      currentAngle = endAngle;
    });

    return { blockSectors: bSectors, countrySectors: cSectors, blockRankings: blockTotals };
  }, [item, activeDataMap, totalArrivals, activeDrillBlockId]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl space-y-6">
      {/* Header & Drilldown Reset */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <PieChart className="w-4 h-4 text-purple-400" />
            Distribución Concéntrica (Anillo 1: Continentes → Anillo 2: Países)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {selectedTimeframeLabel} • Visualización jerárquica de 360° del flujo migratorio hacia España.
          </p>
        </div>

        {activeDrillBlockId && (
          <button
            onClick={() => setActiveDrillBlockId(null)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Filter className="w-3.5 h-3.5" />
            Mostrar todos los continentes
          </button>
        )}
      </div>

      {/* Continents Legend Bar */}
      <div className="flex flex-wrap items-center justify-center gap-2 bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 text-xs">
        <span className="font-semibold text-slate-400 flex items-center gap-1 mr-2">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          Continentes (Anillo 1):
        </span>
        {blockRankings.map((block) => (
          <button
            key={block.id}
            onClick={() => setActiveDrillBlockId(activeDrillBlockId === block.id ? null : block.id)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border transition-all ${
              activeDrillBlockId === block.id
                ? "bg-slate-900 border-blue-500 ring-1 ring-blue-500 font-bold"
                : "bg-slate-900/60 border-slate-700 hover:bg-slate-900"
            }`}
          >
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: block.color }} />
            <span className="text-white">{block.name}</span>
            <span className="text-slate-400 font-mono text-[10px]">
              ({((block.total / (totalArrivals || 1)) * 100).toFixed(1)}%)
            </span>
          </button>
        ))}
      </div>

      {/* Sunburst Centered Canvas */}
      <div className="flex flex-col items-center justify-center relative">
        <div className="relative w-full max-w-[460px] aspect-square">
          <svg viewBox="0 0 480 480" className="w-full h-full overflow-visible">
            {/* Inner Ring (Continents) */}
            {blockSectors.map((sector) => {
              const isHovered = hoveredSector?.id === sector.id;
              const isDrilled = activeDrillBlockId === sector.id;

              return (
                <path
                  key={sector.id}
                  d={sector.pathD}
                  fill={sector.color}
                  fillOpacity={isHovered || isDrilled ? 1 : 0.88}
                  stroke="#060913"
                  strokeWidth="2.5"
                  className="cursor-pointer transition-all duration-200 hover:scale-[1.015] origin-center"
                  onMouseEnter={() =>
                    setHoveredSector({
                      type: "block",
                      name: sector.name,
                      value: sector.value,
                      globalPct: sector.globalPct,
                      color: sector.color,
                      id: sector.id,
                    })
                  }
                  onMouseLeave={() => setHoveredSector(null)}
                  onClick={() =>
                    setActiveDrillBlockId(activeDrillBlockId === sector.id ? null : sector.id)
                  }
                >
                  <title>
                    {sector.name}: {formatSpanishNumber(sector.value)} ({sector.globalPct.toFixed(1)}%)
                  </title>
                </path>
              );
            })}

            {/* Outer Ring (Countries) */}
            {countrySectors.map((sector) => {
              const isHovered = hoveredSector?.id === sector.id;
              const isPinned = pinnedCountryId === sector.id;

              return (
                <path
                  key={sector.id}
                  d={sector.pathD}
                  fill={sector.color}
                  fillOpacity={isHovered || isPinned ? 1 : 0.8}
                  stroke="#060913"
                  strokeWidth="1.5"
                  className="cursor-pointer transition-all duration-200 hover:scale-[1.02] origin-center"
                  onMouseEnter={() =>
                    setHoveredSector({
                      type: "country",
                      name: sector.name,
                      value: sector.value,
                      globalPct: sector.globalPct,
                      parentPct: sector.parentPct,
                      color: sector.color,
                      id: sector.id,
                    })
                  }
                  onMouseLeave={() => setHoveredSector(null)}
                  onClick={() =>
                    setPinnedCountryId(pinnedCountryId === sector.id ? null : sector.id)
                  }
                >
                  <title>
                    {sector.name}: {formatSpanishNumber(sector.value)} ({sector.globalPct.toFixed(1)}% del total, {sector.parentPct.toFixed(1)}% de {sector.blockName})
                  </title>
                </path>
              );
            })}

            {/* Center Circle */}
            <circle cx="240" cy="240" r="70" fill="#060913" className="drop-shadow-lg" />
            <g className="text-center pointer-events-none">
              <text
                x="240"
                y="220"
                textAnchor="middle"
                className="text-[11px] font-bold fill-slate-400 uppercase tracking-widest"
              >
                Total Global
              </text>
              <text
                x="240"
                y="248"
                textAnchor="middle"
                className="text-lg font-black fill-white font-mono"
              >
                {formatCompactSpanish(totalArrivals)}
              </text>
              <text
                x="240"
                y="266"
                textAnchor="middle"
                className="text-[11px] font-semibold fill-slate-400"
              >
                personas
              </text>
            </g>
          </svg>
        </div>

        {/* Hover Tooltip Card */}
        <div className="h-14 mt-4 flex items-center justify-center">
          {hoveredSector ? (
            <div className="bg-slate-800 text-white rounded-xl px-4 py-2 text-center text-xs shadow-lg flex items-center gap-2 border border-slate-700">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: hoveredSector.color }} />
              <div>
                <span className="font-bold">{hoveredSector.name}: </span>
                <span className="font-mono text-yellow-300 font-semibold">
                  {formatSpanishNumber(hoveredSector.value)} personas
                </span>
                <span className="text-slate-400 ml-1.5 font-mono">
                  ({hoveredSector.globalPct.toFixed(1)}% del total
                  {hoveredSector.parentPct !== undefined ? `, ${hoveredSector.parentPct.toFixed(1)}% del bloque` : ""})
                </span>
              </div>
            </div>
          ) : (
            <span className="text-xs text-slate-500 italic">
              Pasa el cursor sobre los anillos concéntricos o haz clic en un continente para filtrar.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
