"use client";

import { useState } from "react";
import type { FiscalBalanceItem, FiscalUnitId, Lang } from "@/lib/types";
import { getAvailableYears } from "./fiscalSelectors";
import FiscalControlBar from "./FiscalControlBar";
import FiscalMacroChart from "./FiscalMacroChart";
import FiscalAnatomySplit from "./FiscalAnatomySplit";
import FiscalSankeyDiagram from "./FiscalSankeyDiagram";
import FiscalEraComparison from "./FiscalEraComparison";
import { t } from "@/lib/i18n";

interface FiscalBalanceViewProps {
  item: FiscalBalanceItem;
  lang?: Lang;
  locale?: Lang;
}

type AnatomyTab = "split" | "sankey" | "compare";

export function FiscalBalanceView({
  item,
  lang,
  locale = "es",
}: FiscalBalanceViewProps) {
  const activeLang = lang || locale || "es";
  const { annualBalances, taxonomy } = item;

  const years = getAvailableYears(annualBalances);
  const defaultYear = years.length > 0 ? years[years.length - 1] : "2025";

  const [unit, setUnit] = useState<FiscalUnitId>("PC_GDP");
  const [selectedYear, setSelectedYear] = useState<string>(defaultYear);
  const [anatomyTab, setAnatomyTab] = useState<AnatomyTab>("split");

  const currentRecord =
    annualBalances.find((b) => b.year === selectedYear) ||
    annualBalances[annualBalances.length - 1];

  if (!currentRecord) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Layer 0: Control Bar & KPI Cards */}
      <FiscalControlBar
        balances={annualBalances}
        selectedYear={selectedYear}
        onSelectYear={setSelectedYear}
        unit={unit}
        onSelectUnit={setUnit}
        lang={activeLang}
      />

      {/* Layer 1: Macro Historical Explorer (1995-Present) */}
      <FiscalMacroChart
        balances={annualBalances}
        taxonomy={taxonomy}
        unit={unit}
        selectedYear={selectedYear}
        onSelectYear={setSelectedYear}
        lang={activeLang}
      />

      {/* Layer 2: Anatomy & Structural Subviews */}
      <div className="space-y-4">
        {/* Section Header & Tab Switcher */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xl">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>{t("budgetAnatomy", activeLang)}</span>
              <span className="text-xs font-mono font-bold text-blue-400 bg-blue-950 border border-blue-800/80 px-2 py-0.5 rounded-full">
                {selectedYear}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Inspecciona la estructura detallada de ingresos tributarios y gastos por función social.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="inline-flex p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold shrink-0">
            <button
              onClick={() => setAnatomyTab("split")}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                anatomyTab === "split"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {t("tabBreakdown", activeLang)}
            </button>
            <button
              onClick={() => setAnatomyTab("sankey")}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                anatomyTab === "sankey"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {t("tabFlow", activeLang)}
            </button>
            <button
              onClick={() => setAnatomyTab("compare")}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                anatomyTab === "compare"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {t("tabCompare", activeLang)}
            </button>
          </div>
        </div>

        {/* Selected Layer 2 Subview */}
        {anatomyTab === "split" && (
          <FiscalAnatomySplit
            record={currentRecord}
            taxonomy={taxonomy}
            unit={unit}
            balances={annualBalances}
            onSelectYear={setSelectedYear}
            lang={activeLang}
          />
        )}

        {anatomyTab === "sankey" && (
          <FiscalSankeyDiagram
            record={currentRecord}
            taxonomy={taxonomy}
            unit={unit}
            balances={annualBalances}
            onSelectYear={setSelectedYear}
            onSwitchToSplit={() => setAnatomyTab("split")}
            lang={activeLang}
          />
        )}

        {anatomyTab === "compare" && (
          <FiscalEraComparison
            balances={annualBalances}
            taxonomy={taxonomy}
            unit={unit}
            lang={activeLang}
          />
        )}
      </div>
    </div>
  );
}

export default FiscalBalanceView;
