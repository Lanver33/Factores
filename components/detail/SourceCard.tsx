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
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          Official Data Source & Traceability
        </span>
        {(lastUpdated || source.lastUpdated) && (
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Last Updated: {lastUpdated || source.lastUpdated}
          </span>
        )}
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
        <span>View original dataset on official website</span>
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}
