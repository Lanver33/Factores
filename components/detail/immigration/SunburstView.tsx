"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  ImmigrationItem,
  BlockDef,
  getCountryColor,
  formatSpanishNumber,
  formatCompactSpanish,
  describeArc,
} from "./utils";
import {
  Play,
  Pause,
  Sparkles,
  XCircle,
} from "lucide-react";

interface SunburstViewProps {
  item: ImmigrationItem;
}

export default function SunburstView({ item }: SunburstViewProps) {
  const years = useMemo(() => item.annualBlocks.map((d) => d.year), [item]);
  const [selectedYear, setSelectedYear] = useState<string>(
    years[years.length - 1] || "2024"
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [hoveredSector, setHoveredSector] = useState<{
    type: "block" | "country";
    name: string;
    value: number;
    globalPct: number;
    parentPct?: number;
    color: string;
  } | null>(null);

  const [activeDrillDownBlockId, setActiveDrillDownBlockId] = useState<
    string | null
  >(null);

  // Playback timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isPlaying) {
      timer = setInterval(() => {
        setSelectedYear((prev) => {
          const currentIdx = years.indexOf(prev);
          if (currentIdx >= years.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return years[currentIdx + 1];
        });
      }, 800);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, years]);

  // Active annual data
  const activeAnnualData = useMemo(() => {
    return (
      item.annualBlocks.find((d) => d.year === selectedYear) ||
      item.annualBlocks[item.annualBlocks.length - 1]
    );
  }, [item, selectedYear]);

  // Previous year data for YoY % calculation
  const prevYearData = useMemo(() => {
    const idx = years.indexOf(selectedYear);
    if (idx <= 0) return null;
    const prevY = years[idx - 1];
    return item.annualBlocks.find((d) => d.year === prevY) || null;
  }, [item, selectedYear, years]);

  // Calculate YoY % change
  const yoyPct = useMemo(() => {
    if (!prevYearData || prevYearData.total === 0) return null;
    const change = activeAnnualData.total - prevYearData.total;
    return (change / prevYearData.total) * 100;
  }, [activeAnnualData, prevYearData]);

  // Sunburst geometry calculations
  const { blockSectors, countrySectors } = useMemo(() => {
    const totalGlobal = activeAnnualData.total || 1;
    const cx = 250;
    const cy = 250;
    const rInBlock = 80;
    const rOutBlock = 145;
    const rInCountry = 152;
    const rOutCountry = 215;

    let currentAngle = -Math.PI / 2; // Start at 12 o'clock

    // If drilled down to a single continent
    const blocksToRender = activeDrillDownBlockId
      ? item.blocks.filter((b) => b.id === activeDrillDownBlockId)
      : item.blocks;

    const totalToDistribute = blocksToRender.reduce(
      (acc, b) => acc + (activeAnnualData.blocks[b.id]?.total || 0),
      0
    );

    const bSectors: any[] = [];
    const cSectors: any[] = [];

    blocksToRender.forEach((block) => {
      const bData = activeAnnualData.blocks[block.id];
      const bTotal = bData?.total || 0;
      if (bTotal === 0) return;

      const angleSpan = (bTotal / (totalToDistribute || 1)) * (2 * Math.PI);
      const startAngle = currentAngle;
      const endAngle = currentAngle + angleSpan;

      const pathD = describeArc(
        cx,
        cy,
        rInBlock,
        rOutBlock,
        startAngle,
        endAngle
      );
      const globalPct = (bTotal / totalGlobal) * 100;

      bSectors.push({
        id: block.id,
        name: block.name,
        color: block.color,
        value: bTotal,
        globalPct,
        startAngle,
        endAngle,
        pathD,
      });

      // Calculate country sub-arcs aligned with block arc
      let cCurrentAngle = startAngle;
      block.countries.forEach((country) => {
        const cVal = bData?.countries[country.id] || 0;
        if (cVal === 0) return;

        const cAngleSpan = (cVal / (bTotal || 1)) * angleSpan;
        const cStartAngle = cCurrentAngle;
        const cEndAngle = cCurrentAngle + cAngleSpan;

        const cPathD = describeArc(
          cx,
          cy,
          rInCountry,
          rOutCountry,
          cStartAngle,
          cEndAngle
        );

        const cGlobalPct = (cVal / totalGlobal) * 100;
        const cParentPct = (cVal / bTotal) * 100;
        const cColor = getCountryColor(country.id, block.color);

        cSectors.push({
          id: country.id,
          name: country.name,
          blockId: block.id,
          blockName: block.name,
          color: cColor,
          value: cVal,
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

    return { blockSectors: bSectors, countrySectors: cSectors };
  }, [item, activeAnnualData, activeDrillDownBlockId]);

  // Global sparkline points
  const sparklineData = useMemo(() => {
    const maxVal = Math.max(...item.annualBlocks.map((d) => d.total));
    const width = 200;
    const height = 36;
    const pts = item.annualBlocks.map((ab, idx) => {
      const x = (idx / (item.annualBlocks.length - 1)) * width;
      const y = height - (ab.total / (maxVal || 1)) * (height - 6) - 3;
      return { x, y, year: ab.year, total: ab.total };
    });

    const activePt = pts.find((p) => p.year === selectedYear);
    const pathD = `M ${pts.map((p) => `${p.x},${p.y}`).join(" L ")}`;

    return { pts, pathD, activePt, width, height };
  }, [item, selectedYear]);

  // Milestone quick access years
  const keyMilestones = [
    { year: "2008", label: "2008 (Inicio)" },
    { year: "2013", label: "2013 (Valle)" },
    { year: "2019", label: "2019 (Pre-COVID)" },
    { year: "2020", label: "2020 (COVID-19)" },
    { year: "2022", label: "2022 (Pico UE)" },
    { year: "2024", label: "2024 (Último)" },
  ];

  return (
    <div className="space-y-6">
      {/* Top Bar: Playback Controls & Sparkline */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6">
        {/* Play/Pause & Slider */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md transition-all active:scale-95"
                title={isPlaying ? "Pausar animación" : "Reproducir serie"}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Año Seleccionado
                </span>
                <span className="text-xl font-extrabold text-slate-900 font-mono">
                  {selectedYear}
                </span>
              </div>
            </div>

            {/* Drilldown Reset Button */}
            {activeDrillDownBlockId && (
              <button
                onClick={() => setActiveDrillDownBlockId(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-800 transition-colors flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                Ver todos los continentes
              </button>
            )}
          </div>

          {/* Slider */}
          <input
            type="range"
            min="2008"
            max="2024"
            step="1"
            value={selectedYear}
            onChange={(e) => {
              setIsPlaying(false);
              setSelectedYear(e.target.value);
            }}
            className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />

          {/* All Years Quick Access Buttons */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {years.map((y) => (
              <button
                key={y}
                onClick={() => {
                  setIsPlaying(false);
                  setSelectedYear(y);
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  selectedYear === y
                    ? "bg-slate-900 text-white shadow-xs font-bold"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        {/* Mini Sparkline Context Graph */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col justify-between min-w-[220px]">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Tendencia Global (2008–2024)
            </span>
            <span className="font-bold font-mono text-slate-900">
              {formatCompactSpanish(activeAnnualData.total)}
            </span>
          </div>
          <svg
            viewBox={`0 0 ${sparklineData.width} ${sparklineData.height}`}
            className="w-full h-9 overflow-visible"
          >
            <path
              d={sparklineData.pathD}
              fill="none"
              stroke="#94A3B8"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {sparklineData.activePt && (
              <circle
                cx={sparklineData.activePt.x}
                cy={sparklineData.activePt.y}
                r="4"
                className="fill-blue-600 stroke-white stroke-2 animate-pulse"
              />
            )}
          </svg>
        </div>
      </div>

      {/* Main Container: Sunburst Graphic Centered */}
      <div className="flex flex-col items-center justify-center bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        {/* Sunburst SVG */}
        <div className="w-full max-w-[500px] flex flex-col items-center justify-center relative">
          <div className="relative w-full aspect-square">
            <svg
              viewBox="0 0 500 500"
              className="w-full h-full overflow-visible drop-shadow-xs"
            >
              {/* Inner Ring (Continents) */}
              {blockSectors.map((sector) => {
                const isHovered =
                  hoveredSector?.name === sector.name &&
                  hoveredSector?.type === "block";
                return (
                  <path
                    key={sector.id}
                    d={sector.pathD}
                    fill={sector.color}
                    fillOpacity={isHovered ? 1 : 0.88}
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    className="cursor-pointer transition-all duration-200 hover:scale-[1.015] origin-center"
                    onMouseEnter={() =>
                      setHoveredSector({
                        type: "block",
                        name: sector.name,
                        value: sector.value,
                        globalPct: sector.globalPct,
                        color: sector.color,
                      })
                    }
                    onMouseLeave={() => setHoveredSector(null)}
                    onClick={() =>
                      setActiveDrillDownBlockId(
                        activeDrillDownBlockId === sector.id ? null : sector.id
                      )
                    }
                  >
                    <title>
                      {sector.name}: {formatSpanishNumber(sector.value)} (
                      {sector.globalPct.toFixed(1)}%)
                    </title>
                  </path>
                );
              })}

              {/* Outer Ring (Countries) */}
              {countrySectors.map((sector) => {
                const isHovered =
                  hoveredSector?.name === sector.name &&
                  hoveredSector?.type === "country";
                return (
                  <path
                    key={sector.id}
                    d={sector.pathD}
                    fill={sector.color}
                    fillOpacity={isHovered ? 1 : 0.82}
                    stroke="#FFFFFF"
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
                      })
                    }
                    onMouseLeave={() => setHoveredSector(null)}
                  >
                    <title>
                      {sector.name}: {formatSpanishNumber(sector.value)} (
                      {sector.globalPct.toFixed(1)}% del total,{" "}
                      {sector.parentPct.toFixed(1)}% de {sector.blockName})
                    </title>
                  </path>
                );
              })}

              {/* Center Circle Content */}
              <circle
                cx="250"
                cy="250"
                r="76"
                fill="#FFFFFF"
                className="drop-shadow-md"
              />
              <g className="text-center pointer-events-none">
                <text
                  x="250"
                  y="225"
                  textAnchor="middle"
                  className="text-xs font-bold fill-slate-500 uppercase tracking-widest"
                >
                  Año {selectedYear}
                </text>
                <text
                  x="250"
                  y="252"
                  textAnchor="middle"
                  className="text-xl font-black fill-slate-900 font-mono tracking-tight"
                >
                  {formatCompactSpanish(activeAnnualData.total)}
                </text>
                <text
                  x="250"
                  y="272"
                  textAnchor="middle"
                  className="text-[11px] font-semibold fill-slate-500"
                >
                  personas
                </text>
                {yoyPct !== null && (
                  <text
                    x="250"
                    y="294"
                    textAnchor="middle"
                    className={`text-[11px] font-bold ${
                      yoyPct >= 0 ? "fill-emerald-600" : "fill-rose-600"
                    }`}
                  >
                    {yoyPct >= 0 ? `▲ +${yoyPct.toFixed(1)}%` : `▼ ${yoyPct.toFixed(1)}%`}{" "}
                    vs año ant.
                  </text>
                )}
              </g>
            </svg>
          </div>

          {/* Interactive Sector Tooltip Display */}
          <div className="h-16 mt-4 flex items-center justify-center">
            {hoveredSector ? (
              <div className="bg-slate-900 text-white rounded-xl px-4 py-2 text-center text-xs shadow-lg animate-in fade-in duration-150 flex items-center gap-3">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: hoveredSector.color }}
                />
                <div>
                  <span className="font-bold">{hoveredSector.name}: </span>
                  <span className="font-mono font-semibold text-blue-300">
                    {formatSpanishNumber(hoveredSector.value)} personas
                  </span>
                  <span className="text-slate-400 ml-2">
                    ({hoveredSector.globalPct.toFixed(1)}% del total global
                    {hoveredSector.parentPct !== undefined
                      ? `, ${hoveredSector.parentPct.toFixed(1)}% de su bloque`
                      : ""}
                    )
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-xs text-slate-500 italic">
                Pasa el cursor sobre un sector del anillo para ver detalles.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
