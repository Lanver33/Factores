"use client";

import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Info,
  Table,
  ChevronDown,
  ChevronUp,
  Scale,
  Users,
  AlertTriangle,
  SlidersHorizontal,
} from "lucide-react";
import type { Lang } from "@/lib/types";
import {
  getAvailableYears,
  getLatestYear,
  buildGroupSummary,
  buildGroupAgeBrackets,
  getTgssBreakdown,
  type AdminRegisterYearRecord,
  type GroupSummaryCardData,
} from "./adminRegisterSelectors";

const NATIONALS_COLOR = "#38BDF8";
const FOREIGNERS_COLOR = "#F59E0B";
const UNEMPLOYMENT_COLOR = "#818CF8";
const PENSIONS_COLOR = "#C084FC";

const PENSION_WEIGHT_PRESETS = [20, 40, 50, 60, 80] as const;

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

        {/* 3. Coste pensiones (Estimado con INE 48951 + peso complementario) */}
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
                  {lang === "en"
                    ? `Est. · ${summary.appliedPensionWeightPct}% wt.`
                    : `Est. · peso ${summary.appliedPensionWeightPct}%`}
                </span>
              )}
            </span>
            <span className="font-mono font-bold text-purple-300 tabular-nums shrink-0">
              {summary.pensionsCostEur !== null
                ? formatBillionsEur(summary.pensionsCostEur, lang)
                : lang === "en"
                ? "Total only"
                : "Solo total"}
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
  const [selectedYear, setSelectedYear] = useState<string>(() => getLatestYear(records));
  const [foreignPensionWeightPct, setForeignPensionWeightPct] = useState<number>(40);
  const [activeGroup, setActiveGroup] = useState<"spanish" | "foreign">("foreign");
  const [showAuditTable, setShowAuditTable] = useState<boolean>(false);

  const spanishPensionWeightPct = 100 - foreignPensionWeightPct;

  const activeYear = years.includes(selectedYear) ? selectedYear : getLatestYear(records);
  const currentIdx = years.indexOf(activeYear);
  const canPrev = currentIdx > 0;
  const canNext = currentIdx !== -1 && currentIdx < years.length - 1;

  const currentRecord =
    records.find((r) => r.year === activeYear) ?? records[records.length - 1];

  if (!currentRecord) return null;

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

  const ageDetail = buildGroupAgeBrackets(currentRecord, activeGroup);
  const tgssInfo = getTgssBreakdown(currentRecord);
  const inePensioners = currentRecord.ine?.contributoryPensionersByNationality;

  const hasPensionEstimate =
    spanishSummary.isPensionCostEstimated || foreignSummary.isPensionCostEstimated;

  const activeAccent = activeGroup === "spanish" ? NATIONALS_COLOR : FOREIGNERS_COLOR;

  return (
    <div className="space-y-6">
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Scale className="w-5 h-5 text-sky-400" />
              <span>
                {lang === "en"
                  ? "Direct Monetary Flows by Group: Gross Wages vs. Unemployment & Pensions"
                  : "Flujos Monetarios Directos por Grupo: Masa Salarial frente a Desempleo y Pensiones"}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              {lang === "en"
                ? `Proportional monetary flows on a shared scale from AEAT Form 190 & INE Table 48951 (${activeYear})`
                : `Flujos monetarios proporcionales a escala común a partir de AEAT Modelo 190 e INE Tabla 48951 (${activeYear})`}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 gap-1">
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
        </div>

        {/* Complementary Pension Weighting Control Bar (20%–80% Foreign / 80%–20% Spanish) */}
        {hasPensionEstimate && (
          <div className="bg-amber-950/20 border border-amber-800/50 rounded-xl p-3.5 sm:p-4 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-amber-200">
                    {lang === "en"
                      ? "Foreign pension cost is an estimate (likely overestimated at equal or higher weights)"
                      : "El coste de pensiones extranjeras es una estimación (probable sobreestimación en pesos iguales o altos)"}
                  </div>
                  <p className="text-[11px] text-amber-200/80 leading-relaxed">
                    {lang === "en"
                      ? "AEAT only publishes total national pension spending. Because foreign retirees typically have shorter Spanish contribution careers (pro-rata pensions), their average pension is lower than Spanish nationals'. Set the relative per-person weight below (Foreign / Spanish always sum to 100%):"
                      : "La AEAT solo publica el gasto total nacional en pensiones. Dado que los pensionistas extranjeros suelen tener carreras de cotización más cortas en España (pensiones a prorrata), su pensión media es inferior a la de los españoles. Ajusta el peso relativo por persona (Extranjera / Española siempre suman 100%):"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                {PENSION_WEIGHT_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setForeignPensionWeightPct(preset)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
                      foreignPensionWeightPct === preset
                        ? "bg-amber-500/25 text-amber-200 border-amber-500/70 shadow-xs"
                        : "bg-slate-950/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700"
                    }`}
                  >
                    {preset}/{100 - preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center gap-3 pt-1">
              <div className="flex items-center gap-2 text-xs shrink-0 flex-wrap">
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-mono font-bold text-amber-300 bg-amber-950/70 border border-amber-800/70 px-2 py-0.5 rounded">
                  {lang === "en" ? "Foreign" : "Extranjera"}: {foreignPensionWeightPct}%
                </span>
                <span className="text-slate-500 font-mono">/</span>
                <span className="font-mono font-bold text-sky-300 bg-sky-950/70 border border-sky-800/70 px-2 py-0.5 rounded">
                  {lang === "en" ? "Spanish" : "Española"}: {spanishPensionWeightPct}%
                </span>
              </div>

              <div className="flex-1 flex items-center gap-2.5">
                <span className="text-[11px] font-mono text-slate-400">20%</span>
                <input
                  type="range"
                  min={20}
                  max={80}
                  step={5}
                  value={foreignPensionWeightPct}
                  onChange={(e) => setForeignPensionWeightPct(Number(e.target.value))}
                  aria-label={
                    lang === "en"
                      ? "Foreign vs Spanish pension weight slider"
                      : "Selector de peso relativo de pensiones extranjeras frente a españolas"
                  }
                  className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <span className="text-[11px] font-mono text-slate-400">80%</span>
              </div>

              {(foreignSummary.impliedAveragePensionEur !== null ||
                spanishSummary.impliedAveragePensionEur !== null) && (
                <div className="text-[11px] font-mono text-slate-400 shrink-0 flex items-center gap-2 flex-wrap">
                  <span>{lang === "en" ? "Implied avg:" : "Media implícita:"}</span>
                  <strong className="text-amber-200">
                    {formatCurrencyEur(foreignSummary.impliedAveragePensionEur, lang)}
                  </strong>
                  <span>vs</span>
                  <strong className="text-sky-200">
                    {formatCurrencyEur(spanishSummary.impliedAveragePensionEur, lang)}
                  </strong>
                </div>
              )}
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

        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 flex items-start gap-2.5 text-xs text-slate-400 leading-relaxed">
          <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <span>
            {lang === "en"
              ? `Scope note: Gross wages and unemployment benefits come directly from AEAT Form 190 by nationality. Pensioner headcounts by nationality come from INE Table 48951, and euro pension costs are apportioned from AEAT's official national total using the selected relative weights (${foreignPensionWeightPct}% Foreign / ${spanishPensionWeightPct}% Spanish).`
              : `Alcance de los datos: La masa salarial y el coste de desempleo proceden directamente del Modelo 190 de la AEAT por nacionalidad. El número de pensionistas por nacionalidad procede de la Tabla 48951 del INE, y el coste en euros se reparte sobre el total oficial de la AEAT aplicando los pesos relativos seleccionados (${foreignPensionWeightPct}% Extranjera / ${spanishPensionWeightPct}% Española).`}
          </span>
        </div>
      </section>

      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-400" />
              <span>
                {lang === "en"
                  ? `Life-Cycle Structure by Age Bracket (${activeYear})`
                  : `Estructura por Tramos de Edad (${activeYear})`}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {lang === "en"
                ? "Select a cohort to inspect gross wages, unemployment cost, and internal ratios across age bands"
                : "Selecciona un colectivo para inspeccionar su masa salarial, coste de desempleo y ratio interna en cada tramo de edad"}
            </p>
          </div>

          <div
            role="group"
            aria-label={lang === "en" ? "Select cohort" : "Seleccionar colectivo"}
            className="inline-flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl self-start sm:self-auto"
          >
            <button
              type="button"
              onClick={() => setActiveGroup("spanish")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
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
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
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
              const barPct = ageDetail.hasBenefitsData
                ? ageDetail.maxRatio > 0 && row.ratio !== null
                  ? Math.min(100, Math.max(3, (row.ratio / ageDetail.maxRatio) * 100))
                  : 0
                : ageDetail.maxWageEur > 0
                ? Math.min(100, Math.max(3, (row.averageAnnualWageEur / ageDetail.maxWageEur) * 100))
                : 0;

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

                      {row.pensionsCostEur !== null && (
                        <span>
                          <span className="text-slate-400">
                            {lang === "en" ? "Pensions: " : "Pensiones: "}
                          </span>
                          <strong className="text-purple-300">
                            {formatBillionsEur(row.pensionsCostEur, lang)}
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

                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${barPct}%`,
                        backgroundColor: activeAccent,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <button
          type="button"
          onClick={() => setShowAuditTable(!showAuditTable)}
          className="w-full flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Table className="w-4 h-4 text-sky-400" />
            <span>
              {lang === "en"
                ? `Inspect Raw Official Tables (AEAT, INE & TGSS · ${activeYear})`
                : `Ver Tablas Numéricas Completas de Fuentes Oficiales (AEAT, INE y TGSS · ${activeYear})`}
            </span>
          </span>
          {showAuditTable ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {showAuditTable && (
          <div className="mt-4 pt-4 border-t border-slate-800 space-y-6">
            <div className="space-y-2 overflow-x-auto">
              <div className="text-xs font-bold text-white">
                {lang === "en"
                  ? `AEAT Salaried Workers — ${activeGroup === "spanish" ? "Spanish" : "Foreign"} Nationality (${activeYear})`
                  : `AEAT Asalariados — Nacionalidad ${activeGroup === "spanish" ? "Española" : "Extranjera"} (${activeYear})`}
              </div>
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2 px-2">{lang === "en" ? "Age Band" : "Tramo de Edad"}</th>
                    <th className="py-2 px-2 text-right">{lang === "en" ? "Headcount" : "Asalariados"}</th>
                    <th className="py-2 px-2 text-right">{lang === "en" ? "Total Wages (€)" : "Masa Salarial (€)"}</th>
                    <th className="py-2 px-2 text-right">{lang === "en" ? "Mean Annual (€)" : "Salario Medio (€)"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {ageDetail.rows.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-950/60">
                      <td className="py-2 px-2 font-bold text-slate-100">{r.label}</td>
                      <td className="py-2 px-2 text-right tabular-nums">
                        {r.headcount.toLocaleString(lang === "en" ? "en-US" : "es-ES")}
                      </td>
                      <td className="py-2 px-2 text-right tabular-nums">
                        {Math.round(r.totalWagesEur).toLocaleString(lang === "en" ? "en-US" : "es-ES")} €
                      </td>
                      <td className="py-2 px-2 text-right tabular-nums font-bold text-white">
                        {formatCurrencyEur(r.averageAnnualWageEur, lang)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {inePensioners && (
              <div className="space-y-2 overflow-x-auto pt-2 border-t border-slate-800/80">
                <div className="text-xs font-bold text-white">
                  {lang === "en"
                    ? `INE Table 48951 — Contributory Social Security Pensioners by Nationality (${activeYear})`
                    : `INE Tabla 48951 — Pensionistas Contributivos de la Seguridad Social por Nacionalidad (${activeYear})`}
                </div>
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2 px-2">{lang === "en" ? "Nationality" : "Nacionalidad"}</th>
                      <th className="py-2 px-2 text-right">{lang === "en" ? "Pensioners" : "Pensionistas"}</th>
                      <th className="py-2 px-2 text-right">{lang === "en" ? "Share" : "Cuota"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {(["spanish", "foreign"] as const).map((natKey) => {
                      const count = inePensioners[natKey];
                      const tot =
                        inePensioners.total ??
                        ((inePensioners.spanish ?? 0) + (inePensioners.foreign ?? 0));
                      const share = count !== undefined && tot > 0 ? (count / tot) * 100 : null;
                      return (
                        <tr key={natKey} className="hover:bg-slate-950/60">
                          <td className="py-2 px-2 font-sans text-slate-200">
                            {natKey === "spanish"
                              ? lang === "en"
                                ? "Spanish Nationality"
                                : "Nacionalidad Española"
                              : lang === "en"
                              ? "Foreign Nationality"
                              : "Nacionalidad Extranjera"}
                          </td>
                          <td className="py-2 px-2 text-right tabular-nums">
                            {count !== undefined
                              ? count.toLocaleString(lang === "en" ? "en-US" : "es-ES")
                              : "—"}
                          </td>
                          <td className="py-2 px-2 text-right tabular-nums text-slate-400">
                            {share !== null
                              ? `${share.toFixed(2).replace(".", lang === "en" ? "." : ",")}%`
                              : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {tgssInfo.byCountry.length > 0 && (
              <div className="space-y-2 overflow-x-auto pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">
                    {lang === "en"
                      ? `TGSS Foreign Social Security Affiliates by Country (Top 15 · ${currentRecord.tgss?.referencePeriod ?? activeYear})`
                      : `TGSS Afiliados Extranjeros por País (Top 15 · ${currentRecord.tgss?.referencePeriod ?? activeYear})`}
                  </span>
                  {tgssInfo.totalForeign !== null && (
                    <span className="font-mono text-amber-400 font-bold">
                      Total: {tgssInfo.totalForeign.toLocaleString(lang === "en" ? "en-US" : "es-ES")}
                    </span>
                  )}
                </div>
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2 px-2">{lang === "en" ? "Country" : "País"}</th>
                      <th className="py-2 px-2 text-right">{lang === "en" ? "Affiliates" : "Afiliados"}</th>
                      <th className="py-2 px-2 text-right">{lang === "en" ? "Share" : "Cuota"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {tgssInfo.byCountry.slice(0, 15).map((c) => (
                      <tr key={c.country} className="hover:bg-slate-950/60">
                        <td className="py-2 px-2 font-sans text-slate-200">{c.country}</td>
                        <td className="py-2 px-2 text-right tabular-nums">
                          {c.affiliates.toLocaleString(lang === "en" ? "en-US" : "es-ES")}
                        </td>
                        <td className="py-2 px-2 text-right tabular-nums text-slate-400">
                          {c.shareOfTotalPct.toFixed(1).replace(".", lang === "en" ? "." : ",")}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminRegistersChart;
