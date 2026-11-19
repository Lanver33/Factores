"use client";

import React, { useState, useRef, useEffect, useId } from "react";
import { HelpCircle, ArrowDown } from "lucide-react";
import type { Lang } from "@/types";
import { useConceptGuide } from "./ConceptGuideContext";
import { t } from "@/lib/i18n";

interface ConceptHelpTriggerProps {
  code: string;
  lang?: Lang;
  className?: string;
}

export function ConceptHelpTrigger({
  code,
  lang = "es",
  className = "",
}: ConceptHelpTriggerProps) {
  const { getTerm, focusConcept } = useConceptGuide();
  const term = getTerm(code);

  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const popoverId = useId();

  if (!term) return null;

  const togglePopover = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  const handleFocusFullGuide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    focusConcept(code);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={togglePopover}
        aria-expanded={isOpen}
        aria-controls={popoverId}
        aria-label={`${t("conceptHelpAria", lang)} ${term.displayCode}: ${term.title}`}
        className="p-0.5 rounded-full text-slate-500 hover:text-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400/80 transition-colors"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          id={popoverId}
          role="dialog"
          aria-modal="false"
          aria-label={term.title}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 sm:w-72 bg-slate-950 border border-slate-700 rounded-xl p-3 shadow-2xl z-50 text-xs space-y-2 font-sans animate-in fade-in duration-150"
        >
          {/* Popover Header */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-1.5">
            <span className="text-[10px] font-mono font-bold text-blue-300 bg-blue-950 border border-blue-800/80 px-1.5 py-0.5 rounded shrink-0">
              {term.displayCode}
            </span>
            <span className="font-bold text-white text-xs truncate">
              {term.title}
            </span>
          </div>

          {/* Short Definition */}
          <p className="text-slate-300 leading-snug">
            {term.shortDefinition}
          </p>

          {/* Footer Action: Jump to full guide */}
          <div className="pt-1 border-t border-slate-800/80 text-right">
            <button
              type="button"
              onClick={handleFocusFullGuide}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition-colors"
            >
              <span>{t("seeFullGuide", lang)}</span>
              <ArrowDown className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConceptHelpTrigger;
