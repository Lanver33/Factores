"use client";

import React from "react";
import { Users, Briefcase, Award } from "lucide-react";
import type { NationalityAnnualRecord, PopulationDefinition, Lang } from "@/types";
import {
  getRecordForYear,
  buildRepresentationComparison,
  buildNaturalizationsSeries,
  formatHeadcount,
  formatExactNumber,
  formatPercent,
} from "./nationalitySelectors";
import {
  NATIONALS_COLOR,
  FOREIGNERS_COLOR,
  NATURALIZATIONS_COLOR,
  AGE_BAND_COLORS,
} from "./nationalityPalette";
import { t } from "@/lib/i18n";
import { ConceptHelpTrigger } from "@/components/detail/guide/ConceptHelpTrigger";

interface DemographicStructureViewProps {
  records: NationalityAnnualRecord[];
  selectedYear: string;
  onSelectYear: (year: string) => void;
  definition: PopulationDefinition;
  lang?: Lang;
}

export function DemographicStructureView({
  records,
  selectedYear,
  onSelectYear,
  definition,
  lang = "es",
}: DemographicStructureViewProps) {
  const currentRecord = getRecordForYear(records, selectedYear);
  const isCitizenship = definition === "citizenship";

  const slice = currentRecord?.definitions?.[definition];
  const demoNat = slice?.demographics?.nationals;
  const demoFor = slice?.demographics?.foreigners;

  const repRows = buildRepresentationComparison(currentRecord, definition);
  const naturalizationsData = buildNaturalizationsSeries(records);

  // Cumulative naturalizations up to selectedYear
  const currentNatPoint = naturalizationsData.find((p) => p.year === selectedYear);
  const latestCumNat = naturalizationsData[naturalizationsData.length - 1]?.cumulativeSinceStart ?? 0;

  const natGroupLabel = isCitizenship ? t("groupNationals", lang) : t("groupNativeBorn", lang);
  const forGroupLabel = isCitizenship ? t("groupForeigners", lang) : t("groupForeignBorn", lang);

  const natBands = demoNat?.ageBands;
  const forBands = demoFor?.ageBands;

  const maxNatYearVal = Math.max(
    ...naturalizationsData.map((d) => d.naturalizations ?? 0),
    1
  );

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-sky-400" />
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
            {t("demographicStructureTitle", lang)} · {t("yearLabel", lang)} {selectedYear}
          </h2>
        </div>
        <div className="text-xs text-slate-400 font-mono">
          {isCitizenship
            ? (lang === "en" ? "INE Continuous Population Statistics (Padrón / ECP)" : "INE Estadística Continua de Población / Padrón")
            : (lang === "en" ? "INE Population by Country of Birth" : "INE Población por País de Nacimiento")}
        </div>
      </div>

      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Left Column: Pirámide de edad (3 tramos) */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 sm:p-5 flex flex-col justify-between space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-tight">
                {t("agePyramidTitle", lang)}
              </span>
              <ConceptHelpTrigger code="AGE_STRUCTURE" lang={lang} />
              <ConceptHelpTrigger code="WORKING_AGE" lang={lang} />
            </div>
            {/* Age Band Mini Legend */}
            <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: AGE_BAND_COLORS.under15 }} />
                &lt;15
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: AGE_BAND_COLORS.workingAge15to64 }} />
                15–64
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: AGE_BAND_COLORS.senior65plus }} />
                65+
              </span>
            </div>
          </div>

          {/* Group 1: Nacionales */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: NATIONALS_COLOR }} />
                {natGroupLabel} ({formatHeadcount(demoNat?.population, lang)})
              </span>
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <span>{t("dependencyRatioLabel", lang)}:</span>
                <span className="font-mono font-bold text-slate-200">{demoNat?.oldAgeDependencyRatio ?? "—"}</span>
                <ConceptHelpTrigger code="DEPENDENCY_RATIO" lang={lang} />
              </div>
            </div>

            {/* Stacked bar */}
            {natBands ? (
              <div className="h-7 w-full bg-slate-900 rounded-lg overflow-hidden flex font-mono text-xs font-bold text-slate-950">
                <div
                  style={{ width: `${natBands.under15Pct}%`, backgroundColor: AGE_BAND_COLORS.under15 }}
                  className="h-full flex items-center justify-center transition-all duration-300"
                  title={`<15: ${natBands.under15Pct}% (${formatHeadcount(natBands.under15, lang)})`}
                >
                  {natBands.under15Pct > 8 && `${natBands.under15Pct}%`}
                </div>
                <div
                  style={{ width: `${natBands.workingAge15to64Pct}%`, backgroundColor: AGE_BAND_COLORS.workingAge15to64 }}
                  className="h-full flex items-center justify-center text-white transition-all duration-300"
                  title={`15–64: ${natBands.workingAge15to64Pct}% (${formatHeadcount(natBands.workingAge15to64, lang)})`}
                >
                  {natBands.workingAge15to64Pct > 12 && `${natBands.workingAge15to64Pct}%`}
                </div>
                <div
                  style={{ width: `${natBands.senior65plusPct}%`, backgroundColor: AGE_BAND_COLORS.senior65plus }}
                  className="h-full flex items-center justify-center text-slate-950 transition-all duration-300"
                  title={`65+: ${natBands.senior65plusPct}% (${formatHeadcount(natBands.senior65plus, lang)})`}
                >
                  {natBands.senior65plusPct > 8 && `${natBands.senior65plusPct}%`}
                </div>
              </div>
            ) : (
              <div className="h-7 bg-slate-900/50 rounded-lg animate-pulse" />
            )}
          </div>

          {/* Group 2: Extranjeros */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: FOREIGNERS_COLOR }} />
                {forGroupLabel} ({formatHeadcount(demoFor?.population, lang)})
              </span>
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <span>{t("dependencyRatioLabel", lang)}:</span>
                <span className="font-mono font-bold text-slate-200">{demoFor?.oldAgeDependencyRatio ?? "—"}</span>
                <ConceptHelpTrigger code="DEPENDENCY_RATIO" lang={lang} />
              </div>
            </div>

            {/* Stacked bar */}
            {forBands ? (
              <div className="h-7 w-full bg-slate-900 rounded-lg overflow-hidden flex font-mono text-xs font-bold text-slate-950">
                <div
                  style={{ width: `${forBands.under15Pct}%`, backgroundColor: AGE_BAND_COLORS.under15 }}
                  className="h-full flex items-center justify-center transition-all duration-300"
                  title={`<15: ${forBands.under15Pct}% (${formatHeadcount(forBands.under15, lang)})`}
                >
                  {forBands.under15Pct > 8 && `${forBands.under15Pct}%`}
                </div>
                <div
                  style={{ width: `${forBands.workingAge15to64Pct}%`, backgroundColor: AGE_BAND_COLORS.workingAge15to64 }}
                  className="h-full flex items-center justify-center text-white transition-all duration-300"
                  title={`15–64: ${forBands.workingAge15to64Pct}% (${formatHeadcount(forBands.workingAge15to64, lang)})`}
                >
                  {forBands.workingAge15to64Pct > 12 && `${forBands.workingAge15to64Pct}%`}
                </div>
                <div
                  style={{ width: `${forBands.senior65plusPct}%`, backgroundColor: AGE_BAND_COLORS.senior65plus }}
                  className="h-full flex items-center justify-center text-slate-950 transition-all duration-300"
                  title={`65+: ${forBands.senior65plusPct}% (${formatHeadcount(forBands.senior65plus, lang)})`}
                >
                  {forBands.senior65plusPct > 8 && `${forBands.senior65plusPct}%`}
                </div>
              </div>
            ) : (
              <div className="h-7 bg-slate-900/50 rounded-lg animate-pulse" />
            )}
          </div>

          <div className="text-[11px] text-slate-400/90 leading-relaxed pt-1">
            {lang === "en"
              ? "The high concentration of the foreign population in working ages (15–64) translates into a very low old-age dependency ratio, reducing the country's average demographic aging."
              : "La alta concentración de la población extranjera en tramos de edad laboral activa (15–64) se traduce en una reducida tasa de dependencia de mayores, compensando el envejecimiento demográfico medio del país."}
          </div>
        </div>

        {/* Right Column: Representation Comparison + Naturalizations */}
        <div className="space-y-4">
          {/* Representation Bars */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white tracking-tight">
                {t("representationTitle", lang)}
              </span>
              <span className="text-xs text-amber-400 font-semibold">
                {forGroupLabel}
              </span>
            </div>

            <div className="space-y-3 pt-1">
              {repRows.map((row) => (
                <div key={row.labelKey} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">{t(row.labelKey, lang)}</span>
                    <div className="flex items-center gap-2 font-mono">
                      {row.foreignCount !== undefined && (
                        <span className="text-slate-400 text-[11px]">
                          {formatHeadcount(row.foreignCount, lang)}
                        </span>
                      )}
                      <span className="font-bold text-amber-400 tabular-nums">
                        {formatPercent(row.foreignSharePct, 1, lang)}
                      </span>
                    </div>
                  </div>
                  <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, row.foreignSharePct))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Naturalizations Strip */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-bold text-white tracking-tight">
                  {t("naturalizationsTitle", lang)}
                </span>
                <ConceptHelpTrigger code="NATURALIZATION" lang={lang} />
              </div>
              <span className="text-xs text-purple-400 font-mono font-bold">
                2008–{naturalizationsData[naturalizationsData.length - 1]?.year}: {formatHeadcount(latestCumNat, lang)}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>
                {selectedYear}:{" "}
                <strong className="text-white font-mono">
                  {currentNatPoint?.naturalizations !== null && currentNatPoint?.naturalizations !== undefined
                    ? formatExactNumber(currentNatPoint.naturalizations, lang)
                    : (lang === "en" ? "Pending publication" : "Pendiente de publicación")}
                </strong>
              </span>
              <span className="text-[11px] text-slate-400">
                {lang === "en" ? "Click year to inspect" : "Haz clic para cambiar año"}
              </span>
            </div>

            {/* Interactive mini bar chart */}
            <div className="h-10 flex items-end gap-1 pt-1">
              {naturalizationsData.map((d) => {
                const isActive = d.year === selectedYear;
                const hPct = d.naturalizations ? Math.max(12, Math.round((d.naturalizations / maxNatYearVal) * 100)) : 6;
                return (
                  <button
                    key={d.year}
                    type="button"
                    onClick={() => onSelectYear(d.year)}
                    title={`${d.year}: ${d.naturalizations ? formatExactNumber(d.naturalizations, lang) : "—"}`}
                    className={`flex-1 rounded-xs transition-all relative group ${
                      isActive
                        ? "bg-purple-400 ring-2 ring-purple-300 ring-offset-1 ring-offset-slate-950"
                        : "bg-purple-900/60 hover:bg-purple-500/80"
                    }`}
                    style={{ height: `${hPct}%` }}
                  >
                    <span className="sr-only">{d.year}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default DemographicStructureView;
