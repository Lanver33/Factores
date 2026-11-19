"use client";

import { useState, useMemo } from "react";
import {
  font_dest,
  projectCoordinates,
  formatSpanishNumber,
  COUNTRY_GEO_MAP,
} from "./utils";
import { getChoroplethCountryPolygons } from "./worldMapRenderer";
import { getJenksBreaks } from "./jenks";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  MapPin,
  Globe,
  Sparkles,
} from "lucide-react";

interface WebGisChronoArcsProps {
  timeframeLabel: string;
  activeDataMap: Record<string, number>;
  totalArrivals: number;
  hoveredCountryId: string | null;
  setHoveredCountryId: (cId: string | null) => void;
  pinnedCountryId: string | null;
  setPinnedCountryId: (cId: string | null) => void;
  searchQuery: string;
  selectedBlockFilter: string;
  minVolumeThreshold: number;
}

const PALETTE = ["#0284c7", "#2563eb", "#7c3aed", "#c026d3", "#db2777"];

export default function WebGisChronoArcs({
  timeframeLabel,
  activeDataMap,
  hoveredCountryId,
  setHoveredCountryId,
  pinnedCountryId,
  setPinnedCountryId,
}: WebGisChronoArcsProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredLegendSegment, setHoveredLegendSegment] = useState<number | null>(null);

  const svgWidth = 1000;
  const svgHeight = 580;

  // Real Natural Earth country polygons
  const countryPolygons = useMemo(() => {
    return getChoroplethCountryPolygons(svgWidth, svgHeight, zoom, pan.x, pan.y);
  }, [svgWidth, svgHeight, zoom, pan]);

  // Compute Jenks Natural Breaks (k = 5) excluding zero/null/spain
  const { breaks, minVal, maxVal } = useMemo(() => {
    const vals = Object.entries(activeDataMap)
      .filter(([cId, v]) => cId !== "spain" && v > 0)
      .map(([_, v]) => v)
      .sort((a, b) => a - b);

    if (vals.length === 0) {
      return { breaks: [0, 0, 0, 0], minVal: 0, maxVal: 0 };
    }

    const min = vals[0];
    const max = vals[vals.length - 1];
    const rawBreaks = getJenksBreaks(vals, 5);

    // Ensure we have up to 4 cut points for 5 classes
    const cuts = rawBreaks.slice(0, 4);
    while (cuts.length < 4 && vals.length > 1) {
      const last = cuts[cuts.length - 1] || min;
      cuts.push(Math.round((last + max) / 2));
    }

    return { breaks: cuts, minVal: min, maxVal: max };
  }, [activeDataMap]);

  // Assign Jenks class index (0 to 4)
  const getJenksClassIndex = (val: number) => {
    if (!val || val <= 0) return -1;
    const [c1, c2, c3, c4] = breaks;
    if (val <= (c1 || val)) return 0;
    if (val <= (c2 || val)) return 1;
    if (val <= (c3 || val)) return 2;
    if (val <= (c4 || val)) return 3;
    return 4;
  };

  const getChoroplethColorAndLabel = (val: number, isSpain = false) => {
    if (isSpain || !val || val <= 0) {
      return { color: "#1e293b", label: "Sin registro", classIdx: -1 };
    }
    const idx = getJenksClassIndex(val);
    return {
      color: PALETTE[idx] || PALETTE[0],
      label: `${formatSpanishNumber(val)} personas`,
      classIdx: idx,
    };
  };

  function formatCompact(num: number): string {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
    return num.toLocaleString("es-ES");
  }

  const activeHighlightId = pinnedCountryId || hoveredCountryId;

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Continuous Legend Segments data
  const legendSegments = useMemo(() => {
    if (breaks.length < 4) return [];
    const [c1, c2, c3, c4] = breaks;
    return [
      { color: PALETTE[0], range: `${formatCompact(minVal)} – ${formatCompact(c1)}` },
      { color: PALETTE[1], range: `${formatCompact(c1)} – ${formatCompact(c2)}` },
      { color: PALETTE[2], range: `${formatCompact(c2)} – ${formatCompact(c3)}` },
      { color: PALETTE[3], range: `${formatCompact(c3)} – ${formatCompact(c4)}` },
      { color: PALETTE[4], range: `> ${formatCompact(c4)}` },
    ];
  }, [breaks, minVal]);

  return (
    <div className="relative bg-[#060913] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between select-none">
      {/* Map Control Bar Overlay */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2 bg-slate-900/95 backdrop-blur-md p-2 rounded-xl border border-slate-700/80 shadow-xl">
        <button
          onClick={() => setZoom((z) => Math.min(3, z + 0.3))}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          title="Acercar mapa (+)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.7, z - 0.3))}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          title="Alejar mapa (-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          title="Restablecer encuadre"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-slate-700 my-auto mx-1" />

        <div className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-600 text-white shadow-xs flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5" />
          <span>Mapa Coroplético por Cortes Naturales</span>
        </div>
      </div>

      {/* Main SVG Choropleth Canvas */}
      <div
        className="w-full h-[500px] sm:h-[580px] cursor-grab active:cursor-grabbing relative z-0"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full overflow-visible bg-[#060913]"
        >
          {/* Oceans Background Fill */}
          <rect width={svgWidth} height={svgHeight} fill="#060913" />

          {/* Map Grid Lat/Lon Lines */}
          {[-40, -20, 0, 20, 40, 60].map((lat) => {
            const p1 = projectCoordinates(-180, lat, svgWidth, svgHeight, zoom, pan.x, pan.y);
            const p2 = projectCoordinates(180, lat, svgWidth, svgHeight, zoom, pan.x, pan.y);
            return (
              <line
                key={lat}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="#1e293b"
                strokeWidth="0.6"
                strokeDasharray="4,6"
              />
            );
          })}

          {/* Choropleth Country Polygons */}
          <g className="relative z-20">
            {countryPolygons.map((poly) => {
              const cId = poly.countryId;
              const isSpain = cId === "spain";
              const val = cId && !isSpain ? activeDataMap[cId] || 0 : 0;
              const { color: fillColor, classIdx } = getChoroplethColorAndLabel(val, isSpain);
              const isHighlighted = cId && activeHighlightId === cId;
              const isLegendHovered = hoveredLegendSegment !== null && classIdx === hoveredLegendSegment;
              const isDimmed =
                (activeHighlightId !== null && cId !== activeHighlightId && !isSpain) ||
                (hoveredLegendSegment !== null && !isLegendHovered && !isSpain);

              return (
                <path
                  key={poly.featureId}
                  d={poly.pathD}
                  fill={fillColor}
                  fillOpacity={isDimmed ? 0.2 : isHighlighted || isLegendHovered ? 1 : 0.9}
                  stroke={isHighlighted || isLegendHovered ? "#ffffff" : "#334155"}
                  strokeWidth={isHighlighted || isLegendHovered ? 1.5 : 0.6}
                  className="cursor-pointer transition-all duration-150 hover:stroke-blue-400"
                  onMouseEnter={() => {
                    if (cId && !isSpain) setHoveredCountryId(cId);
                  }}
                  onMouseLeave={() => {
                    if (cId && !isSpain) setHoveredCountryId(null);
                  }}
                  onClick={() => {
                    if (cId && !isSpain) setPinnedCountryId(pinnedCountryId === cId ? null : cId);
                  }}
                >
                  {cId && !isSpain && (
                    <title>
                      {poly.name}: {formatSpanishNumber(val)} personas
                    </title>
                  )}
                </path>
              );
            })}
          </g>
        </svg>

        {/* Hover / Pin Tooltip Overlay */}
        {activeHighlightId && (
          <div className="absolute bottom-4 left-4 bg-slate-900/95 border border-slate-700 text-white rounded-xl p-3.5 shadow-2xl backdrop-blur-md max-w-xs z-40 animate-in fade-in duration-150 space-y-1.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="font-extrabold text-sm flex items-center gap-1.5 text-blue-400">
                <MapPin className="w-4 h-4 text-pink-500" />
                {COUNTRY_GEO_MAP[activeHighlightId]?.name || activeHighlightId}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {timeframeLabel}
              </span>
            </div>
            <div className="text-xs space-y-1 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Inmigrantes:</span>
                <span className="font-bold text-yellow-300">
                  {formatSpanishNumber(activeDataMap[activeHighlightId] || 0)} personas
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Continuous Legend Bar Component (Jenks Natural Breaks k=5) */}
      <div className="bg-slate-900 border-t border-slate-800 p-3.5 px-5 flex flex-col gap-2 text-xs text-slate-300 z-20">
        <div className="flex items-center justify-between font-semibold">
          <span className="flex items-center gap-1.5 text-white">
            <Sparkles className="w-4 h-4 text-blue-400" />
            Categorías por Volumen (personas):
          </span>
        </div>

        {/* Continuous Bar divided into 5 segments */}
        <div className="grid grid-cols-5 gap-1 w-full">
          {legendSegments.map((seg, idx) => (
            <div
              key={idx}
              onMouseEnter={() => setHoveredLegendSegment(idx)}
              onMouseLeave={() => setHoveredLegendSegment(null)}
              className={`flex flex-col gap-1 cursor-pointer transition-all p-1.5 rounded-lg ${
                hoveredLegendSegment === idx ? "bg-slate-800 ring-1 ring-blue-400" : "hover:bg-slate-800/60"
              }`}
            >
              <div
                className="h-3 w-full rounded-md shadow-xs transition-transform hover:scale-[1.02]"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-[10px] font-mono text-center text-slate-300 font-medium truncate">
                {seg.range}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
