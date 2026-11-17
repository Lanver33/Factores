import Link from "next/link";
import { BarChart3 } from "lucide-react";

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
              Factor<span className="text-blue-600">.es</span>
            </h1>
          </div>
        </Link>
      </div>
    </header>
  );
}
