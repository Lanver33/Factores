import Link from "next/link";
import { Info, BarChart3 } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link 
          href="/" 
          className="flex items-center gap-2 text-slate-900 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-base">
            <BarChart3 className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none text-slate-900 tracking-tight">
              Factores<span className="text-blue-600">.es</span>
            </h1>
            <p className="text-[11px] text-slate-500 leading-tight">
              Datos sin relato político
            </p>
          </div>
        </Link>

        <Link
          href="/metodologia"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-full transition-colors"
        >
          <Info className="w-3.5 h-3.5 text-slate-500" />
          <span>Metodología</span>
        </Link>
      </div>
    </header>
  );
}
