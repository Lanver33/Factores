import { ExternalLink, ShieldCheck, Calendar } from "lucide-react";
import { SourceInfo, TraceableSource } from "@/types";

interface SourceCardProps extends TraceableSource {
  lastUpdated?: string;
  selectedYear?: string | number;
  defaultInstitution?: string;
}

const DEFAULT_INSTITUTION = "Instituto Nacional de Estadística (INE)";

function normalizeSources(source?: SourceInfo, sources?: SourceInfo[]): SourceInfo[] {
  if (sources && sources.length > 0) return sources;
  if (source) return [source];
  return [];
}

function isYearInPeriod(year?: string | number, period?: string): boolean {
  if (year === undefined || !period) return false;

  const [startStr, endStr] = period.split("-");
  if (!startStr || !endStr) return false;

  const startYear = Number.parseInt(startStr.trim(), 10);
  const endYear = Number.parseInt(endStr.trim(), 10);
  const targetYear = typeof year === "string" ? Number.parseInt(year, 10) : year;

  if (Number.isNaN(startYear) || Number.isNaN(endYear) || Number.isNaN(targetYear)) {
    return false;
  }

  return targetYear >= startYear && targetYear <= endYear;
}

function resolveShortName(source: SourceInfo): string {
  if (source.shortName) return source.shortName;
  const isEmcr = source.title?.includes("EMCR") || source.tableId === "69690";
  return isEmcr ? "EMCR" : "Estadística de Migraciones";
}

function buildSourceKey(source: SourceInfo, fallbackIdx: number): string {
  return `${source.tableId ?? "src"}-${source.period ?? fallbackIdx}-${source.url}`;
}

export default function SourceCard({
  source,
  sources,
  lastUpdated,
  selectedYear,
  defaultInstitution = DEFAULT_INSTITUTION,
}: SourceCardProps) {
  const sourceList = normalizeSources(source, sources);
  if (sourceList.length === 0) return null;

  const institutionName = sourceList[0]?.institution || defaultInstitution;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Título único de la sección */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          Fuente Oficial de Datos y Trazabilidad
        </span>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-semibold text-white">
          {institutionName}
        </p>
        <p className="text-xs text-slate-400">
          Serie enlazada para auditar y contrastar directamente los dos tramos oficiales de la serie histórica:
        </p>
      </div>

      {/* Lista unificada de fuentes que componen la serie */}
      <div className="space-y-3">
        {sourceList.map((s, idx) => {
          const isActive = isYearInPeriod(selectedYear, s.period);
          const shortName = resolveShortName(s);
          const effectiveLastUpdated = s.lastUpdated ?? lastUpdated;
          const cardStateClasses = isActive
            ? "bg-blue-950/60 border-blue-500 ring-2 ring-blue-400 shadow-md"
            : "bg-slate-950/50 border-slate-800 hover:border-slate-700";

          return (
            <div
              key={buildSourceKey(s, idx)}
              className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${cardStateClasses}`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-white">
                    {s.title || s.institution}
                  </span>
                  {s.period && (
                    <span className="text-[11px] font-semibold text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-800/80">
                      {s.period}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                  {s.tableId && (
                    <span className="font-mono text-slate-300 font-semibold">
                      Tabla {s.tableId}
                    </span>
                  )}
                  {effectiveLastUpdated && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      Última actualización: {effectiveLastUpdated}
                    </span>
                  )}
                </div>
              </div>

              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-semibold text-blue-300 hover:text-white bg-blue-950 hover:bg-blue-900 px-4 py-2.5 rounded-xl transition-colors border border-blue-800/80 shrink-0 w-full sm:w-auto justify-center"
              >
                <span>
                  {shortName}
                  {s.period ? ` (${s.period})` : ""}
                  {s.tableId ? ` · Tabla ${s.tableId}` : ""} ↗
                </span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
