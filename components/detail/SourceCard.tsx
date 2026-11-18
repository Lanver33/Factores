import { ExternalLink, ShieldCheck, Calendar } from "lucide-react";

interface SourceCardProps {
  source?: {
    institution: string;
    url: string;
    lastUpdated?: string;
  };
  lastUpdated?: string;
}

export default function SourceCard({ source, lastUpdated }: SourceCardProps) {
  if (!source) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          Fuente Oficial de Datos y Trazabilidad
        </span>
        {(lastUpdated || source.lastUpdated) && (
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            Última actualización: {lastUpdated || source.lastUpdated}
          </span>
        )}
      </div>

      <div>
        <p className="text-sm font-semibold text-white">
          {source.institution}
        </p>
      </div>

      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-xs font-semibold text-blue-300 hover:text-white bg-blue-950 hover:bg-blue-900 px-4 py-2.5 rounded-xl transition-colors border border-blue-800/80 w-full justify-center sm:w-auto"
      >
        <span>Ver conjunto de datos original en el portal oficial</span>
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}
