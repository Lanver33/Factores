"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Info, Scale } from "lucide-react";
import type { AnnualBalanceRecord, FiscalTaxonomy, FiscalUnitId, Lang } from "@/types";
import {
  buildAnatomyBreakdown,
  getLatestCofogYear,
  formatFiscalValue,
  type AnatomyItem,
} from "./fiscalSelectors";
import { getTaxonColor, DEFICIT_BRIDGE, SURPLUS_BRIDGE } from "./fiscalPalette";
import { t } from "@/lib/i18n";
import ConceptHelpTrigger from "@/components/detail/guide/ConceptHelpTrigger";

interface FiscalAnatomySplitProps {
  record: AnnualBalanceRecord;
  taxonomy: FiscalTaxonomy;
  unit: FiscalUnitId;
  balances: AnnualBalanceRecord[];
  onSelectYear: (year: string) => void;
  lang?: Lang;
}

export function FiscalAnatomySplit({
  record,
  taxonomy,
  unit,
  balances,
  onSelectYear,
  lang = "es",
}: FiscalAnatomySplitProps) {
  const breakdown = buildAnatomyBreakdown(record, taxonomy, unit);
  const otherUnit: FiscalUnitId = unit === "PC_GDP" ? "MIO_EUR" : "PC_GDP";
  const otherMetrics = record.metrics[otherUnit];

  // Default expanded taxa codes: D5 and GF10, GF01
  const [expandedCodes, setExpandedCodes] = useState<Record<string, boolean>>({
    D5: true,
    GF10: true,
    GF01: true,
  });

  const toggleExpand = (code: string) => {
    setExpandedCodes((prev) => ({ ...prev, [code]: !prev[code] }));
  };

  const allTaxaCodes = [
    ...breakdown.revenues.filter((r) => r.children.length > 0).map((r) => r.code),
    ...breakdown.expenditures.filter((e) => e.children.length > 0).map((e) => e.code),
  ];

  const isAllExpanded = allTaxaCodes.every((c) => expandedCodes[c]);

  const toggleAll = () => {
    if (isAllExpanded) {
      setExpandedCodes({});
    } else {
      const next: Record<string, boolean> = {};
      allTaxaCodes.forEach((c) => {
        next[c] = true;
      });
      setExpandedCodes(next);
    }
  };

  const latestCofogYear = getLatestCofogYear(balances);

  const totalRevVal = record.metrics[unit].totals.revenue;
  const otherTotalRevVal = otherMetrics.totals.revenue;

  const totalExpVal = record.metrics[unit].totals.expenditure;
  const otherTotalExpVal = otherMetrics.totals.expenditure;

  return (
    <div className="space-y-4">
      {/* Top Accordion Action Row */}
      <div className="flex items-center justify-end">
        <button
          onClick={toggleAll}
          className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
        >
          {isAllExpanded ? t("collapseAll", lang) : t("expandAll", lang)}
        </button>
      </div>

      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN: REVENUES (Ingresos) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
          {/* Column Header */}
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                <span>Ingresos Públicos (TR)</span>
              </h4>
              <p className="text-xs text-slate-400 font-mono tabular-nums mt-0.5">
                {formatFiscalValue(otherTotalRevVal, otherUnit, lang, { compact: true })}
              </p>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-sky-400 font-mono tabular-nums">
                {formatFiscalValue(totalRevVal, unit, lang, { compact: true })}
              </span>
            </div>
          </div>

          {/* Revenues List */}
          <div className="space-y-2.5">
            {breakdown.revenues.map((item) => {
              const isExpanded = !!expandedCodes[item.code];
              const hasChildren = item.children.length > 0;
              const color = getTaxonColor(item.code);

              return (
                <div
                  key={item.code}
                  className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-2 transition-all hover:border-slate-700"
                >
                  {/* Item Main Row */}
                  <div
                    onClick={() => hasChildren && toggleExpand(item.code)}
                    className={`flex items-center justify-between gap-3 ${
                      hasChildren ? "cursor-pointer select-none" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {hasChildren ? (
                        <button
                          aria-expanded={isExpanded}
                          className="text-slate-400 hover:text-white transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                      ) : (
                        <span className="w-4" />
                      )}

                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />

                      <span
                        className="text-xs font-semibold text-slate-200 truncate"
                        title={item.label}
                      >
                        {item.shortLabel}
                      </span>

                      <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 bg-slate-800 rounded">
                        {item.code}
                      </span>
                      <ConceptHelpTrigger code={item.code} lang={lang} />
                    </div>

                    <div className="text-right shrink-0 font-mono tabular-nums text-xs">
                      <span className="font-bold text-white">
                        {formatFiscalValue(item.value, unit, lang, { compact: true })}
                      </span>
                      <span className="text-slate-400 text-[11px] ml-1.5">
                        ({item.sharePct.toFixed(1)}%)
                      </span>
                    </div>
                  </div>

                  {/* Proportional Bar */}
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, Math.max(0, item.sharePct))}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>

                  {/* Accordion Sub-list for Children */}
                  {hasChildren && isExpanded && (
                    <div className="pl-6 pt-1 space-y-1.5 border-t border-slate-800/60 mt-2">
                      {item.children.map((child) => (
                        <div
                          key={child.code}
                          className="flex items-center justify-between gap-2 text-xs font-mono tabular-nums"
                        >
                          <div className="flex items-center gap-1.5 text-slate-400 min-w-0">
                            <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                              [{child.code}]
                            </span>
                            <span className="truncate">{child.label}</span>
                            <ConceptHelpTrigger code={child.code} lang={lang} />
                          </div>
                          <div className="text-right text-slate-300 shrink-0 text-[11px]">
                            <span>
                              {formatFiscalValue(child.value, unit, lang, { compact: true })}
                            </span>
                            <span className="text-slate-400 ml-1">
                              ({child.shareOfParentPct.toFixed(0)}%)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Accounting Bridge Row: Deficit if B.9 < 0 */}
            {breakdown.bridgeItem && breakdown.bridgeItem.side === "revenues" && (
              <div className="border-2 border-dashed border-rose-500/40 bg-rose-950/20 rounded-xl p-3 flex items-center justify-between text-xs font-mono tabular-nums">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: DEFICIT_BRIDGE }}
                  />
                  <span className="font-bold text-rose-300">
                    + Necesidad de financiación (Déficit B.9)
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-rose-400">
                    {formatFiscalValue(breakdown.bridgeItem.value, unit, lang, {
                      compact: true,
                    })}
                  </span>
                  <span className="text-rose-400/70 ml-1">
                    ({breakdown.bridgeItem.sharePct.toFixed(1)}%)
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: EXPENDITURES (Gastos por función COFOG) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
          {/* Column Header */}
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                <span>Gastos Públicos (COFOG TE)</span>
              </h4>
              <p className="text-xs text-slate-400 font-mono tabular-nums mt-0.5">
                {formatFiscalValue(otherTotalExpVal, otherUnit, lang, { compact: true })}
              </p>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-indigo-400 font-mono tabular-nums">
                {formatFiscalValue(totalExpVal, unit, lang, { compact: true })}
              </span>
            </div>
          </div>

          {/* Graceful Handling when cofogAvailable === false */}
          {!breakdown.cofogAvailable ? (
            <div className="bg-slate-950/80 border border-dashed border-amber-500/40 rounded-xl p-6 text-center space-y-4 my-auto">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                <Info className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h5 className="text-sm font-bold text-white">
                  {t("cofogNotPublished", lang)}
                </h5>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Eurostat e IGAE publican los desgloses funcionales COFOG con un año de desfase respecto a la contabilidad nacional trimestral.
                </p>
              </div>

              {latestCofogYear && (
                <button
                  onClick={() => onSelectYear(latestCofogYear)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all shadow-md"
                >
                  <Scale className="w-4 h-4" />
                  <span>
                    {t("viewLatestCofogYear", lang)} ({latestCofogYear})
                  </span>
                </button>
              )}
            </div>
          ) : (
            /* Expenditures List */
            <div className="space-y-2.5">
              {breakdown.expenditures.map((item) => {
                const isExpanded = !!expandedCodes[item.code];
                const hasChildren = item.children.length > 0;
                const color = getTaxonColor(item.code);

                return (
                  <div
                    key={item.code}
                    className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-2 transition-all hover:border-slate-700"
                  >
                    {/* Main Row */}
                    <div
                      onClick={() => hasChildren && toggleExpand(item.code)}
                      className={`flex items-center justify-between gap-3 ${
                        hasChildren ? "cursor-pointer select-none" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {hasChildren ? (
                          <button
                            aria-expanded={isExpanded}
                            className="text-slate-400 hover:text-white transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        ) : (
                          <span className="w-4" />
                        )}

                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />

                        <span
                          className="text-xs font-semibold text-slate-200 truncate"
                          title={item.label}
                        >
                          {item.shortLabel}
                        </span>

                        <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 bg-slate-800 rounded">
                          {item.code}
                        </span>
                        <ConceptHelpTrigger code={item.code} lang={lang} />
                      </div>

                      <div className="text-right shrink-0 font-mono tabular-nums text-xs">
                        <span className="font-bold text-white">
                          {formatFiscalValue(item.value, unit, lang, { compact: true })}
                        </span>
                        <span className="text-slate-400 text-[11px] ml-1.5">
                          ({item.sharePct.toFixed(1)}%)
                        </span>
                      </div>
                    </div>

                    {/* Proportional Bar */}
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.max(0, item.sharePct))}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>

                    {/* Accordion Sub-list for Highlights */}
                    {hasChildren && isExpanded && (
                      <div className="pl-6 pt-1 space-y-1.5 border-t border-slate-800/60 mt-2">
                        {item.children.map((child) => (
                          <div
                            key={child.code}
                            className="flex items-center justify-between gap-2 text-xs font-mono tabular-nums"
                          >
                            <div className="flex items-center gap-1.5 text-slate-400 min-w-0">
                              <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                                [{child.code}]
                              </span>
                              <span className="truncate">{child.label}</span>
                              <ConceptHelpTrigger code={child.code} lang={lang} />
                            </div>
                            <div className="text-right text-slate-300 shrink-0 text-[11px]">
                              <span>
                                {formatFiscalValue(child.value, unit, lang, {
                                  compact: true,
                                })}
                              </span>
                              <span className="text-slate-400 ml-1">
                                ({child.shareOfParentPct.toFixed(0)}%)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Accounting Bridge Row: Surplus if B.9 > 0 */}
              {breakdown.bridgeItem && breakdown.bridgeItem.side === "expenditures" && (
                <div className="border-2 border-dashed border-emerald-500/40 bg-emerald-950/20 rounded-xl p-3 flex items-center justify-between text-xs font-mono tabular-nums">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: SURPLUS_BRIDGE }}
                    />
                    <span className="font-bold text-emerald-300">
                      + Capacidad de financiación (Superávit B.9)
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-400">
                      {formatFiscalValue(breakdown.bridgeItem.value, unit, lang, {
                        compact: true,
                      })}
                    </span>
                    <span className="text-emerald-400/70 ml-1">
                      ({breakdown.bridgeItem.sharePct.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Uncollectible Adjustment Note if present */}
      {breakdown.uncollectibleAdjustment !== null && (
        <div className="text-[11px] text-slate-400 flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>
            Ajuste de recaudación incierta (SEC 2010): D.995 / D.91 ajuste por impuestos no cobrados ={" "}
            {formatFiscalValue(breakdown.uncollectibleAdjustment, unit, lang, { signed: true })}.
          </span>
        </div>
      )}
    </div>
  );
}

export default FiscalAnatomySplit;
