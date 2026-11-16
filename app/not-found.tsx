import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-4 px-4">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center">
        <AlertCircle className="w-6 h-6 text-blue-600" />
      </div>
      <h1 className="text-xl font-bold text-slate-900">Página no encontrada</h1>
      <p className="text-xs text-slate-500 max-w-sm">
        El dato o página que buscas no existe o ha sido movido.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 px-4 py-2.5 rounded-xl transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver al explorador</span>
      </Link>
    </div>
  );
}
