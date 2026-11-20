"use client";

import { useState, useMemo } from "react";
import { Search, X, AlertCircle } from "lucide-react";
import type { DirectoryIndexItem, Category, Locale } from "@/lib/types";
import { CATEGORY_LABELS, t } from "@/lib/i18n";
import DirectorySection from "./DirectorySection";

const CATEGORIES: Category[] = [
  "pensions-demography",
  "economy-employment",
  "housing",
  "healthcare",
];

interface DirectoryExplorerProps {
  initialItems: DirectoryIndexItem[];
  locale: Locale;
}

export function DirectoryExplorer({ initialItems, locale }: DirectoryExplorerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">("all");

  const getCategoryCount = (cat: Category | "all") => {
    if (cat === "all") return initialItems.length;
    return initialItems.filter((i) => i.category === cat).length;
  };

  const sections = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return CATEGORIES.map((cat) => {
      if (selectedCategory !== "all" && selectedCategory !== cat) {
        return { category: cat, items: [] };
      }

      const matching = initialItems.filter((item) => {
        if (item.category !== cat) return false;
        if (!q) return true;

        const question = item.question[locale].toLowerCase();
        const summary = item.searchSummary[locale].toLowerCase();
        const source = item.primarySource[locale].toLowerCase();
        const id = item.id.toLowerCase();

        return (
          question.includes(q) ||
          summary.includes(q) ||
          source.includes(q) ||
          id.includes(q)
        );
      });

      return { category: cat, items: matching };
    }).filter((sec) => sec.items.length > 0);
  }, [initialItems, selectedCategory, searchQuery, locale]);

  const totalFilteredCount = sections.reduce((sum, sec) => sum + sec.items.length, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Editorial Tagline */}
      <header className="pt-2 pb-1 text-center sm:text-left">
        <p className="text-sm text-slate-400 max-w-xl">{t("tagline", locale)}</p>
      </header>

      {/* Integrated Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("searchPlaceholder", locale)}
          className="w-full pl-10 pr-10 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-md"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition-colors"
            title={t("clearSearch", locale)}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Interactive Category Filter Bar */}
      <nav className="overflow-x-auto no-scrollbar py-1" aria-label="Category filters">
        <div className="flex items-center gap-2 min-w-max">
          {(["all", ...CATEGORIES] as const).map((cat) => {
            const count = getCategoryCount(cat);
            const isActive = selectedCategory === cat;
            const label = CATEGORY_LABELS[cat]?.[locale] ?? cat;

            return (
              <button
                type="button"
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-2 border ${
                  isActive
                    ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-900/30"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                }`}
              >
                <span>{label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? "bg-blue-700 text-white" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Directory Sections or Empty State */}
      {totalFilteredCount === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
          <AlertCircle className="w-6 h-6 text-amber-400 mx-auto" />
          <p className="text-sm font-semibold text-white">
            {t("noResults", locale)} &ldquo;{searchQuery}&rdquo;
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
            }}
            className="text-xs text-blue-400 hover:underline font-semibold"
          >
            {t("clearSearch", locale)}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {sections.map((sec) => (
            <DirectorySection
              key={sec.category}
              category={sec.category}
              items={sec.items}
              locale={locale}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default DirectoryExplorer;
