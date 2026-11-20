"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3 } from "lucide-react";
import type { Locale } from "@/lib/types";
import { routes } from "@/lib/i18n";

interface HeaderProps {
  locale: Locale;
}

export function Header({ locale }: HeaderProps) {
  const pathname = usePathname() || "/";

  const targetPathEs = routes.toggleLocale(pathname, "es");
  const targetPathEn = routes.toggleLocale(pathname, "en");

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link
          href={routes.home(locale)}
          className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-md">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg leading-none text-white tracking-tight">
              Factor<span className="text-blue-400">.es</span>
            </span>
          </div>
        </Link>

        {/* Language Switcher ES | EN */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs font-bold">
          <Link
            href={locale === "es" ? "#" : targetPathEs}
            aria-current={locale === "es" ? "page" : undefined}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              locale === "es"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            ES
          </Link>
          <Link
            href={locale === "en" ? "#" : targetPathEn}
            aria-current={locale === "en" ? "page" : undefined}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              locale === "en"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            EN
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Header;
