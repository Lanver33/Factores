"use client";

import { useState, useMemo } from "react";
import {
  ImmigrationItem,
  formatSpanishNumber,
  formatCompactSpanish,
  describeArc,
} from "./utils";
import { PieChart, Search, X, Sparkles } from "lucide-react";
import { t, Lang } from "@/lib/i18n";

interface ContinentCountrySplitViewProps {
  item: ImmigrationItem;
  activeDataMap: Record<string, number>;
  totalArrivals: number;
  pinnedCountryId: string | null;
  setPinnedCountryId: (cId: string | null) => void;
  hoveredCountryId: string | null;
  setHoveredCountryId: (cId: string | null) => void;
  selectedTimeframeLabel: string;
  lang?: Lang;
}

const BLOCK_COLORS: Record<string, string> = {
  "america-hispanohablante": "#2563EB", // Blue
  "america-no-hispanohablante": "#7C3AED", // Purple
  europa: "#0891B2", // Cyan
  africa: "#059669", // Emerald
  asia: "#D97706", // Amber
  oceania: "#64748B", // Slate
};

const BLOCK_NAMES_MAP: Record<string, string> = {
  "america-hispanohablante": "América (Hispanohablante)",
  "america-no-hispanohablante": "América (No Hispanohablante)",
  europa: "Europa",
  africa: "África",
  asia: "Asia",
  oceania: "Oceanía",
};

export default function ContinentCountrySplitView({
  item,
  activeDataMap,
  totalArrivals,
  pinnedCountryId,
  setPinnedCountryId,
  hoveredCountryId,
  setHoveredCountryId,
  selectedTimeframeLabel,
  lang = "es",
}: ContinentCountrySplitViewProps) {
  const [activeBlockFilter, setActiveBlockFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [hoveredSectorId, setHoveredSectorId] = useState<string | null>(null);

  // 1. Process block and country data
  const { blockSectors, allCountriesList } = useMemo(() => {
    const totalGlobal = totalArrivals || 1;
    let currentAngle = -Math.PI / 2;

    const blockTotals: Array<{
      id: string;
      name: string;
      color: string;
      total: number;
      countries: Array<{ id: string; name: string; value: number; globalPct: number; parentPct: number }>;
    }> = [];

    let filteredTotal = 0;
    item.blocks.forEach((block) => {
      let bSum = 0;
      const cList: Array<{ id: string; name: string; value: number; globalPct: number; parentPct: number }> = [];

      block.countries.forEach((c) => {
        const val = activeDataMap[c.id] || 0;
        if (val > 0) {
          bSum += val;
        }
      });

      block.countries.forEach((c) => {
        // Exclude residual "Rest of..." aggregate categories from individual country ranking list
        if (c.id.startsWith("resto-de-")) return;

        const val = activeDataMap[c.id] || 0;
        if (val > 0) {
          const gPct = (val / totalGlobal) * 100;
          const pPct = bSum > 0 ? (val / bSum) * 100 : 0;
          cList.push({ id: c.id, name: c.name, value: val, globalPct: gPct, parentPct: pPct });
        }
      });

      cList.sort((a, b) => b.value - a.value);
      if (bSum > 0) {
        filteredTotal += bSum;
        blockTotals.push({
          id: block.id,
          name: BLOCK_NAMES_MAP[block.id] || block.name,
          color: BLOCK_COLORS[block.id] || "#64748B",
          total: bSum,
          countries: cList,
        });
      }
    });

    blockTotals.sort((a, b) => b.total - a.total);

    const bSectors: any[] = [];
    const flatCountries: Array<{
      id: string;
      name: string;
      value: number;
      globalPct: number;
      parentPct: number;
      blockId: string;
      blockName: string;
      color: string;
    }> = [];

    blockTotals.forEach((block) => {
      const angleSpan = (block.total / (filteredTotal || 1)) * (2 * Math.PI);
      const startAngle = currentAngle;
      const endAngle = currentAngle + angleSpan;
      const pathD = describeArc(160, 160, 72, 118, startAngle, endAngle);
      const globalPct = (block.total / totalGlobal) * 100;

      bSectors.push({
        id: block.id,
        name: block.name,
        color: block.color,
        value: block.total,
        globalPct,
        startAngle,
        endAngle,
        angleSpan,
        pathD,
      });

      block.countries.forEach((c) => {
        if (c.id.startsWith("resto-de-")) return;
        flatCountries.push({
          ...c,
          blockId: block.id,
          blockName: block.name,
          color: block.color,
        });
      });

      currentAngle = endAngle;
    });

    flatCountries.sort((a, b) => b.value - a.value);

    return { blockSectors: bSectors, allCountriesList: flatCountries };
  }, [item, activeDataMap, totalArrivals]);

  // 2. Filtered countries for the right panel (showing all individual countries without residual aggregate groups)
  const { visibleCountries, maxCountryVal } = useMemo(() => {
    let filtered = allCountriesList;

    if (activeBlockFilter) {
      filtered = filtered.filter((c) => c.blockId === activeBlockFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((c) => c.name.toLowerCase().includes(q));
    }

    const mVal = filtered[0]?.value || 1;

    return {
      visibleCountries: filtered,
      maxCountryVal: mVal,
    };
  }, [allCountriesList, activeBlockFilter, searchQuery]);

  const formatPct = (val: number) => {
    const formatted = val.toFixed(1);
    return lang === "es" ? formatted.replace(".", ",") + "%" : formatted + "%";
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 text-white shadow-xl space-y-6">
      {/* Top Header & Timeframe / Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <PieChart className="w-4 h-4 text-purple-400" />
            {lang === "en" ? "Continent Donut & Ranked Countries" : "Donut de Continentes y Ranking de Países"}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {selectedTimeframeLabel} • {lang === "en" ? "Interactive geographic breakdown and detailed origin ranking." : "Desglose geográfico interactivo y ranking detallado de origen."}
          </p>
        </div>

        {(activeBlockFilter || searchQuery) && (
          <button
            onClick={() => {
              setActiveBlockFilter(null);
              setSearchQuery("");
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 hover:bg-blue-500/30 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <X className="w-3.5 h-3.5" />
            {t("resetFilter", lang)}
          </button>
        )}
      </div>

      {/* Responsive 2-Column Split Dashboard (Grid 12: 5 left, 7 right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT PANEL: Single-Ring Continent Donut + Vertical Breakdown List (5 columns) */}
        <div className="lg:col-span-5 bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              {t("breakdownContinents", lang)}
            </span>
            {activeBlockFilter && (
              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30 font-semibold">
                {BLOCK_NAMES_MAP[activeBlockFilter]}
              </span>
            )}
          </div>

          {/* Clean Donut with zero overflow */}
          <div className="relative w-full max-w-[260px] aspect-square mx-auto flex items-center justify-center">
            <svg viewBox="0 0 320 320" className="w-full h-full">
              {blockSectors.map((sector) => {
                const isActive = activeBlockFilter === sector.id;
                const isHovered = hoveredSectorId === sector.id;
                const hasActiveFilter = activeBlockFilter !== null;

                let opacity = 0.9;
                if (hasActiveFilter && !isActive) opacity = 0.25;
                if (isHovered) opacity = 1;

                return (
                  <path
                    key={`donut-${sector.id}`}
                    d={sector.pathD}
                    fill={sector.color}
                    fillOpacity={opacity}
                    stroke="#090d16"
                    strokeWidth="2.5"
                    className="cursor-pointer transition-all duration-200 hover:scale-[1.015] origin-center"
                    onClick={() =>
                      setActiveBlockFilter(activeBlockFilter === sector.id ? null : sector.id)
                    }
                    onMouseEnter={() => setHoveredSectorId(sector.id)}
                    onMouseLeave={() => setHoveredSectorId(null)}
                  >
                    <title>
                      {sector.name}: {formatSpanishNumber(sector.value)} {t("pers", lang)} ({sector.globalPct.toFixed(1)}%)
                    </title>
                  </path>
                );
              })}

              {/* Center KPI Readout */}
              <circle cx="160" cy="160" r="62" fill="#060913" className="drop-shadow-md" />
              <text
                x="160"
                y="142"
                textAnchor="middle"
                className="text-[10px] font-bold fill-slate-400 uppercase tracking-widest"
              >
                {t("totalGlobal", lang)}
              </text>
              <text
                x="160"
                y="168"
                textAnchor="middle"
                className="text-xl font-black fill-white font-mono"
              >
                {formatCompactSpanish(totalArrivals)}
              </text>
              <text
                x="160"
                y="185"
                textAnchor="middle"
                className="text-[10px] font-semibold fill-slate-400"
              >
                {t("people", lang)}
              </text>
            </svg>
          </div>

          {/* Interactive Vertical Breakdown List below Donut (fills dead space & acts as clean filter) */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
            {blockSectors.map((sector) => {
              const isActive = activeBlockFilter === sector.id;
              const isHovered = hoveredSectorId === sector.id;

              return (
                <div
                  key={`block-row-${sector.id}`}
                  onClick={() => setActiveBlockFilter(activeBlockFilter === sector.id ? null : sector.id)}
                  onMouseEnter={() => setHoveredSectorId(sector.id)}
                  onMouseLeave={() => setHoveredSectorId(null)}
                  className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                    isActive
                      ? "bg-purple-950/40 border-purple-500/80 ring-1 ring-purple-500/50 font-bold"
                      : isHovered
                      ? "bg-slate-900 border-slate-700"
                      : "bg-slate-900/40 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: sector.color }} />
                    <span className="text-white truncate">{sector.name}</span>
                  </div>
                  <div className="flex items-center gap-2.5 font-mono flex-shrink-0">
                    <span className="text-slate-400 text-[11px]">{formatSpanishNumber(sector.value)} {t("pers", lang)}</span>
                    <span className="text-white font-bold w-12 text-right">{formatPct(sector.globalPct)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANEL: Ranked Countries (7 columns) */}
        <div className="lg:col-span-7 bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 flex flex-col space-y-4">
          
          {/* Header & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                {t("originCountriesRanking", lang)}
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {visibleCountries.length} {lang === "en" ? "countries listed" : "países listados"}
                {activeBlockFilter ? ` • ${BLOCK_NAMES_MAP[activeBlockFilter]}` : ""}
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t("searchCountry", lang)}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Country Ranking Rows Scrollable Container (increased height to max-h-[520px]) */}
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {visibleCountries.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs italic">
                {lang === "en" ? "No countries match current filter or search." : "Ningún país coincide con el filtro o búsqueda actual."}
              </div>
            ) : (
              visibleCountries.map((country, idx) => {
                const isHovered = hoveredCountryId === country.id;
                const isPinned = pinnedCountryId === country.id;
                const barWidthPct = Math.max(4, Math.min(100, (country.value / (maxCountryVal || 1)) * 100));

                return (
                  <div
                    key={country.id}
                    onMouseEnter={() => setHoveredCountryId(country.id)}
                    onMouseLeave={() => setHoveredCountryId(null)}
                    onClick={() => setPinnedCountryId(pinnedCountryId === country.id ? null : country.id)}
                    className={`py-2.5 px-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isPinned
                        ? "bg-blue-950/60 border-blue-500 ring-1 ring-blue-500 shadow-md"
                        : isHovered
                        ? "bg-slate-900/90 border-slate-700"
                        : "bg-slate-900/50 border-slate-800/80 hover:border-slate-700"
                    }`}
                  >
                    {/* Left: Rank, Name, Headcount */}
                    <div className="flex items-center gap-3 min-w-[170px] sm:min-w-[200px] truncate">
                      <span className="text-xs font-mono font-bold text-slate-500 w-5 flex-shrink-0">
                        #{idx + 1}
                      </span>
                      <div className="truncate">
                        <div className="text-xs font-bold text-white truncate">{country.name}</div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {formatSpanishNumber(country.value)} {t("pers", lang)}
                        </div>
                      </div>
                    </div>

                    {/* Center: Proportional Progress Bar colored by continent */}
                    <div className="flex-1 hidden sm:block px-2">
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${barWidthPct}%`,
                            backgroundColor: country.color,
                          }}
                        />
                      </div>
                    </div>

                    {/* Right: Tabular Percentage */}
                    <div className="text-right flex-shrink-0 min-w-[60px]">
                      <span className="text-xs font-mono font-bold text-white tabular-nums">
                        {formatPct(country.globalPct)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
