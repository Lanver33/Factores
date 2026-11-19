"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  BookOpen,
  Search,
  ChevronDown,
  ChevronRight,
  Info,
  ArrowRight,
  Filter,
} from "lucide-react";
import type { Lang, GlossaryTerm } from "@/types";
import { useConceptGuide } from "./ConceptGuideContext";
import { t } from "@/lib/i18n";

interface ConceptGuideSectionProps {
  lang?: Lang;
}

export function ConceptGuideSection({ lang = "es" }: ConceptGuideSectionProps) {
  const { guide, activeConceptCode, highlightedConceptCode, focusConcept } = useConceptGuide();

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedCodes, setExpandedCodes] = useState<Record<string, boolean>>({});

  // Sync activeConceptCode from context (e.g., when triggered from a popover or chart)
  useEffect(() => {
    if (activeConceptCode) {
      setExpandedCodes((prev) => ({ ...prev, [activeConceptCode]: true }));
      // Reset filter and search if active concept is hidden
      setSelectedCategory("all");
      setSearchQuery("");
    }
  }, [activeConceptCode]);

  if (!guide) return null;

  const { title, subtitle, quickKeys, categories, terms } = guide;

  // Filter terms by selected category and search query
  const filteredTerms = useMemo(() => {
    return terms.filter((term) => {
      // Category check
      if (selectedCategory !== "all" && term.categoryId !== selectedCategory) {
        return false;
      }
      // Search check
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const codeMatch = term.code.toLowerCase().includes(q);
        const displayMatch = term.displayCode.toLowerCase().includes(q);
        const titleMatch = term.title.toLowerCase().includes(q);
        const shortMatch = term.shortDefinition.toLowerCase().includes(q);
        const expMatch = term.explanation.toLowerCase().includes(q);
        return codeMatch || displayMatch || titleMatch || shortMatch || expMatch;
      }
      return true;
    });
  }, [terms, selectedCategory, searchQuery]);

  const toggleExpand = (code: string) => {
    setExpandedCodes((prev) => ({ ...prev, [code]: !prev[code] }));
  };

  const isAllExpanded =
    filteredTerms.length > 0 &&
    filteredTerms.every((term) => expandedCodes[term.code]);

  const toggleAll = () => {
    if (isAllExpanded) {
      setExpandedCodes({});
    } else {
      const next: Record<string, boolean> = {};
      filteredTerms.forEach((term) => {
        next[term.code] = true;
      });
      setExpandedCodes(next);
    }
  };

  // Term counts per category for filter pills
  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    map.set("all", terms.length);
    for (const term of terms) {
      map.set(term.categoryId, (map.get(term.categoryId) || 0) + 1);
    }
    return map;
  }, [terms]);

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-6 shadow-xl animate-in fade-in duration-200">
      {/* Section Header */}
      <div className="border-b border-slate-800 pb-4 space-y-1">
        <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-400 shrink-0" />
          <span>{title}</span>
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
          {subtitle}
        </p>
      </div>

      {/* PART 1: Quick-Reading Keys (Claves) */}
      {quickKeys && quickKeys.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            {t("quickKeysHeading", lang)}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {quickKeys.map((keyCard) => (
              <div
                key={keyCard.id}
                className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-300 bg-blue-950/80 border border-blue-800/70 px-2 py-0.5 rounded">
                    {keyCard.badge}
                  </span>
                  <h4 className="text-sm font-bold text-white leading-tight">
                    {keyCard.title}
                  </h4>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {keyCard.summary}
                </p>

                {keyCard.example && (
                  <p className="text-[11px] text-slate-400 border-l-2 border-slate-700 pl-2.5 pt-0.5 italic">
                    {keyCard.example}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PART 2: Interactive Technical Glossary */}
      <div className="space-y-4 pt-2 border-t border-slate-800/80">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            {t("glossaryHeading", lang)}
          </h3>

          <button
            onClick={toggleAll}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors self-end sm:self-auto"
          >
            {isAllExpanded ? t("collapseAll", lang) : t("expandAll", lang)}
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === "all"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {t("glossaryAll", lang)} ({categoryCounts.get("all") || 0})
            </button>

            {categories.map((cat) => {
              const count = categoryCounts.get(cat.id) || 0;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                  }`}
                >
                  {cat.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px] md:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("glossarySearchPlaceholder", lang)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/80 transition-colors"
            />
          </div>
        </div>

        {/* Terms Accordion List */}
        {filteredTerms.length === 0 ? (
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-8 text-center text-xs text-slate-400 italic">
            {t("glossaryNoMatches", lang)}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTerms.map((term) => {
              const isExpanded = !!expandedCodes[term.code];
              const isHighlighted = highlightedConceptCode === term.code;

              return (
                <div
                  key={term.code}
                  id={`concept-${term.code}`}
                  className={`scroll-mt-24 rounded-xl border transition-all duration-300 ${
                    isHighlighted
                      ? "ring-2 ring-blue-500 border-blue-500/80 bg-blue-950/40"
                      : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700"
                  }`}
                >
                  {/* Collapsed Header Row */}
                  <button
                    type="button"
                    onClick={() => toggleExpand(term.code)}
                    aria-expanded={isExpanded}
                    aria-controls={`concept-content-${term.code}`}
                    className="w-full text-left p-3 flex items-center justify-between gap-3 cursor-pointer select-none focus:outline-none"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="min-w-[68px] text-center text-[11px] font-mono font-bold text-blue-300 bg-blue-950 border border-blue-800/80 px-2 py-0.5 rounded shrink-0">
                        {term.displayCode}
                      </span>

                      <span className="text-xs font-bold text-white truncate">
                        {term.title}
                      </span>

                      {!isExpanded && (
                        <span className="hidden sm:inline text-xs text-slate-400 truncate max-w-xs font-normal">
                          · {term.shortDefinition}
                        </span>
                      )}
                    </div>

                    <div className="text-slate-400 shrink-0">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Content Body */}
                  {isExpanded && (
                    <div
                      id={`concept-content-${term.code}`}
                      className="px-3 pb-3.5 pt-1 border-t border-slate-800/60 space-y-2.5 animate-in fade-in duration-150"
                    >
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {term.explanation}
                      </p>

                      {term.keyNote && (
                        <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 flex items-start gap-2 text-[11px] text-slate-300 leading-normal">
                          <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span>{term.keyNote}</span>
                        </div>
                      )}

                      {term.relatedCodes && term.relatedCodes.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap pt-1 text-[11px]">
                          <span className="text-slate-400 font-semibold">
                            {t("relatedConcepts", lang)}
                          </span>
                          {term.relatedCodes.map((relCode) => (
                            <button
                              key={relCode}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                focusConcept(relCode);
                              }}
                              className="inline-flex items-center gap-1 font-mono font-bold text-blue-300 bg-blue-950/80 hover:bg-blue-900 border border-blue-800/80 px-2 py-0.5 rounded transition-colors"
                            >
                              <span>{relCode}</span>
                              <ArrowRight className="w-2.5 h-2.5" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default ConceptGuideSection;
