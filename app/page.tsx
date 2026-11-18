"use client";

import { useEffect, useState } from "react";
import { ItemIndexItem, DatoItem, Category } from "@/types";
import { fetchMetadata, fetchItems, fetchItemDetail } from "@/lib/data-utils";
import DirectorySection from "./DirectorySection";
import SearchBar from "@/components/home/SearchBar";
import { Loader2, Database, BarChart3, ShieldCheck } from "lucide-react";

const CATEGORIES: Category[] = [
  "Pensiones y Demografía",
  "Economía y Empleo",
  "Vivienda",
  "Sanidad",
];

export default function HomePage() {
  const [items, setItems] = useState<ItemIndexItem[]>([]);
  const [detailsMap, setDetailsMap] = useState<Record<string, DatoItem>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const indexItems = await fetchItems();
        setItems(indexItems);

        // Fetch details for all items to power sparklines and precise metadata
        const details: Record<string, DatoItem> = {};
        await Promise.all(
          indexItems.map(async (i) => {
            const detail = await fetchItemDetail(i.id);
            if (detail) {
              details[i.id] = detail;
            }
          })
        );
        setDetailsMap(details);
      } catch (err) {
        console.error("Error cargando directorio:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredCategories = CATEGORIES.map((category) => {
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

  const scrollToSection = (cat: string) => {
    const el = document.getElementById(`section-${cat}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="max-w-[900px] w-full mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Top Editorial Header */}
      <header className="space-y-4 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-md">
            <BarChart3 className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Factor<span className="text-blue-400">.es</span>
          </h1>
        </div>
        <p className="text-sm text-slate-400 max-w-xl">
          Directorio unificado de indicadores oficiales de España. Cifras abreviadas, trazabilidad directa y cero ruido político.
        </p>
      </header>

      {/* Navigation Anchor Bar */}
      <nav className="sticky top-16 z-30 bg-[#070B14]/90 backdrop-blur-md py-3 border-b border-white/[0.06] overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 min-w-max">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => scrollToSection(cat)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.06] transition-colors"
            >
              {cat}
            </button>
          ))}
        </div>
      </nav>

      {/* Integrated Search Bar */}
      <section>
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      </section>

      {/* Main Unified Container */}
      <main className="space-y-8">
        {loading ? (
          <div className="bg-[#0B101D] rounded-2xl border border-slate-800 p-12 text-center space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">Cargando directorio unificado...</p>
          </div>
        ) : filteredCategories.length > 0 ? (
          <div className="space-y-8">
            {filteredCategories.map(({ category, items }) => (
              <DirectorySection
                key={category}
                category={category}
                items={items}
                detailsMap={detailsMap}
              />
            ))}
          </div>
        ) : (
          <div className="bg-[#0B101D] rounded-2xl border border-slate-800 p-12 text-center space-y-3">
            <Database className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-sm font-semibold text-white">
              No se encontraron indicadores que coincidan con &quot;{searchQuery}&quot;.
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors mt-2"
            >
              Limpiar búsqueda
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
