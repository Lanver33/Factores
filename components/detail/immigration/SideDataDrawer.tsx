"use client";

import { useState, useMemo } from "react";
import {
  ImmigrationItem,
  COUNTRY_GEO_MAP,
  formatSpanishNumber,
  formatCompactSpanish,
} from "./utils";
import {
  Search,
  Filter,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  X,
  Globe,
  Sliders,
} from "lucide-react";

interface SideDataDrawerProps {
  item: ImmigrationItem;
  selectedTimeframeLabel: string;
  activeDataMap: Record<string, number>;
  totalArrivals: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedBlockFilter: string;
  setSelectedBlockFilter: (b: string) => void;
  minVolumeThreshold: number;
  setMinVolumeThreshold: (v: number) => void;
  pinnedCountryId: string | null;
  setPinnedCountryId: (cId: string | null) => void;
  hoveredCountryId: string | null;
  setHoveredCountryId: (cId: string | null) => void;
  onResetView: () => void;
}

// Continent/Block color mapping with distinction between Hispanic & Non-Hispanic Americas
const BLOCK_COLORS: Record<string, { name: string; bg: string; text: string; bar: string }> = {
  "america-hispanohablante": {
    name: "América (Hispanohablante)",
    bg: "bg-blue-950/80",
    text: "text-blue-400",
    bar: "#2563EB",
  },
  "america-no-hispanohablante": {
    name: "América (No Hispana)",
    bg: "bg-purple-950/80",
    text: "text-purple-400",
    bar: "#7C3AED",
  },
  europa: {
    name: "Europa",
    bg: "bg-cyan-950/80",
    text: "text-cyan-400",
    bar: "#0891B2",
  },
  africa: {
    name: "África",
    bg: "bg-emerald-950/80",
    text: "text-emerald-400",
    bar: "#059669",
  },
  asia: {
    name: "Asia",
    bg: "bg-amber-950/80",
    text: "text-amber-400",
    bar: "#D97706",
  },
  oceania: {
    name: "Oceanía",
    bg: "bg-slate-800",
    text: "text-slate-400",
    bar: "#64748B",
  },
};

export default function SideDataDrawer({
  item,
  selectedTimeframeLabel,
  activeDataMap,
  totalArrivals,
  searchQuery,
  setSearchQuery,
  selectedBlockFilter,
  setSelectedBlockFilter,
  minVolumeThreshold,
  setMinVolumeThreshold,
  pinnedCountryId,
  setPinnedCountryId,
  hoveredCountryId,
  setHoveredCountryId,
  onResetView,
}: SideDataDrawerProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Filter and rank origin countries
  const rankedCountries = useMemo(() => {
    return Object.entries(activeDataMap)
      .map(([cId, vol]) => {
        const geo = COUNTRY_GEO_MAP[cId];
        const pct = totalArrivals > 0 ? (vol / totalArrivals) * 100 : 0;
        const bId = geo?.blockId || "oceania";
        return {
          id: cId,
          name: geo?.name || cId,
          blockId: bId,
          blockName: geo?.blockName || "Otros",
          value: vol,
          pct,
          colorInfo: BLOCK_COLORS[bId] || BLOCK_COLORS.oceania,
        };
      })
      .filter((c) => {
        if (c.value <= 0) return false;
        if (c.value < minVolumeThreshold) return false;
        if (selectedBlockFilter && c.blockId !== selectedBlockFilter) return false;
        if (
          searchQuery &&
          !c.name.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.value - a.value);
  }, [activeDataMap, totalArrivals, searchQuery, selectedBlockFilter, minVolumeThreshold]);

  const maxRankedVal = rankedCountries[0]?.value || 1;

  return (
    <div
      className={`bg-slate-900 border border-slate-800 rounded-2xl text-white shadow-2xl flex flex-col transition-all duration-300 relative ${
        isOpen ? "w-full lg:w-96" : "w-full lg:w-12"
      }`}
    >
      {/* Toggle Button for Desktop */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hidden lg:flex absolute -left-3 top-6 w-6 h-6 rounded-full bg-blue-600 hover:bg-blue-500 text-white items-center justify-center shadow-lg z-20 transition-transform"
        title={isOpen ? "Colapsar panel" : "Expandir panel"}
      >
        {isOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Collapsed State Icon */}
      {!isOpen && (
        <div className="hidden lg:flex flex-col items-center py-6 gap-4">
          <Globe className="w-5 h-5 text-blue-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 [writing-mode:vertical-lr]">
            Datos de Origen
          </span>
        </div>
      )}

      {/* Expanded Content Drawer */}
      {isOpen && (
        <div className="p-4 sm:p-5 flex flex-col gap-4 h-full">
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400" />
                Orígenes de Inmigración
              </h3>
              <span className="text-xs font-semibold text-slate-400">
                {selectedTimeframeLabel} • Total: {formatSpanishNumber(totalArrivals)}
              </span>
            </div>

            <button
              onClick={onResetView}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors"
              title="Restablecer filtros y vista"
            >
              <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
              Reset
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar país de origen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/90 text-xs text-white pl-9 pr-8 py-2 rounded-xl border border-slate-700/80 focus:outline-none focus:border-blue-500 placeholder-slate-500 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Region Block Filter */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <Filter className="w-3 h-3 text-blue-400" />
              Filtrar por Región:
            </span>
            <select
              value={selectedBlockFilter}
              onChange={(e) => setSelectedBlockFilter(e.target.value)}
              className="w-full bg-slate-800 text-xs font-semibold text-white border border-slate-700 rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-500"
            >
              <option value="">Todas las regiones globales</option>
              {item.blocks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Volume Threshold Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-semibold text-slate-400">
              <span className="flex items-center gap-1">
                <Sliders className="w-3 h-3 text-blue-400" />
                Volumen mín.:
              </span>
              <span className="font-mono text-white">
                {minVolumeThreshold > 0
                  ? `>= ${formatCompactSpanish(minVolumeThreshold)}`
                  : "Todos"}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="50000"
              step="1000"
              value={minVolumeThreshold}
              onChange={(e) => setMinVolumeThreshold(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Ranked Country List */}
          <div className="flex-1 space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {rankedCountries.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No hay países de origen para el filtro seleccionado.
              </div>
            ) : (
              rankedCountries.map((c, idx) => {
                const isPinned = pinnedCountryId === c.id;
                const isHovered = hoveredCountryId === c.id;

                return (
                  <div
                    key={c.id}
                    onMouseEnter={() => setHoveredCountryId(c.id)}
                    onMouseLeave={() => setHoveredCountryId(null)}
                    onClick={() =>
                      setPinnedCountryId(isPinned ? null : c.id)
                    }
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isPinned
                        ? "bg-blue-950/80 border-blue-500 ring-1 ring-blue-500 shadow-md"
                        : isHovered
                        ? "bg-slate-800/90 border-slate-700"
                        : "bg-slate-800/40 border-slate-800 hover:bg-slate-800/70"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-[10px] font-mono font-bold text-slate-500 w-4 text-right">
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-white truncate">
                          {c.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono font-semibold">
                        <span className="text-blue-300">
                          {formatSpanishNumber(c.value)}
                        </span>
                        <span className="text-[10px] text-slate-400 min-w-[36px] text-right">
                          {c.pct.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Block Badge & Progress Bar */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span className={`px-1.5 py-0.5 rounded font-medium ${c.colorInfo.bg} ${c.colorInfo.text}`}>
                        {c.blockName}
                      </span>
                    </div>

                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${(c.value / maxRankedVal) * 100}%`,
                          backgroundColor: c.colorInfo.bar,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
