"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Info,
  Scale,
  Users,
  SlidersHorizontal,
  Layers,
  Globe2,
  X,
} from "lucide-react";
import type { Lang } from "@/lib/types";
import {
  getAvailableYears,
  getLatestYear,
  buildOverallSummary,
  buildGroupSummary,
  buildGroupAgeBrackets,
  type AdminRegisterYearRecord,
  type GroupSummaryCardData,
} from "./adminRegisterSelectors";

const NATIONALS_COLOR = "#38BDF8";
const FOREIGNERS_COLOR = "#F59E0B";
const UNEMPLOYMENT_COLOR = "#818CF8";
const PENSIONS_COLOR = "#C084FC";
const OVERALL_WAGES_COLOR = "#34D399";

type ViewTab = "overall" | "nationality";

interface AdminRegistersChartProps {
  records: AdminRegisterYearRecord[];
  lang?: Lang;
}

function formatHeadcount(num: number | null | undefined, lang: Lang): string {
  if (num === null || num === undefined || Number.isNaN(num)) return "—";
  if (num >= 1_000_000) {
    const val = (num / 1_000_000).toFixed(2);
    return lang === "en" ? `${val} M` : `${val.replace(".", ",")} M`;
  }
  if (num >= 1_000) {
    const val = (num / 1_000).toFixed(1);
    return lang === "en" ? `${val} k` : `${val.replace(".", ",")} mil`;
  }
  return num.toLocaleString(lang === "en" ? "en-US" : "es-ES");
}

function formatCurrencyEur(num: number | null | undefined, lang: Lang): string {
  if (num === null || num === undefined || Number.isNaN(num)) return "—";
  const intPart = Math.round(num).toLocaleString(lang === "en" ? "en-US" : "es-ES");
  return `${intPart} €`;
}

function formatBillionsEur(eur: number | null, lang: Lang): string {
  if (eur === null || !Number.isFinite(eur)) return "—";
  const billions = eur / 1_000_000_000;
  if (billions >= 1) {
    const formatted = billions.toFixed(1);
    return lang === "en" ? `€${formatted}B` : `${formatted.replace(".", ",")} MM€`;
  }
  const millions = Math.round(eur / 1_000_000);
  return lang === "en"
    ? `€${millions.toLocaleString("en-US")}M`
    : `${millions.toLocaleString("es-ES")} M€`;
}

function GroupBalanceCard({
  summary,
  globalMaxFlow,
  lang,
}: {
  summary: GroupSummaryCardData;
  globalMaxFlow: number;
  lang: Lang;
}) {
  const isSpanish = summary.nationality === "spanish";
  const accentColor = isSpanish ? NATIONALS_COLOR : FOREIGNERS_COLOR;

  const title = isSpanish
    ? lang === "en"
      ? "Spanish Nationality"
      : "Nacionalidad Española"
    : lang === "en"
    ? "Foreign Nationality"
    : "Nacionalidad Extranjera";

  const getPct = (val: number | null) =>
    val !== null && val > 0 && globalMaxFlow > 0
      ? Math.min(100, Math.max(0.5, (val / globalMaxFlow) * 100))
      : 0;

  return (
    <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: accentColor }}
          />
          <h3 className="text-sm font-bold text-white">{title}</h3>
        </div>
        {summary.salariedHeadcount !== null && (
          <span className="text-xs font-mono text-slate-300 bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded-full">
            {formatHeadcount(summary.salariedHeadcount, lang)}{" "}
            {lang === "en" ? "salaried" : "asalariados"}
          </span>
        )}
      </div>

      {/* 3 Flow Bars (scaled globally across both cards) */}
      <div className="space-y-3">
        {/* 1. Masa salarial bruta */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">
              {lang === "en" ? "Gross wage bill" : "Masa salarial bruta"}
            </span>
            <span className="font-mono font-bold text-white tabular-nums">
              {formatBillionsEur(summary.totalWagesEur, lang)}
            </span>
          </div>
          <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${getPct(summary.totalWagesEur)}%`, backgroundColor: accentColor }}
            />
          </div>
        </div>

        {/* 2. Coste desempleo */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">
              {lang === "en" ? "Unemployment cost" : "Coste desempleo"}
              {summary.unemploymentRecipients !== null && (
                <span className="text-slate-500 font-mono text-[11px] ml-1.5">
                  ({formatHeadcount(summary.unemploymentRecipients, lang)})
                </span>
              )}
            </span>
            <span className="font-mono font-bold text-indigo-300 tabular-nums">
              {formatBillionsEur(summary.unemploymentCostEur, lang)}
            </span>
          </div>
          <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${getPct(summary.unemploymentCostEur)}%`,
                backgroundColor: UNEMPLOYMENT_COLOR,
              }}
            />
          </div>
        </div>

        {/* 3. Coste pensiones */}
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-slate-300 font-medium flex items-center gap-1.5 flex-wrap">
              <span>{lang === "en" ? "Pensions cost" : "Coste pensiones"}</span>
              {summary.pensionRecipients !== null && (
                <span className="text-slate-500 font-mono text-[11px]">
                  ({formatHeadcount(summary.pensionRecipients, lang)})
                </span>
              )}
              {summary.isPensionCostEstimated && summary.appliedPensionWeightPct !== null && (
                <span
                  className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border ${
                    isSpanish
                      ? "bg-sky-950/80 text-sky-300 border-sky-800/70"
                      : "bg-amber-950/80 text-amber-300 border-amber-800/70"
                  }`}
                >
                  {`Est. · ${summary.appliedPensionWeightPct}%`}
                </span>
              )}
            </span>
            <span className="font-mono font-bold text-purple-300 tabular-nums shrink-0">
              {summary.pensionsCostEur !== null
                ? formatBillionsEur(summary.pensionsCostEur, lang)
                : lang === "en"
                ? "Data unavailable"
                : "Dato no disponible"}
            </span>
          </div>
          <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${getPct(summary.pensionsCostEur)}%`,
                backgroundColor: PENSIONS_COLOR,
              }}
            />
          </div>
        </div>
      </div>

      {/* 4. Ratio */}
      <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
        <span className="text-slate-400">
          {summary.pensionsCostEur !== null
            ? lang === "en"
              ? "Ratio (Wages / Unemp. + Est. Pensions):"
              : "Ratio (Masa salarial / Desempleo + Pens. est.):"
            : lang === "en"
            ? "Ratio (Gross wages / Unemployment):"
            : "Ratio (Masa salarial / Desempleo):"}
        </span>
        <span
          className="font-mono font-bold px-2.5 py-0.5 rounded-lg border text-sm tabular-nums"
          style={{
            color: accentColor,
            borderColor: `${accentColor}44`,
            backgroundColor: `${accentColor}12`,
          }}
        >
          {summary.wageToBenefitRatio !== null
            ? `${summary.wageToBenefitRatio.toFixed(2).replace(".", lang === "en" ? "." : ",")}x`
            : "—"}
        </span>
      </div>
    </div>
  );
}

export function AdminRegistersChart({
  records,
  lang = "es",
}: AdminRegistersChartProps) {
  const years = getAvailableYears(records);
  const [activeTab, setActiveTab] = useState<ViewTab>("overall");
  const [selectedYear, setSelectedYear] = useState<string>(() => getLatestYear(records));
  const [foreignPensionWeightPct, setForeignPensionWeightPct] = useState<number>(40);
  const [activeGroup, setActiveGroup] = useState<"spanish" | "foreign">("foreign");
  const [showWeightInfo, setShowWeightInfo] = useState<boolean>(false);

  const infoPopoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showWeightInfo) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (infoPopoverRef.current && !infoPopoverRef.current.contains(e.target as Node)) {
        setShowWeightInfo(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowWeightInfo(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [showWeightInfo]);

  const spanishPensionWeightPct = 100 - foreignPensionWeightPct;

  const activeYear = years.includes(selectedYear) ? selectedYear : getLatestYear(records);
  const currentIdx = years.indexOf(activeYear);
  const canPrev = currentIdx > 0;
  const canNext = currentIdx !== -1 && currentIdx < years.length - 1;

  const currentRecord =
    records.find((r) => r.year === activeYear) ?? records[records.length - 1];

  if (!currentRecord) return null;

  const overallSummary = buildOverallSummary(currentRecord);
  const spanishSummary = buildGroupSummary(
    currentRecord,
    "spanish",
    foreignPensionWeightPct
  );
  const foreignSummary = buildGroupSummary(
    currentRecord,
    "foreign",
    foreignPensionWeightPct
  );

  const globalMaxFlow = Math.max(
    spanishSummary.totalWagesEur ?? 0,
    spanishSummary.unemploymentCostEur ?? 0,
    spanishSummary.pensionsCostEur ?? 0,
    foreignSummary.totalWagesEur ?? 0,
    foreignSummary.unemploymentCostEur ?? 0,
    foreignSummary.pensionsCostEur ?? 0,
    1
  );

  const overallMaxFlow = Math.max(
    overallSummary.totalWagesEur ?? 0,
    overallSummary.unemploymentCostEur ?? 0,
    overallSummary.pensionsCostEur ?? 0,
    1
  );

  const getOverallPct = (val: number | null) =>
    val !== null && val > 0 && overallMaxFlow > 0
      ? Math.min(100, Math.max(0.5, (val / overallMaxFlow) * 100))
      : 0;

  const ageDetail = buildGroupAgeBrackets(
    currentRecord,
    activeTab === "overall" ? "total" : activeGroup
  );

  const hasPensionEstimate =
    spanishSummary.isPensionCostEstimated || foreignSummary.isPensionCostEstimated;

  const activeAccent =
    activeTab === "overall"
      ? OVERALL_WAGES_COLOR
      : activeGroup === "spanish"
      ? NATIONALS_COLOR
      : FOREIGNERS_COLOR;

  const activeTotalPensionsEur =
    activeTab === "overall"
      ? overallSummary.pensionsCostEur
      : activeGroup === "spanish"
      ? spanishSummary.pensionsCostEur
      : foreignSummary.pensionsCostEur;

  const activeTotalPensionRecipients =
    activeTab === "overall"
      ? overallSummary.pensionRecipients
      : activeGroup === "spanish"
      ? spanishSummary.pensionRecipients
      : foreignSummary.pensionRecipients;

  const isBottomPensionEstimated =
    activeTab === "nationality" &&
    (activeGroup === "spanish"
      ? spanishSummary.isPensionCostEstimated
      : foreignSummary.isPensionCostEstimated);

  const sharedAgeSectionScale = Math.max(
    ageDetail.maxSectionEur,
    activeTotalPensionsEur ?? 0,
    1
  );

  const getAgeSectionBarPct = (eur: number | null) =>
    eur !== null && eur > 0
      ? Math.min(100, Math.max(0.6, (eur / sharedAgeSectionScale) * 100))
      : 0;

  // Position of thumb along the 20%..80% slider (50% = exact center = real AEAT national average)
  const sliderFillPct = ((foreignPensionWeightPct - 20) / (80 - 20)) * 100;
  const realNationalAvgPensionEur =
    foreignSummary.systemAveragePensionEur ?? overallSummary.averagePensionEur;

  return (
    <div className="space-y-6">
      {/* Top Bar: View Tabs + Year Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label={lang === "en" ? "Data view mode" : "Modo de visualización"}
          className="inline-flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl self-start"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "overall"}
            onClick={() => setActiveTab("overall")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "overall"
                ? "bg-slate-800 text-white shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === "en" ? "Overall View" : "Vista general"}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "nationality"}
            onClick={() => setActiveTab("nationality")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "nationality"
                ? "bg-slate-800 text-white shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Globe2 className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {lang === "en" ? "Nationality Split" : "Desglose por nacionalidad"}
            </span>
          </button>
        </div>

        {/* Year Stepper */}
        <div className="inline-flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 gap-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => canPrev && setSelectedYear(years[currentIdx - 1])}
            disabled={!canPrev}
            aria-label={lang === "en" ? "Previous year" : "Año anterior"}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <select
            value={activeYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            aria-label={lang === "en" ? "Select year" : "Seleccionar año"}
            className="bg-transparent text-white font-mono font-bold text-sm px-2 py-0.5 focus:outline-none cursor-pointer"
          >
            {years.map((y) => (
              <option key={y} value={y} className="bg-slate-900 text-white">
                {y}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => canNext && setSelectedYear(years[currentIdx + 1])}
            disabled={!canNext}
            aria-label={lang === "en" ? "Next year" : "Año siguiente"}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TAB 1: OVERALL VIEW */}
      {activeTab === "overall" && (
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5">
          <div className="space-y-1 pb-4 border-b border-slate-800">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Scale className="w-5 h-5 text-emerald-400" />
              <span>
                {lang === "en"
                  ? `National Aggregate: Gross Wages vs. Unemployment & Pensions (${activeYear})`
                  : `Agregado Nacional: Masa Salarial frente a Desempleo y Pensiones (${activeYear})`}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              {lang === "en"
                ? "Unadjusted official national totals from AEAT Form 190 registers"
                : "Totales nacionales oficiales directos procedentes del Modelo 190 de la AEAT"}
            </p>
          </div>

          {/* 3 National KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-1.5">
              <div className="text-xs text-slate-400 font-medium">
                {lang === "en" ? "Total Gross Wage Bill" : "Masa Salarial Bruta Total"}
              </div>
              <div className="text-xl font-mono font-bold text-emerald-300 tabular-nums">
                {formatBillionsEur(overallSummary.totalWagesEur, lang)}
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                {formatHeadcount(overallSummary.salariedHeadcount, lang)}{" "}
                {lang === "en" ? "salaried workers" : "asalariados"}
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-1.5">
              <div className="text-xs text-slate-400 font-medium">
                {lang === "en" ? "Total Unemployment Cost" : "Coste Total Desempleo"}
              </div>
              <div className="text-xl font-mono font-bold text-indigo-300 tabular-nums">
                {formatBillionsEur(overallSummary.unemploymentCostEur, lang)}
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                {formatHeadcount(overallSummary.unemploymentRecipients, lang)}{" "}
                {lang === "en" ? "recipients" : "perceptores"}
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-1.5">
              <div className="text-xs text-slate-400 font-medium">
                {lang === "en" ? "Total Pensions Cost" : "Coste Total Pensiones"}
              </div>
              <div className="text-xl font-mono font-bold text-purple-300 tabular-nums">
                {formatBillionsEur(overallSummary.pensionsCostEur, lang)}
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                {formatHeadcount(overallSummary.pensionRecipients, lang)}{" "}
                {lang === "en" ? "pensioners" : "pensionistas"}
              </div>
            </div>
          </div>

          {/* Full-Width Proportional National Flow Comparison */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <h3 className="text-sm font-bold text-white">
                {lang === "en"
                  ? "Total National Flows (Proportional Scale)"
                  : "Flujos Nacionales Totales (Escala Proporcional)"}
              </h3>
              <span className="text-xs font-mono text-slate-400">AEAT · {activeYear}</span>
            </div>

            <div className="space-y-3.5">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">
                    {lang === "en" ? "Gross wage bill" : "Masa salarial bruta"}
                  </span>
                  <span className="font-mono font-bold text-white tabular-nums">
                    {formatBillionsEur(overallSummary.totalWagesEur, lang)}
                  </span>
                </div>
                <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${getOverallPct(overallSummary.totalWagesEur)}%`,
                      backgroundColor: OVERALL_WAGES_COLOR,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">
                    {lang === "en" ? "Unemployment cost" : "Coste desempleo"}
                  </span>
                  <span className="font-mono font-bold text-indigo-300 tabular-nums">
                    {formatBillionsEur(overallSummary.unemploymentCostEur, lang)}
                  </span>
                </div>
                <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${getOverallPct(overallSummary.unemploymentCostEur)}%`,
                      backgroundColor: UNEMPLOYMENT_COLOR,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">
                    {lang === "en" ? "Pensions cost" : "Coste pensiones"}
                  </span>
                  <span className="font-mono font-bold text-purple-300 tabular-nums">
                    {formatBillionsEur(overallSummary.pensionsCostEur, lang)}
                  </span>
                </div>
                <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${getOverallPct(overallSummary.pensionsCostEur)}%`,
                      backgroundColor: PENSIONS_COLOR,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
              <span className="text-slate-400">
                {lang === "en"
                  ? "National Ratio (Gross wages / Unemployment + Pensions):"
                  : "Ratio Nacional (Masa salarial / Desempleo + Pensiones):"}
              </span>
              <span className="font-mono font-bold px-2.5 py-0.5 rounded-lg border text-sm tabular-nums text-emerald-300 border-emerald-500/30 bg-emerald-500/10">
                {overallSummary.wageToBenefitRatio !== null
                  ? `${overallSummary.wageToBenefitRatio.toFixed(2).replace(".", lang === "en" ? "." : ",")}x`
                  : "—"}
              </span>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 flex items-start gap-2.5 text-xs text-slate-400 leading-relaxed">
            <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              {lang === "en"
                ? "Overall scope: All euro amounts shown in this view are exact, unadjusted national totals published directly by AEAT (Form 190)."
                : "Alcance general: Todos los importes en euros de esta vista son totales nacionales exactos publicados directamente por la AEAT (Modelo 190)."}
            </span>
          </div>
        </section>
      )}

      {/* TAB 2: NATIONALITY SPLIT VIEW */}
      {activeTab === "nationality" && (
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5">
          <div className="space-y-1 pb-4 border-b border-slate-800">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Scale className="w-5 h-5 text-sky-400" />
              <span>
                {lang === "en"
                  ? `Nationality Split: Gross Wages vs. Unemployment & Pensions (${activeYear})`
                  : `Desglose por Nacionalidad: Masa Salarial frente a Desempleo y Pensiones (${activeYear})`}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              {lang === "en"
                ? "Proportional monetary flows on a shared scale from AEAT Form 190 & INE Table 48951"
                : "Flujos monetarios proporcionales a escala común a partir de AEAT Modelo 190 e INE Tabla 48951"}
            </p>
          </div>

          {/* Dual-Color Split Balance Bar with Center Real National Average Marker */}
          {hasPensionEstimate && (
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 sm:p-4 space-y-3">
              {/* Top Row: Title + Info Pop-up + Quick Reset to Real National Avg */}
              <div className="flex items-center justify-between gap-2 flex-wrap" ref={infoPopoverRef}>
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-xs font-semibold text-slate-200">
                    {lang === "en"
                      ? "Relative average pension weight (Foreign vs. Spanish)"
                      : "Pensión media relativa (Extranjera vs. Española)"}
                  </span>

                  {/* Info Popover Button */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowWeightInfo((prev) => !prev)}
                      aria-expanded={showWeightInfo}
                      aria-label={
                        lang === "en"
                          ? "About estimated pension weights"
                          : "Información sobre la estimación del peso de pensiones"
                      }
                      className="w-5 h-5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Info className="w-3 h-3" />
                    </button>

                    {showWeightInfo && (
                      <div
                        role="dialog"
                        aria-label={
                          lang === "en"
                            ? "Pension estimation note"
                            : "Nota sobre estimación de pensiones"
                        }
                        className="absolute left-0 top-7 z-30 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-xl p-3.5 shadow-2xl text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-800">
                          <span className="font-bold text-amber-300">
                            {lang === "en"
                              ? "Estimated split (likely overestimated)"
                              : "Reparto estimado (probable sobreestimación)"}
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowWeightInfo(false)}
                            aria-label={lang === "en" ? "Close" : "Cerrar"}
                            className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          {lang === "en"
                            ? "AEAT only reports total national pension spending. The center (50% / 50%) assigns the exact real national average pension to both groups. Because foreign retirees generally have shorter Spanish contribution careers (pro-rata pensions), moving left of center reflects a lower foreign average payout."
                            : "La AEAT solo publica el gasto total nacional en pensiones. El centro (50% / 50%) aplica la media nacional real exacta a ambos grupos. Dado que los pensionistas extranjeros suelen tener carreras de cotización más cortas en España (pensiones a prorrata), desplazar a la izquierda refleja una pensión extranjera inferior."}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {foreignPensionWeightPct !== 50 && (
                  <button
                    type="button"
                    onClick={() => setForeignPensionWeightPct(50)}
                    className="text-[11px] font-mono text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                  >
                    {lang === "en" ? "Center (50/50)" : "Centrar (50/50)"}
                  </button>
                )}
              </div>

              {/* Middle Row: Dual-Color Split Slider Bar with Center Tick */}
              <div className="flex items-center gap-3 pt-1">
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: FOREIGNERS_COLOR }}
                  />
                  <span className="text-xs font-mono font-bold text-amber-300 tabular-nums">
                    {lang === "en" ? "Foreign" : "Extranjera"} {foreignPensionWeightPct}%
                  </span>
                </div>

                <div className="relative flex-1 flex items-center h-7">
                  {/* Center Reference Notch (50% = Real National Average) */}
                  <div
                    className="absolute left-1/2 -translate-x-1/2 -top-1 bottom-0 flex flex-col items-center pointer-events-none z-0"
                    aria-hidden="true"
                  >
                    <div
                      className={`w-0.5 h-full transition-colors ${
                        foreignPensionWeightPct === 50 ? "bg-white" : "bg-slate-500/80"
                      }`}
                    />
                  </div>

                  {/* Custom Two-Tone Track (Amber Left / Sky Blue Right) */}
                  <div className="w-full h-2.5 rounded-full overflow-hidden flex border border-slate-800 pointer-events-none relative z-[1]">
                    <div
                      className="h-full transition-all duration-75"
                      style={{
                        width: `${sliderFillPct}%`,
                        backgroundColor: FOREIGNERS_COLOR,
                      }}
                    />
                    <div
                      className="h-full flex-1 transition-all duration-75"
                      style={{
                        backgroundColor: NATIONALS_COLOR,
                      }}
                    />
                  </div>

                  {/* Interactive Transparent Range Input Overlaid */}
                  <input
                    type="range"
                    min={20}
                    max={80}
                    step={5}
                    value={foreignPensionWeightPct}
                    onChange={(e) => setForeignPensionWeightPct(Number(e.target.value))}
                    aria-label={
                      lang === "en"
                        ? "Foreign vs Spanish relative pension weight"
                        : "Peso relativo de pensión extranjera frente a española"
                    }
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                  />

                  {/* Visual Thumb */}
                  <div
                    className="w-4 h-4 rounded-full bg-white border-2 border-slate-900 shadow-md pointer-events-none absolute -translate-x-1/2 transition-all duration-75 z-10"
                    style={{ left: `${sliderFillPct}%` }}
                  />
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-mono font-bold text-sky-300 tabular-nums">
                    {spanishPensionWeightPct}% {lang === "en" ? "Spanish" : "Española"}
                  </span>
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: NATIONALS_COLOR }}
                  />
                </div>
              </div>

              {/* Bottom Sub-Row: Implied Annual Averages + Center Real National Average Callout */}
              <div className="grid grid-cols-3 items-center text-[11px] font-mono text-slate-400 pt-0.5 gap-2">
                <div className="text-left">
                  {foreignSummary.impliedAveragePensionEur !== null && (
                    <span>
                      ~
                      <strong className="text-amber-300">
                        {formatCurrencyEur(foreignSummary.impliedAveragePensionEur, lang)}
                      </strong>
                      /{lang === "en" ? "yr" : "año"}
                    </span>
                  )}
                </div>

                <div className="text-center flex flex-col items-center leading-tight">
                  <span
                    className={`font-semibold ${
                      foreignPensionWeightPct === 50 ? "text-white" : "text-slate-300"
                    }`}
                  >
                    ▲{" "}
                    {lang === "en"
                      ? "Center = Real national avg."
                      : "Centro = Media nacional real"}
                  </span>
                  {realNationalAvgPensionEur !== null && (
                    <span className="text-[10px] text-slate-400">
                      ({formatCurrencyEur(realNationalAvgPensionEur, lang)}/
                      {lang === "en" ? "yr" : "año"})
                    </span>
                  )}
                </div>

                <div className="text-right">
                  {spanishSummary.impliedAveragePensionEur !== null && (
                    <span>
                      ~
                      <strong className="text-sky-300">
                        {formatCurrencyEur(spanishSummary.impliedAveragePensionEur, lang)}
                      </strong>
                      /{lang === "en" ? "yr" : "año"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <GroupBalanceCard
              summary={spanishSummary}
              globalMaxFlow={globalMaxFlow}
              lang={lang}
            />
            <GroupBalanceCard
              summary={foreignSummary}
              globalMaxFlow={globalMaxFlow}
              lang={lang}
            />
          </div>
        </section>
      )}

      {/* Age Structure Section */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-400" />
              <span>
                {activeTab === "overall"
                  ? lang === "en"
                    ? `National Life-Cycle Structure by Age Bracket (${activeYear})`
                    : `Estructura Nacional por Tramos de Edad (${activeYear})`
                  : lang === "en"
                  ? `Life-Cycle Structure by Age Bracket (${activeYear})`
                  : `Estructura por Tramos de Edad (${activeYear})`}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {activeTab === "overall"
                ? lang === "en"
                  ? "Proportional bars for gross wages and unemployment cost by age bracket, plus total pension costs below"
                  : "Barras proporcionales de masa salarial y coste de desempleo por tramo, con el coste total de pensiones al final"
                : lang === "en"
                ? "Select a cohort to compare gross wages and unemployment cost by age bracket, plus total estimated pensions below"
                : "Selecciona un colectivo para comparar masa salarial y coste de desempleo por tramo, con el coste total de pensiones al final"}
            </p>
          </div>

          {activeTab === "nationality" && (
            <div
              role="group"
              aria-label={lang === "en" ? "Select cohort" : "Seleccionar colectivo"}
              className="inline-flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl self-start sm:self-auto"
            >
              <button
                type="button"
                onClick={() => setActiveGroup("spanish")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeGroup === "spanish"
                    ? "bg-slate-800 text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: NATIONALS_COLOR }}
                />
                <span>{lang === "en" ? "Spanish Nationality" : "Nacionalidad Española"}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveGroup("foreign")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeGroup === "foreign"
                    ? "bg-slate-800 text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: FOREIGNERS_COLOR }}
                />
                <span>{lang === "en" ? "Foreign Nationality" : "Nacionalidad Extranjera"}</span>
              </button>
            </div>
          )}
        </div>

        {/* Mini Legend */}
        <div className="flex items-center gap-4 flex-wrap text-[11px] text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: activeAccent }} />
            <span>{lang === "en" ? "Gross wages" : "Masa salarial"}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-xs"
              style={{ backgroundColor: UNEMPLOYMENT_COLOR }}
            />
            <span>{lang === "en" ? "Unemployment cost" : "Coste desempleo"}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: PENSIONS_COLOR }} />
            <span>{lang === "en" ? "Total pension costs" : "Coste total pensiones"}</span>
          </span>
        </div>

        {ageDetail.rows.length === 0 ? (
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-6 text-center text-xs text-slate-400">
            {lang === "en"
              ? "No age-band breakdown available for this selection."
              : "No hay desglose por tramos de edad disponible para esta selección."}
          </div>
        ) : (
          <div className="space-y-2.5">
            {ageDetail.rows.map((row) => {
              const wagesBarPct = getAgeSectionBarPct(row.totalWagesEur);
              const unempBarPct = getAgeSectionBarPct(row.unemploymentCostEur);

              return (
                <div
                  key={row.id}
                  className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 hover:border-slate-700 transition-all space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-white bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded">
                        {row.label}
                      </span>
                      <span className="text-slate-400 font-mono">
                        {formatHeadcount(row.headcount, lang)}{" "}
                        {lang === "en" ? "workers" : "asalariados"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap font-mono tabular-nums">
                      <span>
                        <span className="text-slate-400">
                          {lang === "en" ? "Wages: " : "Salarios: "}
                        </span>
                        <strong className="text-white">
                          {formatBillionsEur(row.totalWagesEur, lang)}
                        </strong>
                      </span>

                      {row.unemploymentCostEur !== null && (
                        <span>
                          <span className="text-slate-400">
                            {lang === "en" ? "Unemp.: " : "Desempleo: "}
                          </span>
                          <strong className="text-indigo-300">
                            {formatBillionsEur(row.unemploymentCostEur, lang)}
                          </strong>
                        </span>
                      )}

                      {row.ratio !== null && (
                        <span
                          className="font-bold px-2 py-0.5 rounded border"
                          style={{
                            color: activeAccent,
                            borderColor: `${activeAccent}44`,
                            backgroundColor: `${activeAccent}12`,
                          }}
                        >
                          {row.ratio.toFixed(1).replace(".", lang === "en" ? "." : ",")}x
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Side-by-Side Bars: Wages + Unemployment only */}
                  <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800 flex items-center gap-px">
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${wagesBarPct}%`,
                        backgroundColor: activeAccent,
                      }}
                      title={`${lang === "en" ? "Wages" : "Salarios"}: ${formatBillionsEur(
                        row.totalWagesEur,
                        lang
                      )}`}
                    />
                    {unempBarPct > 0 && (
                      <div
                        className="h-full transition-all duration-300"
                        style={{
                          width: `${unempBarPct}%`,
                          backgroundColor: UNEMPLOYMENT_COLOR,
                        }}
                        title={`${lang === "en" ? "Unemployment" : "Desempleo"}: ${formatBillionsEur(
                          row.unemploymentCostEur,
                          lang
                        )}`}
                      />
                    )}
                  </div>
                </div>
              );
            })}

            {/* Bottom Summary Bar: Total Pension Costs */}
            {activeTotalPensionsEur !== null && (
              <div className="bg-purple-950/20 border border-purple-800/50 rounded-xl p-3.5 space-y-2 mt-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-purple-200 bg-purple-950/80 border border-purple-800/70 px-2.5 py-0.5 rounded">
                      {lang === "en" ? "Total pension costs" : "Coste total pensiones"}
                    </span>
                    {activeTotalPensionRecipients !== null && (
                      <span className="text-slate-400 font-mono">
                        {formatHeadcount(activeTotalPensionRecipients, lang)}{" "}
                        {lang === "en" ? "pensioners" : "pensionistas"}
                      </span>
                    )}
                    {isBottomPensionEstimated && (
                      <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/70">
                        {`Est. · ${
                          activeGroup === "spanish"
                            ? spanishPensionWeightPct
                            : foreignPensionWeightPct
                        }%`}
                      </span>
                    )}
                  </div>

                  <div className="font-mono tabular-nums">
                    <span className="text-slate-400">
                      {lang === "en" ? "Total: " : "Total: "}
                    </span>
                    <strong className="text-purple-300 text-sm">
                      {formatBillionsEur(activeTotalPensionsEur, lang)}
                    </strong>
                  </div>
                </div>

                <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${getAgeSectionBarPct(activeTotalPensionsEur)}%`,
                      backgroundColor: PENSIONS_COLOR,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminRegistersChart;