import { ShieldCheck, Calendar, ExternalLink, AlertCircle } from "lucide-react";
import type { Indicator, Locale } from "@/domain/indicator.schema";
import type { Lang } from "@/types";
import { sanitizeHttpUrl } from "@/lib/url";
import { t } from "@/lib/i18n";

interface SourceCardProps {
  sources?: Indicator["sources"] | any[];
  lastUpdated?: string;
  locale?: Locale;
  lang?: Lang;
}

export function SourceCard({ sources, lastUpdated, locale, lang }: SourceCardProps) {
  const activeLocale: Locale = (lang || locale || "es") as Locale;

  if (!sources || sources.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            {t("sourceTitle", activeLocale)}
          </span>
        </div>
        <div className="p-5 rounded-xl border border-dashed border-slate-800 bg-slate-950/50 text-center space-y-2">
          <AlertCircle className="w-5 h-5 text-amber-400 mx-auto" />
          <p className="text-xs font-semibold text-white">
            {t("noDataYet", activeLocale)}
          </p>
        </div>
      </div>
    );
  }

  const uniqueInstitutions = Array.from(
    new Set(
      sources.map((s: any) =>
        typeof s.institution === "object"
          ? s.institution[activeLocale] || s.institution.es
          : s.institution
      ).filter(Boolean)
    )
  );
  const headerInstitution =
    uniqueInstitutions.length > 1
      ? uniqueInstitutions.join(" / ")
      : typeof sources[0]?.institution === "object"
      ? sources[0]?.institution[activeLocale] || sources[0]?.institution.es
      : sources[0]?.institution ?? "";

  const subtitleText =
    sources.length === 1
      ? t("sourcesSubtitleSingle", activeLocale)
      : t("sourcesSubtitleMultiple", activeLocale);

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          {sources.length > 1 ? t("sourcesTitle", activeLocale) : t("sourceTitle", activeLocale)}
        </span>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-semibold text-white">{headerInstitution}</p>
        <p className="text-xs text-slate-400">{subtitleText}</p>
      </div>

      <div className="space-y-3">
        {sources.map((s: any, idx: number) => {
          const safeUrl = sanitizeHttpUrl(s.url);
          const instText =
            typeof s.institution === "object"
              ? s.institution[activeLocale] || s.institution.es
              : s.institution;
          const titleText =
            typeof s.title === "object"
              ? s.title[activeLocale] || s.title.es
              : s.title;
          const shortName =
            typeof s.shortName === "object"
              ? s.shortName?.[activeLocale] || s.shortName?.es || titleText
              : s.shortName || titleText;

          const effectiveDate = s.lastUpdated ?? lastUpdated;

          return (
            <div
              key={`${s.tableId ?? "src"}-${idx}`}
              className="p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-950/50 border-slate-800 hover:border-slate-700"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  {uniqueInstitutions.length > 1 && (
                    <span className="text-[11px] font-semibold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/80">
                      {instText}
                    </span>
                  )}
                  <span className="text-xs font-bold text-white">{titleText}</span>
                  {s.period && (
                    <span className="text-[11px] font-semibold text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-800/80 font-mono">
                      {s.period}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                  {s.tableId && (
                    <span className="font-mono text-slate-300 font-semibold">
                      {t("officialTable", activeLocale)} {s.tableId}
                    </span>
                  )}
                  {effectiveDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {t("lastUpdated", activeLocale)}: {effectiveDate}
                    </span>
                  )}
                </div>
              </div>

              {safeUrl ? (
                <a
                  href={safeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-blue-300 hover:text-white bg-blue-950 hover:bg-blue-900 px-4 py-2.5 rounded-xl transition-colors border border-blue-800/80 shrink-0 w-full sm:w-auto justify-center"
                >
                  <span>{shortName}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <span className="text-xs text-slate-500 italic">URL no disponible</span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default SourceCard;
