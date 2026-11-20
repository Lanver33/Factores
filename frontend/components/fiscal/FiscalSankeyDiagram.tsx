"use client";

import { useState } from "react";
import { Info, Monitor, ArrowRight } from "lucide-react";
import type { AnnualBalanceRecord, FiscalTaxonomy, FiscalUnitId, Lang } from "@/lib/types";
import {
  buildSankeyGraph,
  getLatestCofogYear,
  formatFiscalValue,
  type SankeyNode,
} from "./fiscalSelectors";
import { t } from "@/lib/i18n";

interface FiscalSankeyDiagramProps {
  record: AnnualBalanceRecord;
  taxonomy: FiscalTaxonomy;
  unit: FiscalUnitId;
  balances: AnnualBalanceRecord[];
  onSelectYear: (year: string) => void;
  onSwitchToSplit: () => void;
  lang?: Lang;
}

export function FiscalSankeyDiagram({
  record,
  taxonomy,
  unit,
  balances,
  onSelectYear,
  onSwitchToSplit,
  lang = "es",
}: FiscalSankeyDiagramProps) {
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);

  const graph = buildSankeyGraph(record, taxonomy, unit, 920, 520);
  const latestCofogYear = getLatestCofogYear(balances);

  if (!graph.cofogAvailable) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h5 className="text-base font-bold text-white">
            {t("cofogNotPublished", lang)}
          </h5>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            El diagrama de flujo Sankey requiere el desglose por funciones COFOG de los gastos.
          </p>
        </div>
        {latestCofogYear && (
          <button
            onClick={() => onSelectYear(latestCofogYear)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all shadow-md"
          >
            <span>
              {t("viewLatestCofogYear", lang)} ({latestCofogYear})
            </span>
          </button>
        )}
      </div>
    );
  }

  const activeHoveredNode = graph.nodes.find((n) => n.code === hoveredCode);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4">
      {/* Mobile Notice Banner */}
      <div className="md:hidden bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Monitor className="w-4 h-4 text-blue-400 shrink-0" />
          <span>El diagrama de flujo se aprecia mejor en pantallas anchas.</span>
        </div>
        <button
          onClick={onSwitchToSplit}
          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold shrink-0 transition-colors"
        >
          {t("tabBreakdown", lang)}
        </button>
      </div>

      {/* Detail Hover Card Banner */}
      <div className="min-h-[52px] bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        {activeHoveredNode ? (
          <>
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: activeHoveredNode.color }}
              />
              <span className="font-bold text-white font-sans">
                {activeHoveredNode.label}
              </span>
              <span className="text-slate-400">[{activeHoveredNode.code}]</span>
            </div>

            <div className="flex items-center gap-4 text-slate-200">
              <span>
                Valor:{" "}
                <strong className="text-white">
                  {formatFiscalValue(activeHoveredNode.value, unit, lang, {
                    compact: true,
                  })}
                </strong>
              </span>
              <span>
                Cuota:{" "}
                <strong className="text-blue-400">
                  {activeHoveredNode.sharePct.toFixed(1)}%
                </strong>
              </span>
            </div>
          </>
        ) : (
          <div className="text-slate-400 flex items-center gap-2 font-sans italic text-xs">
            <Info className="w-3.5 h-3.5 text-blue-400" />
            <span>Pasa el cursor por cualquier partida o cinta para resaltar el flujo financiero.</span>
          </div>
        )}
      </div>

      {/* Pure SVG Sankey Diagram */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox="0 0 920 520"
          className="w-full h-auto min-w-[700px] select-none"
        >
          {/* Section Headers */}
          <text x="10" y="16" fill="#94A3B8" fontSize="12" fontWeight="bold" fontFamily="sans-serif">
            INGRESOS Y FINANCIACIÓN
          </text>
          <text
            x="460"
            y="16"
            fill="#94A3B8"
            fontSize="12"
            fontWeight="bold"
            textAnchor="middle"
            fontFamily="sans-serif"
          >
            NÚCLEO AAPP S.13
          </text>
          <text
            x="910"
            y="16"
            fill="#94A3B8"
            fontSize="12"
            fontWeight="bold"
            textAnchor="end"
            fontFamily="sans-serif"
          >
            GASTOS POR FUNCIÓN COFOG
          </text>

          {/* Render Flow Links (Ribbons) */}
          {graph.links.map((link) => {
            const isHovered =
              hoveredCode !== null &&
              (link.sourceId.includes(hoveredCode) || link.targetId.includes(hoveredCode));

            const opacity =
              hoveredCode === null ? 0.45 : isHovered ? 0.85 : 0.08;

            return (
              <path
                key={link.id}
                d={link.path}
                fill={link.color}
                opacity={opacity}
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => {
                  const code = link.id.replace(/^link-(left|right)-/, "");
                  setHoveredCode(code);
                }}
                onMouseLeave={() => setHoveredCode(null)}
              />
            );
          })}

          {/* Render Nodes */}
          {graph.nodes.map((node) => {
            const isHovered = hoveredCode === node.code;
            const isDimmed = hoveredCode !== null && !isHovered;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onMouseEnter={() => setHoveredCode(node.code)}
                onMouseLeave={() => setHoveredCode(null)}
                className="cursor-pointer"
              >
                {/* Node Rect */}
                <rect
                  width={node.width}
                  height={node.height}
                  rx={4}
                  fill={node.color}
                  opacity={isDimmed ? 0.3 : 1.0}
                  stroke={isHovered ? "#FFFFFF" : "transparent"}
                  strokeWidth={2}
                  className="transition-all duration-200"
                />

                {/* Node Label Text */}
                {node.height >= 14 && (
                  <text
                    x={
                      node.column === 0
                        ? node.width + 8
                        : node.column === 2
                        ? -8
                        : node.width / 2
                    }
                    y={node.height / 2 + 4}
                    textAnchor={
                      node.column === 0
                        ? "start"
                        : node.column === 2
                        ? "end"
                        : "middle"
                    }
                    fill={isDimmed ? "#64748B" : "#F8FAFC"}
                    fontSize={node.column === 1 ? "11" : "11"}
                    fontWeight="600"
                    fontFamily="sans-serif"
                    className="pointer-events-none transition-colors"
                  >
                    {node.shortLabel} ({node.sharePct.toFixed(0)}%)
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export default FiscalSankeyDiagram;
