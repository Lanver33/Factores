import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-4 px-4">
      <div className="w-12 h-12 rounded-2xl bg-slate-900 text-slate-300 border border-slate-800 flex items-center justify-center">
        <AlertCircle className="w-6 h-6 text-blue-400" />
      </div>
      <h1 className="text-xl font-bold text-slate-100">Página no encontrada</h1>
      <p className="text-xs text-slate-400 max-w-sm">
        El dato o página que buscas no existe o ha sido movido.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2.5 rounded-xl transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver al explorador</span>
      </Link>
    </div>
  );
}
