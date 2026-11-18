"use client";

import { Category } from "@/types";
import { Building2, TrendingUp, HeartPulse, Users, LayoutGrid } from "lucide-react";

interface TopicFilterProps {
  categories: Category[];
  selectedCategory: Category;
  onSelectCategory: (category: Category) => void;
}

const categoryIcons: Record<Category, React.ReactNode> = {
  Todas: <LayoutGrid className="w-4 h-4 shrink-0" />,
  Vivienda: <Building2 className="w-4 h-4 shrink-0" />,
  "Economía y Empleo": <TrendingUp className="w-4 h-4 shrink-0" />,
  Sanidad: <HeartPulse className="w-4 h-4 shrink-0" />,
  "Pensiones y Demografía": <Users className="w-4 h-4 shrink-0" />,
};

export default function TopicFilter({
  categories,
  selectedCategory,
  onSelectCategory,
}: TopicFilterProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full">
      {categories.map((category) => {
        const isSelected = selectedCategory === category;
        const isTodas = category === "Todas";
        return (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 active:scale-95 touch-manipulation text-center ${
              isTodas ? "col-span-2 sm:col-span-1" : "col-span-1"
            } ${
              isSelected
                ? "bg-blue-600 text-white shadow-md ring-1 ring-blue-500"
                : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
            }`}
          >
            <span className={isSelected ? "text-white" : "text-slate-400"}>
              {categoryIcons[category]}
            </span>
            <span className="truncate">{category}</span>
          </button>
        );
      })}
    </div>
  );
}
