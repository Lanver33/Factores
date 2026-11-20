"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { DirectoryIndexItem, Category, Locale } from "@/lib/types";
import { CATEGORY_LABELS, CATEGORY_ICONS, t } from "@/lib/i18n";
import DirectoryRow from "./DirectoryRow";

interface DirectorySectionProps {
  category: Category;
  items: DirectoryIndexItem[];
  locale: Locale;
}

export function DirectorySection({ category, items, locale }: DirectorySectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (items.length === 0) return null;

  const translatedCategory = CATEGORY_LABELS[category]?.[locale] ?? category;
  const countLabel =
    items.length === 1 ? t("indicatorCount", locale) : t("indicatorsCount", locale);
  const icon = CATEGORY_ICONS[category] ?? "📁";

  return (
    <section id={`section-${category}`} className="scroll-mt-24 space-y-3">
      {/* Semantic Single Button Header */}
      <button
        type="button"
        aria-expanded={!isCollapsed}
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between py-3 px-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all text-left cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-base" aria-hidden="true">
            {icon}
          </span>
          <h3 className="text-xs font-black uppercase tracking-wider text-[#F1F5F9]">
            {translatedCategory}
          </h3>
          <span className="text-[10px] font-bold text-[#64748B] bg-white/[0.06] px-2 py-0.5 rounded-full font-mono">
            {items.length} {countLabel}
          </span>
        </div>

        <span className="text-[#94A3B8] hover:text-white transition-colors">
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </span>
      </button>

      {/* Rows Container */}
      {!isCollapsed && (
        <div className="space-y-1.5 pl-0.5">
          {items.map((item) => (
            <DirectoryRow key={item.id} item={item} locale={locale} />
          ))}
        </div>
      )}
    </section>
  );
}

export default DirectorySection;
