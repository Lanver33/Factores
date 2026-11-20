import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { IndicatorSchema } from "./types";
import { loadIndicatorSync } from "./data";

function getDataDir(): string {
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, "frontend", "data", "datasets"))) {
    return path.join(cwd, "frontend", "data");
  }
  if (fs.existsSync(path.join(cwd, "data", "datasets"))) {
    return path.join(cwd, "data");
  }
  return path.join(cwd, "frontend", "data");
}

describe("Data Integrity & Invariants", () => {
  const dataDir = getDataDir();
  const datasetsDir = path.join(dataDir, "datasets");
  const localesEsDir = path.join(dataDir, "locales", "es");
  const localesEnDir = path.join(dataDir, "locales", "en");

  const files = fs.existsSync(datasetsDir) ? fs.readdirSync(datasetsDir).filter((f) => f.endsWith(".json")) : [];

  it("should have at least one indicator file in datasets", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it("asserts every dataset has matching localization files in both es and en", () => {
    files.forEach((file) => {
      const slug = file.replace(/\.json$/, "");
      const esFile = path.join(localesEsDir, file);
      const enFile = path.join(localesEnDir, file);

      expect(fs.existsSync(esFile), `Missing ES locale for ${slug}`).toBe(true);
      expect(fs.existsSync(enFile), `Missing EN locale for ${slug}`).toBe(true);

      const esData = JSON.parse(fs.readFileSync(esFile, "utf-8"));
      const enData = JSON.parse(fs.readFileSync(enFile, "utf-8"));

      expect(esData.question).toBeTruthy();
      expect(enData.question).toBeTruthy();
      expect(esData.unit).toBeTruthy();
      expect(enData.unit).toBeTruthy();
    });
  });

  files.forEach((file) => {
    const slug = file.replace(/\.json$/, "");
    describe(`Indicator: ${file}`, () => {
      const raw = loadIndicatorSync(slug, "es");

      it("conforms strictly to IndicatorSchema", () => {
        expect(raw).not.toBeNull();
        const result = IndicatorSchema.safeParse(raw);
        if (!result.success) {
          console.error(`Validation errors in ${file}:`, result.error.format());
        }
        expect(result.success).toBe(true);
      });

      if (raw && raw.kind === "immigration-flow" && (raw as any).years) {
        it("reconciles immigration numbers: sum(byCountryIso2) + sum(residualByRegion) === declaredTotal", () => {
          for (const yearData of (raw as any).years) {
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

      if (raw && raw.kind === "fiscal-balance" && raw.points) {
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
