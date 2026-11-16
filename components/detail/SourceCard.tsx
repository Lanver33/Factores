import { SourceInfo } from "@/types";
import { ExternalLink, ShieldAlert, Calendar } from "lucide-react";

interface SourceCardProps {
  source: SourceInfo;
}

export default function SourceCard({ source }: SourceCardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
          Trazabilidad y Fuente Oficial
        </span>
        <span className="text-xs text-slate-500 flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          Actualizado: {source.lastUpdated}
        </span>
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-900">
          {source.institution}
        </p>
      </div>

      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100/80 px-4 py-2.5 rounded-xl transition-colors border border-blue-100 w-full justify-center sm:w-auto"
      >
        <span>Ver tabla/fuente original en la web oficial</span>
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}
