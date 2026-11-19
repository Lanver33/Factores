import { describe, it, expect } from "vitest";
import { classifyChoropleth } from "../src/components/visualizations/immigration/jenks";

const TEST_PALETTE = ["#0284c7", "#2563eb", "#7c3aed", "#c026d3", "#db2777"] as const;

describe("classifyChoropleth Algorithm", () => {
  it("handles empty arrays gracefully", () => {
    const result = classifyChoropleth([], TEST_PALETTE);
    expect(result.classes.length).toBe(0);
    expect(result.minVal).toBe(0);
    expect(result.maxVal).toBe(0);
    expect(result.getClass(50)).toBeNull();
    expect(result.getColor(50, "#fallback")).toBe("#fallback");
  });

  it("handles arrays with only 0 or negative values", () => {
    const result = classifyChoropleth([0, -1, -5], TEST_PALETTE);
    expect(result.classes.length).toBe(0);
    expect(result.getClass(0)).toBeNull();
  });

  it("handles single item array", () => {
    const result = classifyChoropleth([42], TEST_PALETTE);
    expect(result.classes.length).toBe(1);
    expect(result.minVal).toBe(42);
    expect(result.maxVal).toBe(42);
    expect(result.classes[0].color).toBe(TEST_PALETTE[0]);
    expect(result.getColor(42)).toBe(TEST_PALETTE[0]);
  });

  it("handles multiple identical values without crashing or empty cuts", () => {
    const result = classifyChoropleth([100, 100, 100, 100], TEST_PALETTE);
    expect(result.classes.length).toBe(1);
    expect(result.minVal).toBe(100);
    expect(result.maxVal).toBe(100);
    expect(result.getColor(100)).toBe(TEST_PALETTE[0]);
  });

  it("gracefully degrades when fewer unique values exist than palette length", () => {
    const result = classifyChoropleth([10, 50], TEST_PALETTE);
    expect(result.classes.length).toBe(2);
    expect(result.minVal).toBe(10);
    expect(result.maxVal).toBe(50);
    expect(result.classes[0].min).toBe(10);
    expect(result.classes[0].max).toBe(10);
    expect(result.classes[1].max).toBe(50);
    expect(result.getColor(10)).toBe(TEST_PALETTE[0]);
    expect(result.getColor(50)).toBe(TEST_PALETTE[1]);
  });

  it("handles standard skewed distribution (e.g. immigration volumes) and assigns contiguous classes", () => {
    const skewedValues = [
      120, 150, 200, 310, 450, 800, 1200, 1500, 2400, 4500, 12000, 35000, 120000,
    ];
    const result = classifyChoropleth(skewedValues, TEST_PALETTE);

    expect(result.classes.length).toBeGreaterThanOrEqual(2);
    expect(result.classes.length).toBeLessThanOrEqual(TEST_PALETTE.length);
    expect(result.minVal).toBe(120);
    expect(result.maxVal).toBe(120000);

    // Verify classes are contiguous
    for (let i = 1; i < result.classes.length; i++) {
      expect(result.classes[i].min).toBe(result.classes[i - 1].max);
      expect(result.classes[i].max).toBeGreaterThan(result.classes[i].min);
    }

    // Verify lowest and highest values get classified
    const lowestColor = result.getColor(120);
    const highestColor = result.getColor(120000);
    expect(lowestColor).toBe(TEST_PALETTE[0]);
    expect(highestColor).toBe(result.classes[result.classes.length - 1].color);
  });
});
