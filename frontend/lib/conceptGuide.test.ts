import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import type { ConceptGuide, GlossaryTerm } from "@/lib/types";

const GUIDE_PATH = path.join(process.cwd(), "data", "locales", "es", "cuentas-publicas-espana.json");

function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function filterTerms(
  terms: GlossaryTerm[],
  categoryId: string,
  query: string
): GlossaryTerm[] {
  const normQuery = normalizeText(query.trim());
  return terms.filter((term) => {
    if (categoryId !== "all" && term.categoryId !== categoryId) {
      return false;
    }
    if (normQuery) {
      const c = normalizeText(term.code);
      const dc = normalizeText(term.displayCode);
      const t = normalizeText(term.title);
      const s = normalizeText(term.shortDefinition);
      const e = normalizeText(term.explanation);
      return (
        c.includes(normQuery) ||
        dc.includes(normQuery) ||
        t.includes(normQuery) ||
        s.includes(normQuery) ||
        e.includes(normQuery)
      );
    }
    return true;
  });
}

describe("Concept Guide & Technical Glossary", () => {
  const guideJson: ConceptGuide = JSON.parse(fs.readFileSync(GUIDE_PATH, "utf-8")).conceptGuide;

  it("loads valid guide JSON structure", () => {
    expect(guideJson.title).toBeTruthy();
    expect(guideJson.subtitle).toBeTruthy();
    expect(Array.isArray(guideJson.quickKeys)).toBe(true);
    expect(guideJson.quickKeys.length).toBeGreaterThan(0);
    expect(Array.isArray(guideJson.categories)).toBe(true);
    expect(Array.isArray(guideJson.terms)).toBe(true);
  });

  it("has zero duplicate terms[].code values", () => {
    const seen = new Set<string>();
    for (const term of guideJson.terms) {
      expect(seen.has(term.code)).toBe(false);
      seen.add(term.code);
    }
  });

  it("ensures every term.categoryId exists in categories", () => {
    const validCategories = new Set(guideJson.categories.map((c) => c.id));
    for (const term of guideJson.terms) {
      expect(validCategories.has(term.categoryId)).toBe(true);
    }
  });

  it("ensures every relatedCodes entry points to an existing term.code", () => {
    const validCodes = new Set(guideJson.terms.map((t) => t.code));
    for (const term of guideJson.terms) {
      if (term.relatedCodes) {
        for (const relCode of term.relatedCodes) {
          expect(validCodes.has(relCode)).toBe(true);
        }
      }
    }
  });

  it("includes glossary entries for all expected fiscal codes", () => {
    const validCodes = new Set(guideJson.terms.map((t) => t.code));
    const requiredCodes = [
      "SEC2010",
      "S13",
      "PC_GDP",
      "TR",
      "TE",
      "B9",
      "D2",
      "D5",
      "D61",
      "D91",
      "NON_TAX_RESIDUAL",
      "GF01",
      "GF02",
      "GF03",
      "GF04",
      "GF05",
      "GF06",
      "GF07",
      "GF08",
      "GF09",
      "GF10",
      "GF0107",
    ];

    for (const code of requiredCodes) {
      expect(validCodes.has(code)).toBe(true);
    }
  });

  describe("Filtering & Lookup Logic", () => {
    it("filters terms by category correctly", () => {
      const revenueTerms = filterTerms(guideJson.terms, "revenues", "");
      expect(revenueTerms.length).toBeGreaterThan(0);
      revenueTerms.forEach((t) => {
        expect(t.categoryId).toBe("revenues");
      });
    });

    it("filters terms by query with case-insensitive and accent-insensitive matching", () => {
      // Searching "b.9"
      const b9Results = filterTerms(guideJson.terms, "all", "b.9");
      expect(b9Results.some((t) => t.code === "B9")).toBe(true);

      // Searching "proteccion" (without accent) matches "Protección"
      const accentResults = filterTerms(guideJson.terms, "all", "proteccion");
      expect(accentResults.some((t) => t.code === "GF10")).toBe(true);
    });
  });
});
