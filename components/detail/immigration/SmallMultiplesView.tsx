"use client";

import { useState, useMemo } from "react";
import {
  ImmigrationItem,
  BlockDef,
  getCountryColor,
  formatSpanishNumber,
  formatCompactSpanish,
} from "./utils";
import { Maximize2, Minimize2, Sliders, Layers } from "lucide-react";

interface SmallMultiplesViewProps {
  item: ImmigrationItem;
}

export default function SmallMultiplesView({ item }: SmallMultiplesViewProps) {
  const [scaleMode, setScaleMode] = useState<"shared" | "independent">("shared");
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [hoveredYear, setHoveredYear] = useState<string | null>(null);
  const [isolatedCountryMap, setIsolatedCountryMap] = useState<Record<string, string | null>>({});

  const years = useMemo(() => {
    return item.annualBlocks.map((d) => d.year);
  }, [item]);

  // Compute maximums for Y axis scales
  const { globalMax, blockMaxMap } = useMemo(() => {
    let gMax = 0;
    const bMax: Record<string, number> = {};

    item.blocks.forEach((b) => {
      bMax[b.id] = 0;
    });

    item.annualBlocks.forEach((ab) => {
      Object.entries(ab.blocks).forEach(([bId, bData]) => {
        if (bData.total > gMax) gMax = bData.total;
        if (bData.total > (bMax[bId] || 0)) bMax[bId] = bData.total;
      });
    });

    return { globalMax: Math.ceil(gMax * 1.05), blockMaxMap: bMax };
  }, [item]);

  const visibleBlocks = useMemo(() => {
    if (!selectedBlockId) return item.blocks;
    return item.blocks.filter((b) => b.id === selectedBlockId);
  }, [item, selectedBlockId]);

  const toggleCountryIsolation = (blockId: string, countryId: string) => {
    setIsolatedCountryMap((prev) => {
      const current = prev[blockId];
      return {
        ...prev,
        [blockId]: current === countryId ? null : countryId,
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
        {/* Continent Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setSelectedBlockId(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedBlockId === null
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            Todos los continentes
          </button>
          {item.blocks.map((block) => (
            <button
              key={block.id}
              onClick={() => setSelectedBlockId(selectedBlockId === block.id ? null : block.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                selectedBlockId === block.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: block.color }}
              />
              {block.name}
            </button>
          ))}
        </div>

        {/* Y-Axis Scale Switcher */}
        <div className="flex items-center gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200">
          <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5" />
            Eje Y:
          </span>
          <div className="bg-white border border-slate-200 rounded-lg p-0.5 flex">
            <button
              onClick={() => setScaleMode("shared")}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                scaleMode === "shared"
                  ? "bg-blue-50 text-blue-700 font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Compartida
            </button>
            <button
              onClick={() => setScaleMode("independent")}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                scaleMode === "independent"
                  ? "bg-blue-50 text-blue-700 font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Independiente
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Continent Cards */}
      <div
        className={`grid gap-6 ${
          visibleBlocks.length === 1
            ? "grid-cols-1"
            : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        }`}
      >
        {visibleBlocks.map((block) => (
          <ContinentCard
            key={block.id}
            item={item}
            block={block}
            years={years}
            scaleMode={scaleMode}
            yMax={scaleMode === "shared" ? globalMax : blockMaxMap[block.id] * 1.08}
            isZoomed={selectedBlockId === block.id}
            onToggleZoom={() =>
              setSelectedBlockId(selectedBlockId === block.id ? null : block.id)
            }
            hoveredYear={hoveredYear}
            setHoveredYear={setHoveredYear}
            isolatedCountryId={isolatedCountryMap[block.id] || null}
            onToggleCountryIsolation={(cId) => toggleCountryIsolation(block.id, cId)}
          />
        ))}
      </div>
    </div>
  );
}

interface ContinentCardProps {
  item: ImmigrationItem;
  block: BlockDef;
  years: string[];
  scaleMode: "shared" | "independent";
  yMax: number;
  isZoomed: boolean;
  onToggleZoom: () => void;
  hoveredYear: string | null;
  setHoveredYear: (y: string | null) => void;
  isolatedCountryId: string | null;
  onToggleCountryIsolation: (countryId: string) => void;
}

function ContinentCard({
  item,
  block,
  years,
  scaleMode,
  yMax,
  isZoomed,
  onToggleZoom,
  hoveredYear,
  setHoveredYear,
  isolatedCountryId,
  onToggleCountryIsolation,
}: ContinentCardProps) {
  const width = 500;
  const height = 240;
  const margin = { top: 20, right: 15, bottom: 30, left: 45 };

  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  // Extract country data points over years
  const countrySeriesList = useMemo(() => {
    return block.countries.map((c) => {
      const points = item.annualBlocks.map((ab) => {
        const bData = ab.blocks[block.id];
        const val = bData?.countries[c.id] || 0;
        return { year: ab.year, value: val };
      });
      return {
        id: c.id,
        name: c.name,
        color: getCountryColor(c.id, block.color),
        points,
      };
    });
  }, [item, block]);

  // Compute stacked polygon paths
  const stackedData = useMemo(() => {
    // For each year i, calculate stacked Y positions
    const numYears = years.length;
    const numCountries = countrySeriesList.length;

    // stackedPoints[countryIdx][yearIdx] = { y0, y1 }
    const stackedPoints: Array<Array<{ y0: number; y1: number }>> = countrySeriesList.map(
      () => []
    );

    for (let yi = 0; yi < numYears; yi++) {
      let currentY = 0;
      for (let ci = 0; ci < numCountries; ci++) {
        const val = countrySeriesList[ci].points[yi].value;
        const y0 = currentY;
        const y1 = currentY + val;
        stackedPoints[ci].push({ y0, y1 });
        currentY = y1;
      }
    }

    // Convert to SVG paths
    const getX = (yearIdx: number) =>
      margin.left + (yearIdx / (numYears - 1)) * innerW;
    const getY = (val: number) =>
      margin.top + innerH - (val / (yMax || 1)) * innerH;

    return countrySeriesList.map((c, ci) => {
      const topCoords: string[] = [];
      const bottomCoords: string[] = [];

      for (let yi = 0; yi < numYears; yi++) {
        const x = getX(yi);
        const { y0, y1 } = stackedPoints[ci][yi];
        topCoords.push(`${x},${getY(y1)}`);
        bottomCoords.unshift(`${x},${getY(y0)}`);
      }

      const pathD = `M ${topCoords.join(" L ")} L ${bottomCoords.join(" L ")} Z`;
      return {
        ...c,
        pathD,
      };
    });
  }, [countrySeriesList, years, innerW, innerH, margin, yMax]);

  // Determine year under hover
  const activeYearData = useMemo(() => {
    const activeY = hoveredYear || years[years.length - 1];
    const ab = item.annualBlocks.find((d) => d.year === activeY);
    if (!ab) return null;

    const bData = ab.blocks[block.id];
    if (!bData) return null;

    const countryList = block.countries
      .map((c) => {
        const val = bData.countries[c.id] || 0;
        const pct = bData.total > 0 ? (val / bData.total) * 100 : 0;
        return {
          id: c.id,
          name: c.name,
          color: getCountryColor(c.id, block.color),
          value: val,
          pct,
        };
      })
      .sort((a, b) => b.value - a.value);

    return {
      year: activeY,
      total: bData.total,
      countries: countryList,
    };
  }, [item, block, years, hoveredYear]);

  // Calculate guide line X position
  const hoveredYearX = useMemo(() => {
    if (!hoveredYear) return null;
    const idx = years.indexOf(hoveredYear);
    if (idx === -1) return null;
    return margin.left + (idx / (years.length - 1)) * innerW;
  }, [hoveredYear, years, innerW, margin]);

  // Y-axis tick marks
  const yTicks = useMemo(() => {
    const count = 4;
    const ticks = [];
    for (let i = 0; i <= count; i++) {
      const val = (yMax / count) * i;
      ticks.push(val);
    }
    return ticks;
  }, [yMax]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
      {/* Card Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full shadow-xs"
            style={{ backgroundColor: block.color }}
          />
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            {block.name}
          </h3>
        </div>

        <button
          onClick={onToggleZoom}
          title={isZoomed ? "Restaurar cuadrícula" : "Expandir continente"}
          className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
        >
          {isZoomed ? (
            <Minimize2 className="w-3.5 h-3.5" />
          ) : (
            <Maximize2 className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Main SVG Area Chart */}
      <div className="relative my-3" style={{ height: "220px" }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          onMouseLeave={() => setHoveredYear(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const svgX = (mouseX / rect.width) * width;

            // Find closest year
            let closestYear = years[0];
            let minDiff = Infinity;
            years.forEach((y, idx) => {
              const yearX = margin.left + (idx / (years.length - 1)) * innerW;
              const diff = Math.abs(svgX - yearX);
              if (diff < minDiff) {
                minDiff = diff;
                closestYear = y;
              }
            });
            setHoveredYear(closestYear);
          }}
        >
          {/* Y Axis Grid Lines */}
          {yTicks.map((tick, i) => {
            const yPos = margin.top + innerH - (tick / yMax) * innerH;
            return (
              <g key={i}>
                <line
                  x1={margin.left}
                  y1={yPos}
                  x2={width - margin.right}
                  y2={yPos}
                  stroke="#F1F5F9"
                  strokeWidth="1"
                  strokeDasharray={i === 0 ? "none" : "3,3"}
                />
                <text
                  x={margin.left - 6}
                  y={yPos + 3}
                  textAnchor="end"
                  className="text-[10px] fill-slate-500 font-medium"
                >
                  {formatCompactSpanish(tick)}
                </text>
              </g>
            );
          })}

          {/* Stacked Area Layers */}
          {stackedData.map((layer) => {
            const isIsolated = isolatedCountryId === layer.id;
            const isDimmed = isolatedCountryId !== null && !isIsolated;

            return (
              <path
                key={layer.id}
                d={layer.pathD}
                fill={layer.color}
                fillOpacity={isIsolated ? 0.95 : isDimmed ? 0.15 : 0.75}
                stroke={layer.color}
                strokeWidth={isIsolated ? 2 : 1}
                className="transition-all duration-200 cursor-pointer"
                onClick={() => onToggleCountryIsolation(layer.id)}
              >
                <title>{layer.name}</title>
              </path>
            );
          })}

          {/* X Axis Labels */}
          {years.map((y, idx) => {
            if (idx % 3 !== 0 && idx !== years.length - 1) return null;
            const xPos = margin.left + (idx / (years.length - 1)) * innerW;
            return (
              <text
                key={y}
                x={xPos}
                y={height - 8}
                textAnchor="middle"
                className="text-[10px] fill-slate-500 font-medium"
              >
                {y}
              </text>
            );
          })}

          {/* Hover Line */}
          {hoveredYearX !== null && (
            <line
              x1={hoveredYearX}
              y1={margin.top}
              x2={hoveredYearX}
              y2={margin.top + innerH}
              stroke="#0F172A"
              strokeWidth="1.5"
              strokeDasharray="4,4"
              className="pointer-events-none"
            />
          )}
        </svg>

        {/* Floating Tooltip when Hovered */}
        {activeYearData && hoveredYear && (
          <div className="absolute top-2 right-2 bg-slate-900/95 text-white text-[11px] rounded-lg p-2.5 shadow-lg backdrop-blur-xs max-w-[210px] pointer-events-none z-10 space-y-1.5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between font-bold border-b border-slate-700/80 pb-1">
              <span>Año {activeYearData.year}</span>
              <span className="text-blue-300">
                {formatSpanishNumber(activeYearData.total)}
              </span>
            </div>
            <div className="space-y-1 max-h-36 overflow-y-auto">
              {activeYearData.countries.map((c) => (
                <div
                  key={c.id}
                  className={`flex items-center justify-between gap-2 text-[10px] ${
                    isolatedCountryId === c.id
                      ? "font-bold text-yellow-300"
                      : "text-slate-300"
                  }`}
                >
                  <span className="truncate flex items-center gap-1">
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: c.color }}
                    />
                    {c.name}
                  </span>
                  <span className="flex-shrink-0 font-mono">
                    {formatSpanishNumber(c.value)} ({c.pct.toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Interactive Legend for Country Isolation */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-1.5 text-[11px]">
        {block.countries.map((c) => {
          const color = getCountryColor(c.id, block.color);
          const isIsolated = isolatedCountryId === c.id;
          const isDimmed = isolatedCountryId !== null && !isIsolated;

          return (
            <button
              key={c.id}
              onClick={() => onToggleCountryIsolation(c.id)}
              className={`px-2 py-0.5 rounded-md font-medium transition-all flex items-center gap-1 text-left ${
                isIsolated
                  ? "bg-slate-900 text-white shadow-xs font-bold ring-2 ring-offset-1 ring-slate-900"
                  : isDimmed
                  ? "bg-slate-50 text-slate-500 opacity-40 hover:opacity-100 border border-slate-200"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="truncate max-w-[120px]">{c.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
