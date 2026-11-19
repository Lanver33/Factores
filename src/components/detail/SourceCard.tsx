import { ShieldCheck, Calendar, ExternalLink, AlertCircle } from "lucide-react";
import type { Indicator, Locale } from "@/domain/indicator.schema";
import { sanitizeHttpUrl } from "@/lib/url";
import { t } from "@/lib/i18n";

interface SourceCardProps {
  sources: Indicator["sources"];
  lastUpdated?: string;
  locale: Locale;
}

export function SourceCard({ sources, lastUpdated, locale }: SourceCardProps) {
  if (!sources || sources.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            {t("sourceTitle", locale)}
          </span>
        </div>
        <div className="p-5 rounded-xl border border-dashed border-slate-800 bg-slate-950/50 text-center space-y-2">
          <AlertCircle className="w-5 h-5 text-amber-400 mx-auto" />
          <p className="text-xs font-semibold text-white">
            {t("noDataYet", locale)}
          </p>
        </div>
      </div>
    );
  }

  const uniqueInstitutions = Array.from(
    new Set(sources.map((s) => s.institution[locale]).filter(Boolean))
  );
  const headerInstitution =
    uniqueInstitutions.length > 1
      ? uniqueInstitutions.join(" / ")
      : sources[0]?.institution[locale] ?? "";

  const subtitleText =
    sources.length === 1
      ? t("sourcesSubtitleSingle", locale)
      : t("sourcesSubtitleMultiple", locale);

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          {sources.length > 1 ? t("sourcesTitle", locale) : t("sourceTitle", locale)}
        </span>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-semibold text-white">{headerInstitution}</p>
        <p className="text-xs text-slate-400">{subtitleText}</p>
      </div>

      <div className="space-y-3">
        {sources.map((s, idx) => {
          const safeUrl = sanitizeHttpUrl(s.url);
          const shortName = s.shortName?.[locale] ?? s.title[locale];
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
                      {s.institution[locale]}
                    </span>
                  )}
                  <span className="text-xs font-bold text-white">{s.title[locale]}</span>
                  {s.period && (
                    <span className="text-[11px] font-semibold text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-800/80 font-mono">
                      {s.period}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                  {s.tableId && (
                    <span className="font-mono text-slate-300 font-semibold">
                      {t("officialTable", locale)} {s.tableId}
                    </span>
                  )}
                  {effectiveDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {t("lastUpdated", locale)}: {effectiveDate}
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
