"use client";

import { useState } from "react";
import { ItemIndexItem, DatoItem, Category } from "@/types";
import DirectoryRow from "./DirectoryRow";
import { ChevronDown, ChevronUp, Layers } from "lucide-react";

interface DirectorySectionProps {
  category: Category;
  items: ItemIndexItem[];
  detailsMap: Record<string, DatoItem>;
}

const CATEGORY_ICONS: Record<Category, string> = {
  Todas: "📊",
  Vivienda: "🏠",
  "Economía y Empleo": "📈",
  Sanidad: "🏥",
  "Pensiones y Demografía": "👥",
};

export default function DirectorySection({
  category,
  items,
  detailsMap,
}: DirectorySectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (items.length === 0) return null;

  return (
    <section id={`section-${category}`} className="scroll-mt-24 space-y-3">
      {/* Section Header */}
      <div
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between py-3 px-3 rounded-xl bg-white/[0.03] border border-white/[0.06] cursor-pointer hover:bg-white/[0.05] transition-all"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-base">{CATEGORY_ICONS[category] || "📁"}</span>
          <h3 className="text-xs font-black uppercase tracking-wider text-[#F1F5F9]">
            {category}
          </h3>
          <span className="text-[10px] font-bold text-[#64748B] bg-white/[0.06] px-2 py-0.5 rounded-full">
            {items.length} {items.length === 1 ? "indicador" : "indicadores"}
          </span>
        </div>

        <button className="text-[#94A3B8] hover:text-white transition-colors">
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {/* Rows Container */}
      {!isCollapsed && (
        <div className="space-y-1 pl-1">
          {items.map((item) => (
            <DirectoryRow
              key={item.id}
              item={item}
              detail={detailsMap[item.id]}
            />
          ))}
        </div>
      )}
    </section>
  );
}
