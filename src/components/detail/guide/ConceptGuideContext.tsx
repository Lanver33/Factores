"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import type { ConceptGuide, GlossaryTerm } from "@/types";

interface ConceptGuideContextValue {
  guide: ConceptGuide | null;
  getTerm: (code: string) => GlossaryTerm | undefined;
  activeConceptCode: string | null;
  highlightedConceptCode: string | null;
  focusConcept: (code: string) => void;
  clearActiveConcept: () => void;
}

const ConceptGuideContext = createContext<ConceptGuideContextValue>({
  guide: null,
  getTerm: () => undefined,
  activeConceptCode: null,
  highlightedConceptCode: null,
  focusConcept: () => {},
  clearActiveConcept: () => {},
});

export interface ConceptGuideProviderProps {
  guide?: ConceptGuide | null;
  children: React.ReactNode;
}

export function ConceptGuideProvider({ guide = null, children }: ConceptGuideProviderProps) {
  const [activeConceptCode, setActiveConceptCode] = useState<string | null>(null);
  const [highlightedConceptCode, setHighlightedConceptCode] = useState<string | null>(null);
  const highlightTimerRef = useRef<number | null>(null);

  const termMap = useMemo(() => {
    const map = new Map<string, GlossaryTerm>();
    if (guide?.terms) {
      for (const term of guide.terms) {
        map.set(term.code, term);
        map.set(term.code.trim().toUpperCase(), term);
        map.set(term.displayCode, term);
        map.set(term.displayCode.trim().toUpperCase(), term);
      }
    }
    return map;
  }, [guide]);

  const getTerm = useCallback(
    (code: string) => {
      if (!code) return undefined;
      return (
        termMap.get(code) ||
        termMap.get(code.trim().toUpperCase()) ||
        termMap.get(code.replace(".", "")) ||
        termMap.get(code.replace(".", "").toUpperCase())
      );
    },
    [termMap]
  );

  const clearActiveConcept = useCallback(() => {
    setActiveConceptCode(null);
    setHighlightedConceptCode(null);
  }, []);

  const focusConcept = useCallback((code: string) => {
    setActiveConceptCode(code);
    setHighlightedConceptCode(code);

    if (highlightTimerRef.current !== null) {
      window.clearTimeout(highlightTimerRef.current);
    }

    highlightTimerRef.current = window.setTimeout(() => {
      setHighlightedConceptCode(null);
      highlightTimerRef.current = null;
    }, 2200);

    requestAnimationFrame(() => {
      const el = document.getElementById(`concept-${code}`);
      if (el) {
        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        el.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "center",
        });
      }
    });
  }, []);

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current !== null) {
        window.clearTimeout(highlightTimerRef.current);
      }
    };
  }, []);

  const value = useMemo(
    () => ({
      guide,
      getTerm,
      activeConceptCode,
      highlightedConceptCode,
      focusConcept,
      clearActiveConcept,
    }),
    [guide, getTerm, activeConceptCode, highlightedConceptCode, focusConcept, clearActiveConcept]
  );

  return (
    <ConceptGuideContext.Provider value={value}>
      {children}
    </ConceptGuideContext.Provider>
  );
}

export function useConceptGuide() {
  return useContext(ConceptGuideContext);
}
