"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3 } from "lucide-react";

interface HeaderProps {
  lang?: "es" | "en";
}

export default function Header({ lang = "es" }: HeaderProps) {
  const pathname = usePathname() || (lang === "en" ? "/en" : "/");

  const getTogglePath = () => {
    if (lang === "es") {
      if (pathname === "/" || pathname === "") return "/en";
      if (pathname.startsWith("/dato/")) return `/en${pathname}`;
      return "/en";
    } else {
      if (pathname === "/en" || pathname === "/en/") return "/";
      if (pathname.startsWith("/en/dato/")) return pathname.replace(/^\/en/, "");
      return "/";
    }
  };

  const togglePath = getTogglePath();

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-sm">
      <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link 
          href={lang === "en" ? "/en" : "/"} 
          className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-md">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none text-white tracking-tight">
              Factor<span className="text-blue-400">.es</span>
            </h1>
          </div>
        </Link>

        {/* Language Switcher ES | EN */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs font-bold">
          <Link
            href={lang === "es" ? "#" : togglePath}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              lang === "es"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            ES
          </Link>
          <Link
            href={lang === "en" ? "#" : togglePath}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              lang === "en"
                ? "bg-blue-600 text-white shadow-sm"
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
