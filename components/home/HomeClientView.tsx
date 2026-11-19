"use client";

import { useEffect, useState } from "react";
import { ItemIndexItem, DatoItem, Category } from "@/types";
import { fetchItems, fetchItemDetail } from "@/lib/data-utils";
import DirectorySection from "@/components/directory/DirectorySection";
import SearchBar from "@/components/home/SearchBar";
import { Loader2, Database } from "lucide-react";
import { t, translateCategory } from "@/lib/i18n";

const CATEGORIES: Category[] = [
  "Todas",
  "Pensiones y Demografía",
  "Economía y Empleo",
  "Vivienda",
  "Sanidad",
];

interface HomeClientViewProps {
  lang?: "es" | "en";
}

export default function HomeClientView({ lang = "es" }: HomeClientViewProps) {
  const [items, setItems] = useState<ItemIndexItem[]>([]);
  const [detailsMap, setDetailsMap] = useState<Record<string, DatoItem>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("Todas");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Update document html lang attribute dynamically
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const indexItems = await fetchItems(lang);
        setItems(indexItems);

        const details: Record<string, DatoItem> = {};
        await Promise.all(
          indexItems.map(async (i) => {
            const detail = await fetchItemDetail(i.id, lang);
            if (detail) {
              details[i.id] = detail;
            }
          })
        );
        setDetailsMap(details);
      } catch (err) {
        console.error("Error loading directory:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [lang]);

  const getTotalCategoryCount = (cat: Category) => {
    if (cat === "Todas") return items.length;
    return items.filter((item) => item.category === cat).length;
  };

  const filteredCategories = CATEGORIES.filter((cat) => cat !== "Todas").map((category) => {
    if (selectedCategory !== "Todas" && selectedCategory !== category) {
      return { category, items: [] };
    }
    const categoryItems = items.filter((item) => {
      if (item.category !== category) return false;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      const detail = detailsMap[item.id];
      const desc = detail?.contextNotes?.[0] || "";
      return (
        item.question.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        desc.toLowerCase().includes(q)
      );
    });
    return { category, items: categoryItems };
  }).filter((sec) => sec.items.length > 0);

  const handleCategoryClick = (cat: Category) => {
    if (cat === "Todas" || selectedCategory === cat) {
      setSelectedCategory("Todas");
    } else {
      setSelectedCategory(cat);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Editorial Header */}
      <header className="pt-2 pb-2 text-center sm:text-left">
        <p className="text-sm text-slate-400 max-w-xl">
          {t("tagline", lang)}
        </p>
      </header>

      {/* Integrated Search Bar */}
      <section>
        <SearchBar value={searchQuery} onChange={setSearchQuery} lang={lang} />
      </section>

      {/* Interactive Category Filter Bar */}
      <nav className="overflow-x-auto no-scrollbar py-1">
        <div className="flex items-center gap-2 min-w-max">
          {CATEGORIES.map((cat) => {
            const count = getTotalCategoryCount(cat);
            const isDisabled = count === 0 && cat !== "Todas";
            const isActive = selectedCategory === cat;

            return (
              <button
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                disabled={isDisabled}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors border flex items-center gap-1.5 ${
                  isActive
                    ? "bg-blue-600 text-white border-blue-500 font-bold shadow-sm"
                    : isDisabled
                    ? "opacity-40 cursor-not-allowed pointer-events-none bg-slate-900 text-slate-500 border-slate-800"
                    : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span>{translateCategory(cat, lang)}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? "bg-blue-700 text-white" : "bg-slate-800 text-slate-400"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Unified Container */}
      <div className="space-y-8">
        {loading ? (
          <div className="bg-[#0B101D] rounded-2xl border border-slate-800 p-12 text-center space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">{t("loadingDirectory", lang)}</p>
          </div>
        ) : filteredCategories.length > 0 ? (
          <div className="space-y-8">
            {filteredCategories.map(({ category, items }) => (
              <DirectorySection
                key={category}
                category={category}
                items={items}
                detailsMap={detailsMap}
                lang={lang}
              />
            ))}
          </div>
        ) : (
          <div className="bg-[#0B101D] rounded-2xl border border-slate-800 p-12 text-center space-y-3">
            <Database className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-sm font-semibold text-white">
              {t("noResults", lang)} &quot;{searchQuery}&quot;.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("Todas");
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors mt-2"
            >
              {t("clearSearch", lang)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
