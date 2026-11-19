import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { IndicatorSchema } from "../src/domain/indicator.schema";

const INDICATORS_DIR = path.join(process.cwd(), "content", "indicators");

describe("Data Integrity & Invariants", () => {
  const files = fs.readdirSync(INDICATORS_DIR).filter((f) => f.endsWith(".json"));

  it("should have at least one indicator file", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  files.forEach((file) => {
    describe(`Indicator: ${file}`, () => {
      const filePath = path.join(INDICATORS_DIR, file);
      const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));

      it("conforms strictly to IndicatorSchema", () => {
        const result = IndicatorSchema.safeParse(raw);
        if (!result.success) {
          console.error(`Validation errors in ${file}:`, result.error.format());
        }
        expect(result.success).toBe(true);
      });

      if (raw.kind === "immigration-flow") {
        it("reconciles immigration numbers: sum(byCountryIso2) + sum(residualByRegion) === declaredTotal", () => {
          for (const yearData of raw.years) {
            const countrySum = Object.values(yearData.byCountryIso2 as Record<string, number>).reduce(
              (acc, v) => acc + v,
              0
            );
            const residualSum = Object.values(
              yearData.residualByRegion as Record<string, number>
            ).reduce((acc, v) => acc + v, 0);
            const totalSum = countrySum + residualSum;

            expect(Math.abs(totalSum - yearData.declaredTotal)).toBeLessThanOrEqual(2);
          }
        });
      }

      if (raw.kind === "fiscal-balance") {
        it("reconciles fiscal figures: sum(stateRevenue) ≈ totalRevenue and sum(stateSpending) ≈ totalSpending", () => {
          for (const point of raw.points) {
            const revSum = Object.values(point.stateRevenueMmEur as Record<string, number>).reduce(
              (acc, v) => acc + v,
              0
            );
            const spendSum = Object.values(point.stateSpendingMmEur as Record<string, number>).reduce(
              (acc, v) => acc + v,
              0
            );

            expect(Math.abs(revSum - point.totalRevenueMmEur)).toBeLessThanOrEqual(0.1);
            expect(Math.abs(spendSum - point.totalSpendingMmEur)).toBeLessThanOrEqual(0.1);
            expect(
              Math.abs(point.totalRevenueMmEur - point.totalSpendingMmEur - point.deficitMmEur)
            ).toBeLessThanOrEqual(0.1);
          }
        });
      }
    });
  });
});
