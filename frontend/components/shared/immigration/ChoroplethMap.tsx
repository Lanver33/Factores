"use client";

import React, { useState, useMemo, useRef, useCallback } from "react";
import projectedWorld from "@/data/geo/projected-world.json";
import { classifyChoropleth } from "./jenks";
import type { Locale } from "@/lib/types";
import { getCountryName } from "@/lib/geography";
import { formatNumber, formatCompactNumber } from "@/lib/format";
import { t } from "@/lib/i18n";
import { ZoomIn, ZoomOut, Maximize2, Globe } from "lucide-react";

interface ChoroplethMapProps {
  timeframeLabel: string;
  volumeByCountryIso2: Record<string, number>;
  totalVolume: number;
  hoveredIso2: string | null;
  onHoverIso2: (iso: string | null) => void;
  pinnedIso2: string | null;
  onPinIso2: (iso: string | null) => void;
  locale: Locale;
}

const PALETTE = ["#0284c7", "#2563eb", "#7c3aed", "#c026d3", "#db2777"] as const;

export default function ChoroplethMap({
  timeframeLabel,
  volumeByCountryIso2,
  hoveredIso2,
  onHoverIso2,
  pinnedIso2,
  onPinIso2,
  locale,
}: ChoroplethMapProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPointerDown, setIsPointerDown] = useState(false);
  const pointerStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const svgRef = useRef<SVGSVGElement | null>(null);

  const { viewBox, countries, graticulePath, width, height } = projectedWorld;

  // Compute Natural Breaks Classification
  const values = useMemo(
    () =>
      Object.entries(volumeByCountryIso2)
        .filter(([iso, val]) => iso !== "ES" && val > 0)
        .map(([_, val]) => val),
    [volumeByCountryIso2]
  );

  const classification = useMemo(
    () => classifyChoropleth(values, PALETTE),
    [values]
  );

  const activeSelectedIso = pinnedIso2 || hoveredIso2;

  // Pointer drag handling with screenCTM or rect scaling
  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    setIsPointerDown(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    pointerStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isPointerDown || !svgRef.current) return;
    const dx = e.clientX - pointerStartRef.current.x;
    const dy = e.clientY - pointerStartRef.current.y;

    const rect = svgRef.current.getBoundingClientRect();
    const factorX = width / rect.width;
    const factorY = height / rect.height;

    setPan({
      x: pointerStartRef.current.panX + dx * factorX,
      y: pointerStartRef.current.panY + dy * factorY,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    setIsPointerDown(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture already lost
    }
  };

  const handleWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.15 : -0.15;
    setZoom((prev) => Math.min(3.5, Math.max(0.8, prev + delta)));
  }, []);

  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="relative bg-[#060913] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between select-none">
      {/* Top Map Control Bar Overlay */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2 bg-slate-900/95 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/80 shadow-xl">
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(3.5, z + 0.25))}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          title={t("zoomIn", locale)}
          aria-label={t("zoomIn", locale)}
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(0.8, z - 0.25))}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          title={t("zoomOut", locale)}
          aria-label={t("zoomOut", locale)}
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleResetZoom}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          title={t("resetZoom", locale)}
          aria-label={t("resetZoom", locale)}
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-slate-700 my-auto mx-1" />

        <div className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-600 text-white shadow-xs flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5" />
          <span>{t("choroplethMapTitle", locale)}</span>
        </div>
      </div>

      {/* Main SVG Choropleth Canvas with GPU-friendly pointer pan/zoom */}
      <div className="w-full h-[480px] sm:h-[540px] cursor-grab active:cursor-grabbing relative z-0">
        <svg
          ref={svgRef}
          viewBox={viewBox}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
          className="w-full h-full overflow-hidden bg-[#060913] touch-none"
        >
          {/* Oceans background */}
          <rect width={width} height={height} fill="#060913" />

          {/* Map Content Group Transform */}
          <g
            transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}
            style={{
              transformOrigin: "center",
              transition: isPointerDown ? "none" : "transform 0.15s ease-out",
            }}
          >
            {/* Graticule lines */}
            {graticulePath && (
              <path
                d={graticulePath}
                fill="none"
                stroke="#1e293b"
                strokeWidth={0.5}
                strokeDasharray="2 4"
                opacity={0.7}
              />
            )}

            {/* Country Polygons */}
            {countries.map((c) => {
              const iso = c.iso2;
              const isSpain = iso === "ES";
              const volume = volumeByCountryIso2[iso] ?? 0;
              const isHovered = activeSelectedIso === iso;

              let fillColor = "#141c2e";
              if (isSpain) {
                fillColor = "#f59e0b"; // Gold destination anchor
              } else if (volume > 0) {
                fillColor = classification.getColor(volume);
              }

              return (
                <path
                  key={iso}
                  d={c.path}
                  fill={fillColor}
                  stroke={isHovered ? "#ffffff" : isSpain ? "#fbbf24" : "#0f172a"}
                  strokeWidth={isHovered ? 1.5 : 0.6}
                  className="transition-colors duration-150 cursor-pointer"
                  onPointerEnter={() => onHoverIso2(iso)}
                  onPointerLeave={() => onHoverIso2(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPinIso2(pinnedIso2 === iso ? null : iso);
                  }}
                >
                  <title>
                    {isSpain
                      ? `${getCountryName(iso, locale)} (Destino)`
                      : `${getCountryName(iso, locale)}: ${
                          volume > 0
                            ? `${formatNumber(volume, locale)} ${t("people", locale)}`
                            : t("noRecords", locale)
                        }`}
                  </title>
                </path>
              );
            })}
          </g>
        </svg>

        {/* Hovered / Pinned Country Tooltip Float */}
        {activeSelectedIso && (
          <div className="absolute bottom-16 left-4 z-20 bg-slate-900/95 backdrop-blur-md p-3 rounded-xl border border-slate-700 shadow-2xl text-xs space-y-1 max-w-xs pointer-events-none">
            <div className="font-bold text-white flex items-center justify-between gap-2">
              <span>{getCountryName(activeSelectedIso, locale)}</span>
              {activeSelectedIso === "ES" ? (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/40">
                  Destino
                </span>
              ) : null}
            </div>
            {activeSelectedIso !== "ES" && (
              <div className="text-slate-300">
                <span className="text-blue-400 font-bold font-mono text-sm">
                  {formatNumber(volumeByCountryIso2[activeSelectedIso] ?? 0, locale)}
                </span>{" "}
                {t("people", locale)} ({timeframeLabel})
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Choropleth Dynamic Legend */}
      <div className="p-3 bg-slate-950/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {timeframeLabel}:
          </span>
          {classification.classes.map((cls, idx) => {
            const minFormatted = formatCompactNumber(cls.min, locale);
            const maxFormatted = formatCompactNumber(cls.max, locale);
            return (
              <div key={idx} className="flex items-center gap-1.5">
                <span
                  className="w-3.5 h-3.5 rounded-sm shrink-0"
                  style={{ backgroundColor: cls.color }}
                />
                <span className="text-slate-300 font-mono text-[11px]">
                  {idx === classification.classes.length - 1 && cls.min !== cls.max
                    ? `> ${minFormatted}`
                    : `${minFormatted} – ${maxFormatted}`}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#f59e0b]" />
            <span>España (Destino)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#141c2e]" />
            <span>{t("noRecords", locale)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
