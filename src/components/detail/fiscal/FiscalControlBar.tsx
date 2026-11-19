"use client";

import { ChevronLeft, ChevronRight, Scale, TrendingUp, TrendingDown } from "lucide-react";
import type { AnnualBalanceRecord, FiscalUnitId, Lang } from "@/types";
import {
  getAvailableYears,
  getYearMetrics,
  formatFiscalValue,
  formatFiscalDelta,
} from "./fiscalSelectors";
import { t } from "@/lib/i18n";
import ConceptHelpTrigger from "@/components/detail/guide/ConceptHelpTrigger";

interface FiscalControlBarProps {
  balances: AnnualBalanceRecord[];
  selectedYear: string;
  onSelectYear: (year: string) => void;
  unit: FiscalUnitId;
  onSelectUnit: (unit: FiscalUnitId) => void;
  lang?: Lang;
}

export function FiscalControlBar({
  balances,
  selectedYear,
  onSelectYear,
  unit,
  onSelectUnit,
  lang = "es",
}: FiscalControlBarProps) {
  const years = getAvailableYears(balances);
  const currentIdx = years.indexOf(selectedYear);

  const yearMetrics = getYearMetrics(balances, selectedYear, unit);
  const otherUnit: FiscalUnitId = unit === "PC_GDP" ? "MIO_EUR" : "PC_GDP";
  const otherYearMetrics = getYearMetrics(balances, selectedYear, otherUnit);

  if (!yearMetrics) return null;

  const { record, metrics, prevMetrics } = yearMetrics;
  const otherMetrics = otherYearMetrics?.metrics;
  const otherPrevMetrics = otherYearMetrics?.prevMetrics;

  const canPrev = currentIdx > 0;
  const canNext = currentIdx !== -1 && currentIdx < years.length - 1;

  const handlePrev = () => {
    if (canPrev) onSelectYear(years[currentIdx - 1]);
  };

  const handleNext = () => {
    if (canNext) onSelectYear(years[currentIdx + 1]);
  };

  // Revenues KPI calculations
  const revVal = metrics.totals.revenue;
  const otherRevVal = otherMetrics?.totals.revenue ?? 0;
  const revYoY = prevMetrics ? revVal - prevMetrics.totals.revenue : null;

  // Expenditures KPI calculations
  const expVal = metrics.totals.expenditure;
  const otherExpVal = otherMetrics?.totals.expenditure ?? 0;
  const expYoY = prevMetrics ? expVal - prevMetrics.totals.expenditure : null;

  // Balance KPI calculations
  const balVal = metrics.totals.balance;
  const otherBalVal = otherMetrics?.totals.balance ?? 0;
  const balYoY = prevMetrics ? balVal - prevMetrics.totals.balance : null;

  const isSurplus = balVal >= 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
      {/* Top Controls Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Unit Switcher */}
        <div
          role="group"
          aria-label="Selección de unidad fiscal"
          className="inline-flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl"
        >
          <button
            onClick={() => onSelectUnit("PC_GDP")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1 ${
              unit === "PC_GDP"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>{t("unitPcGdp", lang)}</span>
          </button>
          <button
            onClick={() => onSelectUnit("MIO_EUR")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              unit === "MIO_EUR"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {t("unitMioEur", lang)}
          </button>
          <ConceptHelpTrigger code="PC_GDP" lang={lang} className="ml-1.5" />
          <ConceptHelpTrigger code="S13" lang={lang} className="ml-1" />
        </div>

        {/* Year Stepper */}
        <div className="flex items-center justify-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1">
          <button
            onClick={handlePrev}
            disabled={!canPrev}
            aria-label={t("previousYear", lang)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <select
            value={selectedYear}
            onChange={(e) => onSelectYear(e.target.value)}
            className="bg-transparent text-white font-mono font-bold text-sm py-1 px-2 focus:outline-none cursor-pointer"
          >
            {years.map((y) => {
              const rec = balances.find((b) => b.year === y);
              const hasCofog = rec?.cofogAvailable ?? true;
              return (
                <option key={y} value={y} className="bg-slate-900 text-white">
                  {y} {!hasCofog ? `(${lang === "es" ? "sin COFOG" : "no COFOG"})` : ""}
                </option>
              );
            })}
          </select>

          <button
            onClick={handleNext}
            disabled={!canNext}
            aria-label={t("nextYear", lang)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3-Column Macro KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* KPI 1: Revenues */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 space-y-1">
          <div className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase flex items-center justify-between">
            <span>{t("totalRevenue", lang)}</span>
            <ConceptHelpTrigger code="TR" lang={lang} />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-sky-400 font-mono tabular-nums">
            {formatFiscalValue(revVal, unit, lang, { compact: true })}
          </div>
          <div className="text-xs text-slate-400 flex items-center justify-between font-mono tabular-nums pt-0.5 border-t border-slate-800/60">
            <span>{formatFiscalValue(otherRevVal, otherUnit, lang, { compact: true })}</span>
            {revYoY !== null && (
              <span className="text-slate-300">
                {formatFiscalDelta(revYoY, unit, lang)} {t("yoyChange", lang)}
              </span>
            )}
          </div>
        </div>

        {/* KPI 2: Expenditures */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 space-y-1">
          <div className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase flex items-center justify-between">
            <span>{t("totalExpenditure", lang)}</span>
            <ConceptHelpTrigger code="TE" lang={lang} />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-indigo-400 font-mono tabular-nums">
            {formatFiscalValue(expVal, unit, lang, { compact: true })}
          </div>
          <div className="text-xs text-slate-400 flex items-center justify-between font-mono tabular-nums pt-0.5 border-t border-slate-800/60">
            <span>{formatFiscalValue(otherExpVal, otherUnit, lang, { compact: true })}</span>
            {expYoY !== null && (
              <span className="text-slate-300">
                {formatFiscalDelta(expYoY, unit, lang)} {t("yoyChange", lang)}
              </span>
            )}
          </div>
        </div>

        {/* KPI 3: Fiscal Balance */}
        <div
          className={`bg-slate-950/70 border rounded-xl p-3.5 space-y-1 ${
            isSurplus ? "border-emerald-500/30" : "border-rose-500/30"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1">
              <span>{t("fiscalBalance", lang)}</span>
              <ConceptHelpTrigger code="B9" lang={lang} />
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isSurplus
                  ? "bg-emerald-950 text-emerald-400 border border-emerald-800/80"
                  : "bg-rose-950 text-rose-400 border border-rose-800/80"
              }`}
            >
              {isSurplus ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {isSurplus ? t("surplus", lang) : t("deficit", lang)}
            </span>
          </div>
          <div
            className={`text-xl sm:text-2xl font-bold font-mono tabular-nums ${
              isSurplus ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {formatFiscalValue(balVal, unit, lang, { signed: true, compact: true })}
          </div>
          <div className="text-xs text-slate-400 flex items-center justify-between font-mono tabular-nums pt-0.5 border-t border-slate-800/60">
            <span>
              {formatFiscalValue(otherBalVal, otherUnit, lang, { signed: true, compact: true })}
            </span>
            {balYoY !== null && (
              <span className="text-slate-300">
                {formatFiscalDelta(balYoY, unit, lang)} {t("yoyChange", lang)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FiscalControlBar;
