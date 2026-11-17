"use client";

import { useEffect, useState } from "react";
import { Category, ItemIndexItem, GlobalMetadata } from "@/types";
import { fetchMetadata, fetchItems, getAllCategories, DATA_BASE_URL } from "@/lib/data-utils";
import TopicFilter from "@/components/home/TopicFilter";
import SearchBar from "@/components/home/SearchBar";
import QuestionCard from "@/components/home/QuestionCard";
import { HelpCircle, Filter, Loader2, Database } from "lucide-react";

export default function HomePage() {
  const categories = getAllCategories();
  const [items, setItems] = useState<ItemIndexItem[]>([]);
  const [metadata, setMetadata] = useState<GlobalMetadata | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category>("Todas");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [metaData, indexItems] = await Promise.all([
          fetchMetadata(),
          fetchItems(),
        ]);
        setMetadata(metaData);
        setItems(indexItems);
      } catch (err) {
        console.error("Failed to load items index:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredItems = items.filter((item) => {
    if (selectedCategory !== "Todas" && item.category !== selectedCategory) {
      return false;
    }
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      item.question.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Buscador & Filtros */}
      <section className="space-y-4">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />

        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtrar por Tema</span>
          </div>
          <TopicFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </div>
      </section>

      {/* Lista de Preguntas / Datos */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <span>
              {selectedCategory === "Todas" ? "Datos Oficiales de España" : selectedCategory}
            </span>
          </h3>
          <span className="text-xs font-medium text-slate-500 bg-slate-200/60 px-2.5 py-0.5 rounded-full">
            {filteredItems.length} {filteredItems.length === 1 ? "dato" : "datos"}
          </span>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">Cargando datos vía HTTP ({DATA_BASE_URL})...</p>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            {filteredItems.map((item) => (
              <QuestionCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
            <Database className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-800">
              {searchQuery || selectedCategory !== "Todas"
                ? "No se encontraron datos que coincidan con tu búsqueda."
                : "Base de datos vacía."}
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              {searchQuery || selectedCategory !== "Todas"
                ? "Prueba a cambiar las palabras clave o seleccionar otra categoría."
                : "Puedes añadir nuevos datos usando la skill de la plataforma para Gemini e guardarlos en data/items/<id>.json."}
            </p>
            {(searchQuery || selectedCategory !== "Todas") && (
              <button
                onClick={() => {
                  setSelectedCategory("Todas");
                  setSearchQuery("");
                }}
                className="mt-2 text-xs font-semibold text-blue-600 hover:underline"
              >
                Restablecer filtros
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
