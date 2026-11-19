"use client";

import { useState, useMemo } from "react";
import {
  ImmigrationItem,
  formatSpanishNumber,
  formatCompactSpanish,
  describeArc,
} from "./utils";
import { PieChart, Search, X, ChevronDown, ChevronUp, Sparkles, Filter } from "lucide-react";
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
  const [showAllLongTail, setShowAllLongTail] = useState<boolean>(false);
  const [hoveredSectorId, setHoveredSectorId] = useState<string | null>(null);

  // 1. Process block and country data
  const { blockSectors, allCountriesList, blockRankings } = useMemo(() => {
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
      const pathD = describeArc(200, 200, 72, 122, startAngle, endAngle);
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

    return { blockSectors: bSectors, allCountriesList: flatCountries, blockRankings: blockTotals };
  }, [item, activeDataMap, totalArrivals]);

  // 2. Computed callout positions with anti-collision (minGap >= 38px)
  const calloutsWithPositions = useMemo(() => {
    const cx = 200;
    const cy = 200;
    const rMid = (72 + 122) / 2; // 97

    const raw = blockSectors.map((sector) => {
      const midAngle = (sector.startAngle + sector.endAngle) / 2;
      const x1 = cx + 122 * Math.cos(midAngle);
      const y1 = cy + 122 * Math.sin(midAngle);
      const isLeft = Math.cos(midAngle) < 0;
      const xElbow = isLeft ? 45 : 355;
      const xLabel = isLeft ? 10 : 390;

      return {
        ...sector,
        midAngle,
        x1,
        y1,
        xElbow,
        xLabel,
        isLeft,
        yDesired: cy + rMid * Math.sin(midAngle),
      };
    });

    const leftItems = raw.filter((i) => i.isLeft).sort((a, b) => a.yDesired - b.yDesired);
    const rightItems = raw.filter((i) => !i.isLeft).sort((a, b) => a.yDesired - b.yDesired);

    const relax = (items: typeof raw, minY: number, maxY: number) => {
      let currentY = minY;
      return items.map((item) => {
        let y = Math.max(item.yDesired, currentY);
        if (y > maxY) y = maxY;
        currentY = y + 40; // minGap >= 38px
        return { ...item, finalY: y };
      });
    };

    const relaxedLeft = relax(leftItems, 45, 355);
    const relaxedRight = relax(rightItems, 45, 355);

    return [...relaxedLeft, ...relaxedRight];
  }, [blockSectors]);

  // 3. Filtered countries for the right panel
  const { visibleCountries, longTailCountries, longTailSum, longTailCount, maxCountryVal } = useMemo(() => {
    let filtered = allCountriesList;

    if (activeBlockFilter) {
      filtered = filtered.filter((c) => c.blockId === activeBlockFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((c) => c.name.toLowerCase().includes(q));
    }

    const mVal = filtered[0]?.value || 1;

    // If search or continent filter is active, show all matching without long-tail collapsing
    if (activeBlockFilter || searchQuery.trim().length > 0 || showAllLongTail) {
      return {
        visibleCountries: filtered,
        longTailCountries: [],
        longTailSum: 0,
        longTailCount: 0,
        maxCountryVal: mVal,
      };
    }

    // Default long-tail grouping: threshold global share < 1.5% (or index > 11)
    const thresholdPct = 1.5;
    const mainList = filtered.filter((c) => c.globalPct >= thresholdPct || filtered.indexOf(c) < 10);
    const tailList = filtered.filter((c) => !mainList.includes(c));

    const tSum = tailList.reduce((acc, c) => acc + c.value, 0);

    return {
      visibleCountries: mainList,
      longTailCountries: tailList,
      longTailSum: tSum,
      longTailCount: tailList.length,
      maxCountryVal: mVal,
    };
  }, [allCountriesList, activeBlockFilter, searchQuery, showAllLongTail]);

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
        
        {/* LEFT PANEL: Single-Ring Continent Donut (5 columns on desktop) */}
        <div className="lg:col-span-5 bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 flex flex-col items-center justify-between relative min-h-[420px]">
          <div className="w-full flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
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

          <div className="relative w-full max-w-[400px] aspect-square flex items-center justify-center my-auto">
            <svg viewBox="0 0 400 400" className="w-full h-full overflow-visible">
              {/* Donut Slices */}
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
              <circle cx="200" cy="200" r="68" fill="#060913" className="drop-shadow-md" />
              <text
                x="200"
                y="182"
                textAnchor="middle"
                className="text-[10px] font-bold fill-slate-400 uppercase tracking-widest"
              >
                {t("totalGlobal", lang)}
              </text>
              <text
                x="200"
                y="208"
                textAnchor="middle"
                className="text-xl font-black fill-white font-mono"
              >
                {formatCompactSpanish(totalArrivals)}
              </text>
              <text
                x="200"
                y="226"
                textAnchor="middle"
                className="text-[10px] font-semibold fill-slate-400"
              >
                {t("people", lang)}
              </text>

              {/* External Callout Leader Lines & Labels */}
              {calloutsWithPositions.map((item) => {
                const isActive = activeBlockFilter === item.id;
                const isHovered = hoveredSectorId === item.id;

                const pathD = `M ${item.x1} ${item.y1} L ${item.xElbow} ${item.finalY} L ${item.xLabel} ${item.finalY}`;
                const textAnchor = item.isLeft ? "end" : "start";
                const labelX = item.isLeft ? item.xLabel - 4 : item.xLabel + 4;

                return (
                  <g key={`callout-${item.id}`} className="cursor-pointer" onClick={() => setActiveBlockFilter(activeBlockFilter === item.id ? null : item.id)}>
                    {/* Elbow Leader Line */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={isActive || isHovered ? item.color : "#475569"}
                      strokeWidth={isActive || isHovered ? "2" : "1.25"}
                      strokeOpacity="0.8"
                    />
                    {/* Dot on arc */}
                    <circle cx={item.x1} cy={item.y1} r="3" fill={item.color} />

                    {/* 3-line Callout Label */}
                    <text
                      x={labelX}
                      y={item.finalY}
                      textAnchor={textAnchor}
                      dominantBaseline="central"
                      className="text-[11px] select-none"
                    >
                      {/* Line 1: Continent Name */}
                      <tspan
                        x={labelX}
                        dy="-1em"
                        className={`font-bold ${isActive || isHovered ? "fill-white" : "fill-slate-200"}`}
                      >
                        {item.name}
                      </tspan>
                      {/* Line 2 & 3 combined neatly */}
                      <tspan
                        x={labelX}
                        dy="1.2em"
                        className="font-mono font-bold"
                        style={{ fill: item.color }}
                      >
                        {formatPct(item.globalPct)}
                      </tspan>
                      <tspan
                        dx="4"
                        className="font-mono text-[10px] fill-slate-400"
                      >
                        ({formatSpanishNumber(item.value)} {t("pers", lang)})
                      </tspan>
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="w-full text-center mt-3 pt-2 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-400 italic">
              {lang === "en" ? "Click any donut slice or callout to filter countries." : "Haz clic en un sector del donut o etiqueta para filtrar países."}
            </span>
          </div>
        </div>

        {/* RIGHT PANEL: Ranked Countries & Long-Tail Grouping (7 columns on desktop) */}
        <div className="lg:col-span-7 bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 flex flex-col space-y-4">
          
          {/* Header & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                {t("originCountriesRanking", lang)}
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {visibleCountries.length + longTailCount} {lang === "en" ? "countries listed" : "países listados"}
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

          {/* Country Ranking Rows Scrollable Container */}
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
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
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isPinned
                        ? "bg-blue-950/60 border-blue-500 ring-1 ring-blue-500 shadow-md"
                        : isHovered
                        ? "bg-slate-900/90 border-slate-700"
                        : "bg-slate-900/50 border-slate-800/80 hover:border-slate-700"
                    }`}
                  >
                    {/* Left: Rank, Name, Headcount */}
                    <div className="flex items-center gap-3 min-w-[180px] sm:min-w-[210px]">
                      <span className="text-xs font-mono font-bold text-slate-500 w-6 flex-shrink-0">
                        #{idx + 1}
                      </span>
                      <div className="truncate">
                        <div className="text-xs font-bold text-white truncate">{country.name}</div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {formatSpanishNumber(country.value)} {t("pers", lang)}
                        </div>
                      </div>
                    </div>

                    {/* Center: Proportional Progress Bar */}
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
                    <div className="text-right flex-shrink-0 min-w-[65px]">
                      <span className="text-xs font-mono font-bold text-white tabular-nums">
                        {formatPct(country.globalPct)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}

            {/* Long-Tail Summary Footer Row (< 1,5%) */}
            {longTailCountries.length > 0 && (
              <div className="border border-slate-800 bg-slate-900/80 rounded-xl p-3 space-y-2 mt-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="font-semibold text-slate-300">
                    Otros países (&lt;1,5%):{" "}
                    <span className="font-mono text-white">{formatSpanishNumber(longTailSum)} {t("pers", lang)}</span>{" "}
                    <span className="font-mono text-purple-400">({formatPct((longTailSum / totalArrivals) * 100)})</span>{" "}
                    · <span className="text-slate-400">{longTailCount} {t("countriesGrouped", lang)}</span>
                  </div>
                  <button
                    onClick={() => setShowAllLongTail(!showAllLongTail)}
                    className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                  >
                    {showAllLongTail ? t("collapse", lang) : t("showMore", lang)}
                    {showAllLongTail ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Expanded Long-Tail Individual Rows */}
                {showAllLongTail && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-800 max-h-48 overflow-y-auto pr-1">
                    {longTailCountries.map((country, tIdx) => (
                      <div
                        key={country.id}
                        onMouseEnter={() => setHoveredCountryId(country.id)}
                        onMouseLeave={() => setHoveredCountryId(null)}
                        onClick={() => setPinnedCountryId(pinnedCountryId === country.id ? null : country.id)}
                        className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs cursor-pointer hover:border-slate-700"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-mono text-slate-500 text-[11px]">{country.name}</span>
                        </div>
                        <div className="flex items-center gap-3 font-mono">
                          <span className="text-slate-400 text-[11px]">{formatSpanishNumber(country.value)} {t("pers", lang)}</span>
                          <span className="text-white font-bold">{formatPct(country.globalPct)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
