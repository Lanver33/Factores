import { ExternalLink, ShieldCheck, Calendar, AlertCircle } from "lucide-react";
import { SourceInfo, TraceableSource } from "@/types";

interface SourceCardProps extends TraceableSource {
  lastUpdated?: string;
  defaultInstitution?: string;
  description?: string;
}

const DEFAULT_INSTITUTION = "Instituto Nacional de Estadística (INE)";

function normalizeSources(source?: SourceInfo, sources?: SourceInfo[]): SourceInfo[] {
  if (sources && sources.length > 0) return sources;
  if (source) return [source];
  return [];
}

function resolveShortName(source: SourceInfo): string {
  return source.shortName || source.title || source.institution || "Ver fuente oficial";
}

function buildSourceKey(source: SourceInfo, fallbackIdx: number): string {
  return `${source.tableId ?? "src"}-${source.period ?? fallbackIdx}-${source.url}`;
}

export default function SourceCard({
  source,
  sources,
  lastUpdated,
  defaultInstitution = DEFAULT_INSTITUTION,
  description,
}: SourceCardProps) {
  const sourceList = normalizeSources(source, sources);

  if (sourceList.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            Fuente Oficial de Datos y Trazabilidad
          </span>
        </div>
        <div className="p-5 rounded-xl border border-dashed border-slate-800 bg-slate-950/50 text-center space-y-2">
          <AlertCircle className="w-5 h-5 text-amber-400 mx-auto" />
          <p className="text-xs font-semibold text-white">
            Pendiente de vinculación con tabla oficial
          </p>
          <p className="text-[11px] text-slate-400">
            No hay fuentes oficiales vinculadas a este registro actualmente.
          </p>
        </div>
      </div>
    );
  }

  const uniqueInstitutions = Array.from(
    new Set(sourceList.map((s) => s.institution).filter(Boolean))
  );
  const headerInstitution =
    uniqueInstitutions.length > 1
      ? uniqueInstitutions.join(" / ")
      : sourceList[0]?.institution || defaultInstitution;

  const defaultSubtitle =
    sourceList.length === 1
      ? "Enlace directo a la publicación original para auditar y contrastar la serie histórica oficial:"
      : "Series enlazadas para auditar y contrastar directamente los tramos o registros oficiales que componen este indicador:";
  const subtitleText = description || defaultSubtitle;

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
          {headerInstitution}
        </p>
        <p className="text-xs text-slate-400">
          {subtitleText}
        </p>
      </div>

      {/* Lista unificada de fuentes que componen la serie */}
      <div className="space-y-3">
        {sourceList.map((s, idx) => {
          const shortName = resolveShortName(s);
          const effectiveLastUpdated = s.lastUpdated ?? lastUpdated;

          return (
            <div
              key={buildSourceKey(s, idx)}
              className="p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-950/50 border-slate-800 hover:border-slate-700"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  {uniqueInstitutions.length > 1 && s.institution && (
                    <span className="text-[11px] font-semibold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/80">
                      {s.institution}
                    </span>
                  )}
                  <span className="text-xs font-bold text-white">
                    {s.title}
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
