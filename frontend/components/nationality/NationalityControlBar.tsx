"use client";

import React from "react";
import { ChevronLeft, ChevronRight, Users, Briefcase, TrendingUp, Wallet, Info } from "lucide-react";
import type { NationalityAnnualRecord, PopulationDefinition, Lang } from "@/lib/types";
import {
  getAvailableYears,
  getHeadlineKpis,
} from "./nationalitySelectors";
import { NATIONALS_COLOR, FOREIGNERS_COLOR } from "./nationalityPalette";
import { t } from "@/lib/i18n";
import { ConceptHelpTrigger } from "@/components/detail/guide/ConceptHelpTrigger";

interface NationalityControlBarProps {
  records: NationalityAnnualRecord[];
  selectedYear: string;
  onSelectYear: (year: string) => void;
  definition: PopulationDefinition;
  onSelectDefinition: (definition: PopulationDefinition) => void;
  lang?: Lang;
}

export function NationalityControlBar({
  records,
  selectedYear,
  onSelectYear,
  definition,
  onSelectDefinition,
  lang = "es",
}: NationalityControlBarProps) {
  const years = getAvailableYears(records);
  const currentIdx = years.indexOf(selectedYear);

  const canPrev = currentIdx > 0;
  const canNext = currentIdx !== -1 && currentIdx < years.length - 1;

  const handlePrev = () => {
    if (canPrev) onSelectYear(years[currentIdx - 1]);
  };

  const handleNext = () => {
    if (canNext) onSelectYear(years[currentIdx + 1]);
  };

  const kpis = getHeadlineKpis(records, selectedYear, definition, lang);

  const isCitizenship = definition === "citizenship";

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
      {/* Top Controls Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Definition Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-400 tracking-wider">
            {t("definitionLabel", lang)}
          </span>
          <div
            role="group"
            aria-label="Selección de definición de población"
            className="inline-flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl"
          >
            <button
              type="button"
              onClick={() => onSelectDefinition("citizenship")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5 ${
                isCitizenship
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>{t("definitionCitizenship", lang)}</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectDefinition("birthplace")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5 ${
                !isCitizenship
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>{t("definitionBirthplace", lang)}</span>
            </button>
          </div>
          <ConceptHelpTrigger code="CITIZEN_VS_BIRTH" lang={lang} />
        </div>

        {/* Year Stepper */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-bold text-slate-400 tracking-wider">
            {t("activeYearLabel", lang)}
          </span>
          <div className="inline-flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 gap-1">
            <button
              type="button"
              onClick={handlePrev}
              disabled={!canPrev}
              aria-label={t("previousYear", lang)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <select
              value={selectedYear}
              onChange={(e) => onSelectYear(e.target.value)}
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
              onClick={handleNext}
              disabled={!canNext}
              aria-label={t("nextYear", lang)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
        {/* Card 1: Población */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-700/80 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              {t(kpis.popKpi.titleKey, lang)}
            </span>
            {kpis.popKpi.yoyDelta && (
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                {kpis.popKpi.yoyDelta}
              </span>
            )}
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-white font-mono tabular-nums">
              {kpis.popKpi.foreignValue}
            </div>
            <div className="text-xs text-slate-400 font-mono tabular-nums flex items-center justify-between">
              <span>{kpis.popKpi.foreignSubtext}</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: NATIONALS_COLOR }} />
              {isCitizenship ? t("groupNationals", lang) : t("groupNativeBorn", lang)}:
            </span>
            <span className="font-mono text-slate-200">{kpis.popKpi.nationalSubtext}</span>
          </div>
        </div>

        {/* Card 2: Edad Laboral (15-64) */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-700/80 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
              {t(kpis.workingAgeKpi.titleKey, lang)}
            </span>
            <ConceptHelpTrigger code="WORKING_AGE" lang={lang} />
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-white font-mono tabular-nums flex items-baseline gap-2">
              <span style={{ color: FOREIGNERS_COLOR }}>{kpis.workingAgeKpi.foreignValue}</span>
              <span className="text-xs text-slate-400 font-normal">vs</span>
              <span style={{ color: NATIONALS_COLOR }}>{kpis.workingAgeKpi.nationalValue}</span>
            </div>
            <div className="text-xs text-slate-400 font-mono flex items-center justify-between">
              <span>{isCitizenship ? t("groupForeigners", lang) : t("groupForeignBorn", lang)}</span>
              <span>{isCitizenship ? t("groupNationals", lang) : t("groupNativeBorn", lang)}</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
            <span>{lang === "en" ? "Concentration in 15–64" : "Concentración en 15–64"}</span>
            {kpis.workingAgeKpi.yoyDelta && (
              <span className="font-mono text-slate-300">{kpis.workingAgeKpi.yoyDelta}</span>
            )}
          </div>
        </div>

        {/* Card 3: Tasa de Empleo */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-700/80 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
              {t(kpis.employmentKpi.titleKey, lang)}
            </span>
            <ConceptHelpTrigger code="EMPLOYMENT_RATE" lang={lang} />
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-white font-mono tabular-nums flex items-baseline gap-2">
              <span style={{ color: FOREIGNERS_COLOR }}>{kpis.employmentKpi.foreignValue}</span>
              <span className="text-xs text-slate-400 font-normal">vs</span>
              <span style={{ color: NATIONALS_COLOR }}>{kpis.employmentKpi.nationalValue}</span>
            </div>
            <div className="text-xs text-slate-400 font-mono flex items-center justify-between">
              <span>{isCitizenship ? t("groupForeigners", lang) : t("groupForeignBorn", lang)}</span>
              <span>{isCitizenship ? t("groupNationals", lang) : t("groupNativeBorn", lang)}</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
            <span>{lang === "en" ? "LFS / EPA 15–64" : "EPA 15–64 años"}</span>
            {kpis.employmentKpi.yoyDelta && (
              <span className="font-mono text-slate-300">{kpis.employmentKpi.yoyDelta}</span>
            )}
          </div>
        </div>

        {/* Card 4: Renta Mediana */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-700/80 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-purple-400" />
              {t(kpis.incomeKpi.titleKey, lang)}
            </span>
            <ConceptHelpTrigger code="EQUIVALISED_INCOME" lang={lang} />
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-white font-mono tabular-nums flex items-baseline gap-2">
              <span style={{ color: FOREIGNERS_COLOR }}>{kpis.incomeKpi.foreignValue}</span>
              <span className="text-xs text-slate-400 font-normal">vs</span>
              <span style={{ color: NATIONALS_COLOR }}>{kpis.incomeKpi.nationalValue}</span>
            </div>
            <div className="text-xs text-slate-400 font-mono flex items-center justify-between">
              <span>{isCitizenship ? t("groupForeigners", lang) : t("groupForeignBorn", lang)}</span>
              <span>{isCitizenship ? t("groupNationals", lang) : t("groupNativeBorn", lang)}</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
            {kpis.incomeKpi.notice ? (
              <span className="text-[10px] text-amber-400/90 flex items-center gap-1 truncate" title={kpis.incomeKpi.notice}>
                <Info className="w-3 h-3 shrink-0" />
                <span className="truncate">{kpis.incomeKpi.notice}</span>
              </span>
            ) : (
              <span>{lang === "en" ? "EU-SILC 18+ net eq." : "ECV 18+ neta eq."}</span>
            )}
            {kpis.incomeKpi.yoyDelta && (
              <span className="font-mono text-slate-300">{kpis.incomeKpi.yoyDelta}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default NationalityControlBar;
