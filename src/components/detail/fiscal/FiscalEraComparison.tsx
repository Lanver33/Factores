"use client";

import { useState } from "react";
import { Info, ArrowRight } from "lucide-react";
import type { AnnualBalanceRecord, FiscalTaxonomy, FiscalUnitId, Lang } from "@/types";
import {
  computeEraComparison,
  getAvailableYears,
  getLatestCofogYear,
  formatFiscalValue,
  formatFiscalDelta,
} from "./fiscalSelectors";
import { getTaxonColor } from "./fiscalPalette";
import { t } from "@/lib/i18n";

interface FiscalEraComparisonProps {
  balances: AnnualBalanceRecord[];
  taxonomy: FiscalTaxonomy;
  unit: FiscalUnitId;
  lang?: Lang;
}

type Side = "expenditures" | "revenues";

export function FiscalEraComparison({
  balances,
  taxonomy,
  unit,
  lang = "es",
}: FiscalEraComparisonProps) {
  const years = getAvailableYears(balances);
  const latestCofog = getLatestCofogYear(balances) ?? years[years.length - 1];

  const defaultYearA = years.includes("2007") ? "2007" : years[0];
  const defaultYearB = latestCofog;

  const [yearA, setYearA] = useState<string>(defaultYearA);
  const [yearB, setYearB] = useState<string>(defaultYearB);
  const [side, setSide] = useState<Side>("expenditures");

  const era = computeEraComparison(balances, taxonomy, yearA, yearB, side, unit);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-6">
      {/* Controls Header */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        {/* Presets & Year Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1 text-xs">
            <span className="text-slate-400 font-semibold">{t("compareFrom", lang)}:</span>
            <select
              value={yearA}
              onChange={(e) => setYearA(e.target.value)}
              className="bg-transparent text-white font-mono font-bold focus:outline-none cursor-pointer"
            >
              {years.map((y) => (
                <option key={y} value={y} className="bg-slate-900 text-white">
                  {y}
                </option>
              ))}
            </select>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-500 shrink-0 hidden sm:block" />

          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1 text-xs">
            <span className="text-slate-400 font-semibold">{t("compareTo", lang)}:</span>
            <select
              value={yearB}
              onChange={(e) => setYearB(e.target.value)}
              className="bg-transparent text-white font-mono font-bold focus:outline-none cursor-pointer"
            >
              {years.map((y) => (
                <option key={y} value={y} className="bg-slate-900 text-white">
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Neutral Presets */}
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <span className="text-slate-400 text-[11px] uppercase mr-1">Presets:</span>
            {years.includes("1995") && (
              <button
                onClick={() => {
                  setYearA("1995");
                  setYearB(latestCofog);
                }}
                className={`px-2.5 py-1 rounded-lg border transition-all ${
                  yearA === "1995" && yearB === latestCofog
                    ? "bg-blue-600 text-white border-blue-500"
                    : "bg-slate-950 text-slate-300 border-slate-800 hover:text-white"
                }`}
              >
                1995 → {latestCofog}
              </button>
            )}
            {years.includes("2007") && (
              <button
                onClick={() => {
                  setYearA("2007");
                  setYearB(latestCofog);
                }}
                className={`px-2.5 py-1 rounded-lg border transition-all ${
                  yearA === "2007" && yearB === latestCofog
                    ? "bg-blue-600 text-white border-blue-500"
                    : "bg-slate-950 text-slate-300 border-slate-800 hover:text-white"
                }`}
              >
                2007 → {latestCofog}
              </button>
            )}
            {years.includes("2019") && (
              <button
                onClick={() => {
                  setYearA("2019");
                  setYearB(latestCofog);
                }}
                className={`px-2.5 py-1 rounded-lg border transition-all ${
                  yearA === "2019" && yearB === latestCofog
                    ? "bg-blue-600 text-white border-blue-500"
                    : "bg-slate-950 text-slate-300 border-slate-800 hover:text-white"
                }`}
              >
                2019 → {latestCofog}
              </button>
            )}
          </div>
        </div>

        {/* Side Toggle: Expenditures vs Revenues */}
        <div className="inline-flex p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold shrink-0">
          <button
            onClick={() => setSide("expenditures")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              side === "expenditures"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Gastos (COFOG)
          </button>
          <button
            onClick={() => setSide("revenues")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              side === "revenues"
                ? "bg-sky-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Ingresos
          </button>
        </div>
      </div>

      {/* Inflation warning notice for MIO_EUR */}
      {unit === "MIO_EUR" && (
        <div className="bg-slate-950 border border-amber-500/30 rounded-xl p-3 flex items-center gap-2 text-xs text-amber-300">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{t("nominalEurWarning", lang)}</span>
        </div>
      )}

      {/* Missing COFOG years warning */}
      {era.missingCofogYears.length > 0 ? (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 text-center space-y-2">
          <Info className="w-6 h-6 text-amber-400 mx-auto" />
          <h5 className="text-sm font-bold text-white">
            {t("cofogNotPublished", lang)}
          </h5>
          <p className="text-xs text-slate-400">
            No se puede realizar la comparativa de gastos COFOG porque no hay datos disponibles para el año {era.missingCofogYears.join(", ")}.
          </p>
        </div>
      ) : (
        /* Diverging Horizontal Bar Chart */
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 border-b border-slate-800 pb-2">
            <span>Partida</span>
            <div className="flex items-center gap-12 font-mono">
              <span>{yearA} → {yearB}</span>
              <span className="w-24 text-right">Variación Estr. ({unit === "PC_GDP" ? "pp PIB" : "M€"})</span>
            </div>
          </div>

          <div className="space-y-2">
            {era.items.map((item) => {
              const color = getTaxonColor(item.code);
              const maxScale = era.maxAbsDelta > 0 ? era.maxAbsDelta : 1;
              const barWidthPct = Math.min(100, (Math.abs(item.delta) / maxScale) * 100);
              const isPositive = item.delta >= 0;

              return (
                <div
                  key={item.code}
                  className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 space-y-2 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center justify-between text-xs min-w-0">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="font-semibold text-slate-200 truncate">
                        {item.shortLabel}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                        {item.code}
                      </span>
                    </div>

                    <div className="flex items-center gap-6 font-mono tabular-nums text-xs shrink-0">
                      <span className="text-slate-400">
                        {formatFiscalValue(item.valueA, unit, lang, { compact: true })} →{" "}
                        <strong className="text-slate-200">
                          {formatFiscalValue(item.valueB, unit, lang, { compact: true })}
                        </strong>
                      </span>

                      <span
                        className={`font-bold w-24 text-right ${
                          isPositive ? "text-sky-400" : "text-amber-400"
                        }`}
                      >
                        {formatFiscalDelta(item.delta, unit, lang)}
                      </span>
                    </div>
                  </div>

                  {/* Diverging Bar Track */}
                  <div className="relative w-full h-2 bg-slate-800/80 rounded-full overflow-hidden flex items-center">
                    <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-600 z-10" />
                    <div className="w-full flex h-full">
                      {/* Left Side (Negative Deltas) */}
                      <div className="w-1/2 flex justify-end">
                        {!isPositive && (
                          <div
                            className="h-full bg-amber-500 rounded-l-full transition-all duration-300"
                            style={{ width: `${barWidthPct}%` }}
                          />
                        )}
                      </div>
                      {/* Right Side (Positive Deltas) */}
                      <div className="w-1/2 flex justify-start">
                        {isPositive && (
                          <div
                            className="h-full bg-sky-400 rounded-r-full transition-all duration-300"
                            style={{ width: `${barWidthPct}%` }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default FiscalEraComparison;
