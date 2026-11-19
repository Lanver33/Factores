import { Loader2 } from "lucide-react";

export function ChartSkeleton() {
  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-12 text-center flex flex-col items-center justify-center min-h-[380px] space-y-3">
      <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
      <span className="text-xs text-slate-400 font-medium">Cargando visualización...</span>
    </div>
  );
}
