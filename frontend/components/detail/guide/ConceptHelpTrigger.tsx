"use client";

import React, { useState, useRef, useEffect, useId, useCallback } from "react";
import { createPortal } from "react-dom";
import { HelpCircle, ArrowDown } from "lucide-react";
import type { Lang } from "@/lib/types";
import { useConceptGuide } from "./ConceptGuideContext";
import { t } from "@/lib/i18n";

interface ConceptHelpTriggerProps {
  code: string;
  lang?: Lang;
  className?: string;
}

interface PopoverCoords {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
}

export function ConceptHelpTrigger({
  code,
  lang = "es",
  className = "",
}: ConceptHelpTriggerProps) {
  const { getTerm, focusConcept } = useConceptGuide();
  const term = getTerm(code);

  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<PopoverCoords | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const popoverId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popoverWidth = Math.min(290, typeof window !== "undefined" ? window.innerWidth - 24 : 290);

    // Horizontal positioning: align to right of trigger, or clamp within viewport
    let left = rect.right - popoverWidth;
    if (typeof window !== "undefined") {
      if (left < 12) {
        left = Math.max(12, rect.left);
      }
      if (left + popoverWidth > window.innerWidth - 12) {
        left = window.innerWidth - popoverWidth - 12;
      }
    }

    // Vertical positioning: if enough space above (> 170px), place above; else place below
    const spaceAbove = rect.top;
    const spaceBelow = typeof window !== "undefined" ? window.innerHeight - rect.bottom : 300;

    if (spaceAbove > 170 || spaceAbove > spaceBelow) {
      setCoords({
        bottom: typeof window !== "undefined" ? window.innerHeight - rect.top + 8 : 0,
        left,
        width: popoverWidth,
      });
    } else {
      setCoords({
        top: rect.bottom + 8,
        left,
        width: popoverWidth,
      });
    }
  }, []);

  const togglePopover = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleFocusFullGuide = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsOpen(false);
    focusConcept(code);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      updatePosition();
    };

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

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, updatePosition]);

  if (!term) return null;

  const popoverContent = isOpen && coords && mounted && (
    <div
      ref={popoverRef}
      id={popoverId}
      role="dialog"
      aria-modal="false"
      aria-label={term.title}
      style={{
        position: "fixed",
        top: coords.top !== undefined ? `${coords.top}px` : "auto",
        bottom: coords.bottom !== undefined ? `${coords.bottom}px` : "auto",
        left: `${coords.left}px`,
        width: `${coords.width}px`,
        zIndex: 9999,
      }}
      className="bg-slate-950 border border-slate-700 rounded-xl p-3 shadow-2xl text-xs space-y-2 font-sans animate-in fade-in duration-150"
      onPointerDown={(e) => e.stopPropagation()}
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
  );

  return (
    <div className={`relative inline-flex items-center shrink-0 ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={togglePopover}
        aria-expanded={isOpen}
        aria-controls={popoverId}
        aria-label={`${t("conceptHelpAria", lang)} ${term.displayCode}: ${term.title}`}
        className="p-1 rounded-full text-slate-500 hover:text-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400/80 transition-colors shrink-0 cursor-pointer"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {mounted && popoverContent && createPortal(popoverContent, document.body)}
    </div>
  );
}

export default ConceptHelpTrigger;
