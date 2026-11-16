"use client";

import { Category } from "@/types";
import { Building2, TrendingUp, HeartPulse, Users, LayoutGrid } from "lucide-react";

interface TopicFilterProps {
  categories: Category[];
  selectedCategory: Category;
  onSelectCategory: (category: Category) => void;
}

const categoryIcons: Record<Category, React.ReactNode> = {
  Todas: <LayoutGrid className="w-4 h-4" />,
  Vivienda: <Building2 className="w-4 h-4" />,
  "Economía y Empleo": <TrendingUp className="w-4 h-4" />,
  Sanidad: <HeartPulse className="w-4 h-4" />,
  "Pensiones y Demografía": <Users className="w-4 h-4" />,
};

export default function TopicFilter({
  categories,
  selectedCategory,
  onSelectCategory,
}: TopicFilterProps) {
  return (
    <div className="w-full overflow-x-auto no-scrollbar py-2 -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex items-center gap-2 min-w-max">
        {categories.map((category) => {
          const isSelected = selectedCategory === category;
          return (
            <button
              key={category}
              onClick={() => onSelectCategory(category)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 active:scale-95 touch-manipulation ${
                isSelected
                  ? "bg-slate-900 text-white shadow-sm ring-1 ring-slate-900"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span className={isSelected ? "text-blue-400" : "text-slate-400"}>
                {categoryIcons[category]}
              </span>
              <span>{category}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
