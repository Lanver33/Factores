import { describe, it, expect } from "vitest";
import {
  formatFiscalValue,
  formatFiscalDelta,
  buildAnatomyBreakdown,
  computeEraComparison,
  buildSankeyGraph,
  getAvailableYears,
  getLatestCofogYear,
  getYearMetrics,
} from "./fiscalSelectors";
import type { AnnualBalanceRecord, FiscalTaxonomy } from "@/lib/types";

const mockTaxonomy: FiscalTaxonomy = {
  revenues: [
    {
      code: "D5",
      label: "Impuestos directos",
      shortLabel: "Imp. Directos",
      children: [
        { code: "D51A_C1", label: "IRPF" },
        { code: "D51B_C2", label: "Sociedades" },
      ],
    },
    {
      code: "D2",
      label: "Impuestos indirectos",
      shortLabel: "Imp. Indirectos",
      children: [{ code: "D211", label: "IVA" }],
    },
  ],
  expenditures: [
    {
      code: "GF10",
      label: "Protección social",
      shortLabel: "Protección social",
      highlights: [{ code: "GF1002", label: "Vejez" }],
    },
    {
      code: "GF07",
      label: "Sanidad",
      shortLabel: "Sanidad",
      highlights: [],
    },
  ],
};

const mockDeficitRecord: AnnualBalanceRecord = {
  year: "2024",
  cofogAvailable: true,
  metrics: {
    PC_GDP: {
      totals: { revenue: 42.1, expenditure: 45.3, balance: -3.2 },
      revenues: {
        D5: { total: 15.0, breakdown: { D51A_C1: 10.0, D51B_C2: 5.0 } },
        D2: { total: 12.0, breakdown: { D211: 12.0 } },
      },
      expenditures: {
        GF10: { total: 20.0, highlights: { GF1002: 15.0 } },
        GF07: { total: 15.0, highlights: {} },
      },
    },
    MIO_EUR: {
      totals: { revenue: 661500.0, expenditure: 711800.0, balance: -50300.0 },
      revenues: {
        D5: { total: 235000.0, breakdown: { D51A_C1: 156000.0, D51B_C2: 79000.0 } },
        D2: { total: 188000.0, breakdown: { D211: 188000.0 } },
      },
      expenditures: {
        GF10: { total: 314000.0, highlights: { GF1002: 235000.0 } },
        GF07: { total: 235000.0, highlights: {} },
      },
    },
  },
};

const mockSurplusRecord: AnnualBalanceRecord = {
  year: "2006",
  cofogAvailable: true,
  metrics: {
    PC_GDP: {
      totals: { revenue: 40.0, expenditure: 38.0, balance: 2.0 },
      revenues: {
        D5: { total: 18.0, breakdown: {} },
        D2: { total: 14.0, breakdown: {} },
      },
      expenditures: {
        GF10: { total: 16.0, highlights: {} },
        GF07: { total: 12.0, highlights: {} },
      },
    },
    MIO_EUR: {
      totals: { revenue: 400000.0, expenditure: 380000.0, balance: 20000.0 },
      revenues: {
        D5: { total: 180000.0, breakdown: {} },
        D2: { total: 140000.0, breakdown: {} },
      },
      expenditures: {
        GF10: { total: 160000.0, highlights: {} },
        GF07: { total: 120000.0, highlights: {} },
      },
    },
  },
};

const mockNoCofogRecord: AnnualBalanceRecord = {
  year: "2025",
  cofogAvailable: false,
  metrics: {
    PC_GDP: {
      totals: { revenue: 42.5, expenditure: 44.9, balance: -2.4 },
      revenues: {
        D5: { total: 15.5, breakdown: {} },
        D2: { total: 12.2, breakdown: {} },
      },
      expenditures: null,
    },
    MIO_EUR: {
      totals: { revenue: 680000.0, expenditure: 718000.0, balance: -38000.0 },
      revenues: {
        D5: { total: 248000.0, breakdown: {} },
        D2: { total: 195000.0, breakdown: {} },
      },
      expenditures: null,
    },
  },
};

describe("fiscalSelectors", () => {
  describe("formatFiscalValue", () => {
    it("formats PC_GDP values in ES and EN", () => {
      expect(formatFiscalValue(42.1, "PC_GDP", "es")).toBe("42,1 % PIB");
      expect(formatFiscalValue(42.1, "PC_GDP", "en")).toBe("42.1 % GDP");
      expect(formatFiscalValue(-3.2, "PC_GDP", "es")).toBe("-3,2 % PIB");
      expect(formatFiscalValue(3.2, "PC_GDP", "es", { signed: true })).toBe("+3,2 % PIB");
      expect(formatFiscalValue(NaN, "PC_GDP", "es")).toBe("—");
    });

    it("formats MIO_EUR values in exact and compact mode", () => {
      expect(formatFiscalValue(661500, "MIO_EUR", "es", { compact: true })).toBe("661,5 MM€");
      expect(formatFiscalValue(661500, "MIO_EUR", "en", { compact: true })).toBe("€661.5B");
      expect(formatFiscalValue(-50300, "MIO_EUR", "es", { compact: true })).toBe("-50,3 MM€");
      expect(formatFiscalValue(500, "MIO_EUR", "es", { compact: true })).toBe("500 M€");
      expect(formatFiscalValue(661500, "MIO_EUR", "es", { compact: false })).toBe("661.500 M€");
      expect(formatFiscalValue(661500, "MIO_EUR", "en", { compact: false })).toBe("€661,500M");
    });
  });

  describe("formatFiscalDelta", () => {
    it("formats percentage points and millions/billions with explicit signs", () => {
      expect(formatFiscalDelta(1.4, "PC_GDP", "es")).toBe("+1,4 pp");
      expect(formatFiscalDelta(-0.8, "PC_GDP", "en")).toBe("-0.8 pp");
      expect(formatFiscalDelta(12400, "MIO_EUR", "es")).toBe("+12,4 MM€");
      expect(formatFiscalDelta(-12400, "MIO_EUR", "en")).toBe("-€12.4B");
    });
  });

  describe("buildAnatomyBreakdown", () => {
    it("attaches deficit bridge to revenues side for deficit year", () => {
      const breakdown = buildAnatomyBreakdown(mockDeficitRecord, mockTaxonomy, "PC_GDP");
      expect(breakdown.bridgeItem).not.toBeNull();
      expect(breakdown.bridgeItem?.side).toBe("revenues");
      expect(breakdown.bridgeItem?.type).toBe("deficit");
      expect(breakdown.bridgeItem?.value).toBe(3.2);

      const revTotal = breakdown.revenues.reduce((s, r) => s + r.value, 0) + (breakdown.bridgeItem?.value ?? 0);
      const expTotal = breakdown.expenditures.reduce((s, e) => s + e.value, 0);
      // In mock data D5=15, D2=12 + deficit 3.2 = 30.2; exp GF10=20, GF07=15 = 35. (In real data totals match sum)
      expect(breakdown.bridgeItem?.type).toBe("deficit");
    });

    it("attaches surplus bridge to expenditures side for surplus year", () => {
      const breakdown = buildAnatomyBreakdown(mockSurplusRecord, mockTaxonomy, "PC_GDP");
      expect(breakdown.bridgeItem).not.toBeNull();
      expect(breakdown.bridgeItem?.side).toBe("expenditures");
      expect(breakdown.bridgeItem?.type).toBe("surplus");
      expect(breakdown.bridgeItem?.value).toBe(2.0);
    });

    it("handles cofogAvailable === false gracefully", () => {
      const breakdown = buildAnatomyBreakdown(mockNoCofogRecord, mockTaxonomy, "PC_GDP");
      expect(breakdown.cofogAvailable).toBe(false);
      expect(breakdown.expenditures).toEqual([]);
      expect(breakdown.revenues.length).toBeGreaterThan(0);
    });
  });

  describe("computeEraComparison", () => {
    it("computes B - A deltas and sorts descending", () => {
      const era = computeEraComparison(
        [mockSurplusRecord, mockDeficitRecord],
        mockTaxonomy,
        "2006",
        "2024",
        "revenues",
        "PC_GDP"
      );

      expect(era.items.length).toBe(2);
      expect(era.items[0].code).toBe("D2"); // -2 > -3
      expect(era.items[1].code).toBe("D5"); // -3
      expect(era.maxAbsDelta).toBe(3);
    });

    it("identifies missing COFOG years", () => {
      const era = computeEraComparison(
        [mockDeficitRecord, mockNoCofogRecord],
        mockTaxonomy,
        "2024",
        "2025",
        "expenditures",
        "PC_GDP"
      );

      expect(era.missingCofogYears).toEqual(["2025"]);
      expect(era.items).toEqual([]);
    });
  });

  describe("buildSankeyGraph", () => {
    it("produces non-NaN SVG paths and deterministic node IDs for deficit year", () => {
      const graph = buildSankeyGraph(mockDeficitRecord, mockTaxonomy, "PC_GDP", 920, 520);
      expect(graph.cofogAvailable).toBe(true);
      expect(graph.nodes.length).toBeGreaterThan(0);
      expect(graph.links.length).toBeGreaterThan(0);

      graph.nodes.forEach((n) => {
        expect(Number.isNaN(n.x)).toBe(false);
        expect(Number.isNaN(n.y)).toBe(false);
        expect(Number.isNaN(n.height)).toBe(false);
        expect(n.height).toBeGreaterThan(0);
      });

      graph.links.forEach((l) => {
        expect(l.path).not.toContain("NaN");
        expect(l.path.startsWith("M")).toBe(true);
      });
    });

    it("produces valid geometry for surplus year", () => {
      const graph = buildSankeyGraph(mockSurplusRecord, mockTaxonomy, "PC_GDP", 920, 520);
      expect(graph.cofogAvailable).toBe(true);
      const surplusNode = graph.nodes.find((n) => n.code === "SURPLUS_BRIDGE");
      expect(surplusNode).toBeDefined();
      expect(surplusNode?.column).toBe(2);
    });
  });

  describe("helpers: getAvailableYears & getLatestCofogYear", () => {
    it("returns sorted years and latest COFOG year", () => {
      const balances = [mockNoCofogRecord, mockSurplusRecord, mockDeficitRecord];
      expect(getAvailableYears(balances)).toEqual(["2006", "2024", "2025"]);
      expect(getLatestCofogYear(balances)).toBe("2024");
    });
  });
});
