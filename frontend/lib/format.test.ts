import { describe, it, expect } from "vitest";
import {
  formatNumber,
  formatCompactNumber,
  formatPercent,
  formatCurrency,
  formatIndicatorValue,
} from "./format";

describe("Locale-Aware Number Formatters", () => {
  describe("formatNumber", () => {
    it("formats thousands separator in Spanish (period)", () => {
      expect(formatNumber(1250000, "es")).toBe("1.250.000");
    });

    it("formats thousands separator in English (comma)", () => {
      expect(formatNumber(1250000, "en")).toBe("1,250,000");
    });

    it("handles 0 and non-finite values safely", () => {
      expect(formatNumber(0, "es")).toBe("0");
      expect(formatNumber(NaN, "es")).toBe("0");
      expect(formatNumber(Infinity, "es")).toBe("0");
    });
  });

  describe("formatCompactNumber", () => {
    it("formats compact notation in Spanish", () => {
      expect(formatCompactNumber(500, "es")).toBe("500");
      expect(formatCompactNumber(1500, "es")).toBe("2 mil");
      expect(formatCompactNumber(1500000, "es")).toBe("1,5 M");
      expect(formatCompactNumber(2500000000, "es")).toBe("2,5 MM");
    });

    it("formats compact notation in English", () => {
      expect(formatCompactNumber(500, "en")).toBe("500");
      expect(formatCompactNumber(1500, "en")).toBe("1.5K");
      expect(formatCompactNumber(1500000, "en")).toBe("1.5M");
      expect(formatCompactNumber(2500000000, "en")).toBe("2.5B");
    });
  });

  describe("formatPercent", () => {
    it("formats percentages with 1 decimal by default", () => {
      expect(formatPercent(187.0, "es")).toBe("187,0%");
      expect(formatPercent(187.0, "en")).toBe("187.0%");
    });

    it("formats percentages with custom decimal places", () => {
      expect(formatPercent(45.678, "es", 2)).toBe("45,68%");
      expect(formatPercent(45.678, "en", 2)).toBe("45.68%");
    });
  });

  describe("formatCurrency", () => {
    it("formats currency in EUR", () => {
      expect(formatCurrency(1500, "es", "eur")).toBe("1.500 €");
      expect(formatCurrency(1500, "en", "eur")).toBe("1,500 €");
    });

    it("formats currency in MM€", () => {
      expect(formatCurrency(661.5, "es", "mmeur")).toBe("661,5 MM€");
      expect(formatCurrency(661.5, "en", "mmeur")).toBe("661.5 MM€");
    });
  });

  describe("formatIndicatorValue", () => {
    it("formats according to ValueFormat enum", () => {
      expect(formatIndicatorValue(187, "percent", "es")).toBe("187,0%");
      expect(formatIndicatorValue(1288562, "number", "es", false)).toBe("1.288.562");
      expect(formatIndicatorValue(1288562, "number", "es", true)).toBe("1,3 M");
    });
  });
});
