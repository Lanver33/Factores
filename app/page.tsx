"use client";

import { useState } from "react";
import { Category, DatoItem } from "@/types";
import { getAllCategories, searchDatos } from "@/lib/data-utils";
import TopicFilter from "@/components/home/TopicFilter";
import SearchBar from "@/components/home/SearchBar";
import QuestionCard from "@/components/home/QuestionCard";
import { HelpCircle, Filter } from "lucide-react";

export default function HomePage() {
  const categories = getAllCategories();
  const [selectedCategory, setSelectedCategory] = useState<Category>("Todas");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDatos: DatoItem[] = searchDatos(searchQuery, selectedCategory);

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
              {selectedCategory === "Todas" ? "Preguntas Frecuentes" : selectedCategory}
            </span>
          </h3>
          <span className="text-xs font-medium text-slate-500 bg-slate-200/60 px-2.5 py-0.5 rounded-full">
            {filteredDatos.length} {filteredDatos.length === 1 ? "dato" : "datos"}
          </span>
        </div>

        {filteredDatos.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            {filteredDatos.map((dato) => (
              <QuestionCard key={dato.id} dato={dato} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-800">
              No se encontraron datos que coincidan con tu búsqueda.
            </p>
            <p className="text-xs text-slate-500">
              Prueba a cambiar las palabras clave o seleccionar otra categoría.
            </p>
            <button
              onClick={() => {
                setSelectedCategory("Todas");
                setSearchQuery("");
              }}
              className="mt-2 text-xs font-semibold text-blue-600 hover:underline"
            >
              Restablecer filtros
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
