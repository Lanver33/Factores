import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 py-8 px-4 mt-16 text-slate-600 text-xs">
      <div className="max-w-3xl mx-auto flex flex-col gap-4 text-center sm:text-left sm:flex-row sm:justify-between sm:items-center">
        <div className="space-y-1">
          <p className="font-semibold text-slate-800 flex items-center justify-center sm:justify-start gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-600 inline" />
            Transparencia y Neutralidad Radical
          </p>
          <p className="text-slate-500">
            Proyecto independiente y sin ánimo de lucro. Fuentes oficiales: INE, CIS, Banco de España y Ministerios.
          </p>
        </div>
        <div className="flex justify-center gap-4 text-slate-500">
          <Link href="/metodologia" className="hover:text-slate-900 underline">
            Metodología
          </Link>
          <Link href="/" className="hover:text-slate-900 underline">
            Inicio
          </Link>
        </div>
      </div>
    </footer>
  );
}
