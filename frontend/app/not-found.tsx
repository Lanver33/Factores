import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import "@/app/globals.css";

export default function NotFound() {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen flex flex-col bg-slate-950 text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-16 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-slate-300 border border-slate-800 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-blue-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-100">
            Página no encontrada · Page Not Found
          </h1>
          <p className="text-xs text-slate-400 max-w-sm">
            El indicador o recurso que buscas no existe o ha sido trasladado.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/es"
              className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2.5 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Inicio (ES)</span>
            </Link>
            <Link
              href="/en"
              className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2.5 rounded-xl transition-colors"
            >
              <span>Home (EN)</span>
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
