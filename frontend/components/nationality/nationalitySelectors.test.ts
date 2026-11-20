import { describe, it, expect } from "vitest";
import {
  getAvailableYears,
  getLatestCompleteYear,
  getHeadlineKpis,
  buildRepresentationComparison,
  buildLaborTimeSeries,
  buildNaturalizationsSeries,
  buildLivingConditionsSeries,
  formatHeadcount,
  formatPercent,
  formatCurrencyEur,
  formatDelta,
} from "./nationalitySelectors";
import type { NationalityAnnualRecord } from "@/lib/types";

const mockRecords: NationalityAnnualRecord[] = [
  {
    year: "2023",
    naturalizations: 240000,
    definitions: {
      citizenship: {
        demographics: {
          total: {
            population: 48000000,
            shareOfTotalPct: 100.0,
            shareOfWorkingAgePct: 100.0,
            oldAgeDependencyRatio: 30.5,
            ageBands: {
              under15: 6500000,
              workingAge15to64: 31700000,
              senior65plus: 9800000,
              under15Pct: 13.5,
              workingAge15to64Pct: 66.0,
              senior65plusPct: 20.5,
            },
          },
          nationals: {
            population: 42000000,
            shareOfTotalPct: 87.5,
            shareOfWorkingAgePct: 84.5,
            oldAgeDependencyRatio: 35.0,
            ageBands: {
              under15: 5600000,
              workingAge15to64: 26800000,
              senior65plus: 9600000,
              under15Pct: 13.3,
              workingAge15to64Pct: 63.8,
              senior65plusPct: 22.9,
            },
          },
          foreigners: {
            population: 6000000,
            shareOfTotalPct: 12.5,
            shareOfWorkingAgePct: 15.5,
            oldAgeDependencyRatio: 8.2,
            ageBands: {
              under15: 900000,
              workingAge15to64: 4900000,
              senior65plus: 200000,
              under15Pct: 15.0,
              workingAge15to64Pct: 81.7,
              senior65plusPct: 3.3,
            },
          },
        },
        laborMarket: {
          total: {
            employedThousands: 21000.0,
            shareOfEmployedPct: 100.0,
            activityRatePct: 74.0,
            employmentRatePct: 65.0,
            unemploymentRatePct: 12.0,
          },
          nationals: {
            employedThousands: 18000.0,
            shareOfEmployedPct: 85.7,
            activityRatePct: 73.5,
            employmentRatePct: 65.5,
            unemploymentRatePct: 11.0,
          },
          foreigners: {
            employedThousands: 3000.0,
            shareOfEmployedPct: 14.3,
            activityRatePct: 77.0,
            employmentRatePct: 62.0,
            unemploymentRatePct: 17.0,
          },
        },
      },
      birthplace: {
        demographics: {
          total: {
            population: 48000000,
            shareOfTotalPct: 100.0,
            shareOfWorkingAgePct: 100.0,
            oldAgeDependencyRatio: 30.5,
            ageBands: {
              under15: 6500000,
              workingAge15to64: 31700000,
              senior65plus: 9800000,
              under15Pct: 13.5,
              workingAge15to64Pct: 66.0,
              senior65plusPct: 20.5,
            },
          },
          nationals: {
            population: 39500000,
            shareOfTotalPct: 82.3,
            shareOfWorkingAgePct: 78.5,
            oldAgeDependencyRatio: 37.0,
            ageBands: {
              under15: 5800000,
              workingAge15to64: 24600000,
              senior65plus: 9100000,
              under15Pct: 14.7,
              workingAge15to64Pct: 62.3,
              senior65plusPct: 23.0,
            },
          },
          foreigners: {
            population: 8500000,
            shareOfTotalPct: 17.7,
            shareOfWorkingAgePct: 22.4,
            oldAgeDependencyRatio: 9.8,
            ageBands: {
              under15: 700000,
              workingAge15to64: 7100000,
              senior65plus: 700000,
              under15Pct: 8.2,
              workingAge15to64Pct: 83.5,
              senior65plusPct: 8.3,
            },
          },
        },
        laborMarket: {
          total: {
            employedThousands: 21000.0,
            shareOfEmployedPct: 100.0,
            activityRatePct: 74.0,
            employmentRatePct: 65.0,
            unemploymentRatePct: 12.0,
          },
          nationals: {
            employedThousands: 16500.0,
            shareOfEmployedPct: 78.6,
            activityRatePct: 73.0,
            employmentRatePct: 65.5,
            unemploymentRatePct: 10.8,
          },
          foreigners: {
            employedThousands: 4500.0,
            shareOfEmployedPct: 21.4,
            activityRatePct: 77.5,
            employmentRatePct: 63.5,
            unemploymentRatePct: 16.0,
          },
        },
      },
    },
    livingConditions: {
      total: {
        medianEquivalisedIncomeEur: 19000.0,
        meanEquivalisedIncomeEur: 21500.0,
        atRiskOfPovertyPct: 20.0,
      },
      nationals: {
        medianEquivalisedIncomeEur: 20000.0,
        meanEquivalisedIncomeEur: 22500.0,
        atRiskOfPovertyPct: 16.0,
      },
      foreigners: {
        medianEquivalisedIncomeEur: 13500.0,
        meanEquivalisedIncomeEur: 15500.0,
        atRiskOfPovertyPct: 35.0,
      },
    },
  },
  {
    year: "2024",
    naturalizations: 250000,
    definitions: {
      citizenship: {
        demographics: {
          total: {
            population: 48600000,
            shareOfTotalPct: 100.0,
            shareOfWorkingAgePct: 100.0,
            oldAgeDependencyRatio: 31.0,
            ageBands: {
              under15: 6400000,
              workingAge15to64: 32200000,
              senior65plus: 10000000,
              under15Pct: 13.2,
              workingAge15to64Pct: 66.3,
              senior65plusPct: 20.5,
            },
          },
          nationals: {
            population: 42100000,
            shareOfTotalPct: 86.6,
            shareOfWorkingAgePct: 83.2,
            oldAgeDependencyRatio: 35.8,
            ageBands: {
              under15: 5500000,
              workingAge15to64: 26800000,
              senior65plus: 9800000,
              under15Pct: 13.1,
              workingAge15to64Pct: 63.7,
              senior65plusPct: 23.2,
            },
          },
          foreigners: {
            population: 6500000,
            shareOfTotalPct: 13.4,
            shareOfWorkingAgePct: 16.8,
            oldAgeDependencyRatio: 7.5,
            ageBands: {
              under15: 900000,
              workingAge15to64: 5400000,
              senior65plus: 200000,
              under15Pct: 13.8,
              workingAge15to64Pct: 83.1,
              senior65plusPct: 3.1,
            },
          },
        },
        laborMarket: {
          total: {
            employedThousands: 21300.0,
            shareOfEmployedPct: 100.0,
            activityRatePct: 74.6,
            employmentRatePct: 66.1,
            unemploymentRatePct: 11.4,
          },
          nationals: {
            employedThousands: 18100.0,
            shareOfEmployedPct: 85.0,
            activityRatePct: 74.6,
            employmentRatePct: 66.8,
            unemploymentRatePct: 10.4,
          },
          foreigners: {
            employedThousands: 3200.0,
            shareOfEmployedPct: 15.0,
            activityRatePct: 74.8,
            employmentRatePct: 62.3,
            unemploymentRatePct: 16.7,
          },
          euForeigners: {
            employedThousands: 800.0,
            shareOfEmployedPct: 3.8,
            activityRatePct: 76.0,
            employmentRatePct: 69.5,
            unemploymentRatePct: 11.5,
          },
          nonEuForeigners: {
            employedThousands: 2400.0,
            shareOfEmployedPct: 11.2,
            activityRatePct: 74.2,
            employmentRatePct: 59.9,
            unemploymentRatePct: 18.5,
          },
        },
      },
      birthplace: {
        demographics: {
          total: {
            population: 48600000,
            shareOfTotalPct: 100.0,
            shareOfWorkingAgePct: 100.0,
            oldAgeDependencyRatio: 31.0,
            ageBands: {
              under15: 6400000,
              workingAge15to64: 32200000,
              senior65plus: 10000000,
              under15Pct: 13.2,
              workingAge15to64Pct: 66.3,
              senior65plusPct: 20.5,
            },
          },
          nationals: {
            population: 39800000,
            shareOfTotalPct: 81.9,
            shareOfWorkingAgePct: 77.0,
            oldAgeDependencyRatio: 38.0,
            ageBands: {
              under15: 5800000,
              workingAge15to64: 24800000,
              senior65plus: 9200000,
              under15Pct: 14.6,
              workingAge15to64Pct: 62.3,
              senior65plusPct: 23.1,
            },
          },
          foreigners: {
            population: 8800000,
            shareOfTotalPct: 18.1,
            shareOfWorkingAgePct: 23.0,
            oldAgeDependencyRatio: 10.8,
            ageBands: {
              under15: 600000,
              workingAge15to64: 7400000,
              senior65plus: 800000,
              under15Pct: 6.8,
              workingAge15to64Pct: 84.1,
              senior65plusPct: 9.1,
            },
          },
        },
        laborMarket: {
          total: {
            employedThousands: 21300.0,
            shareOfEmployedPct: 100.0,
            activityRatePct: 74.6,
            employmentRatePct: 66.1,
            unemploymentRatePct: 11.4,
          },
          nationals: {
            employedThousands: 16600.0,
            shareOfEmployedPct: 77.9,
            activityRatePct: 73.7,
            employmentRatePct: 66.2,
            unemploymentRatePct: 10.2,
          },
          foreigners: {
            employedThousands: 4700.0,
            shareOfEmployedPct: 22.1,
            activityRatePct: 77.6,
            employmentRatePct: 65.6,
            unemploymentRatePct: 15.4,
          },
        },
      },
    },
    livingConditions: {
      total: {
        medianEquivalisedIncomeEur: 19800.0,
        meanEquivalisedIncomeEur: 22300.0,
        atRiskOfPovertyPct: 17.8,
      },
      nationals: {
        medianEquivalisedIncomeEur: 20400.0,
        meanEquivalisedIncomeEur: 23000.0,
        atRiskOfPovertyPct: 14.7,
      },
      foreigners: {
        medianEquivalisedIncomeEur: 13800.0,
        meanEquivalisedIncomeEur: 15900.0,
        atRiskOfPovertyPct: 34.0,
      },
    },
  },
];

describe("Nationality Selectors & Math", () => {
  it("getAvailableYears returns sorted years", () => {
    const years = getAvailableYears(mockRecords);
    expect(years).toEqual(["2023", "2024"]);
  });

  it("getLatestCompleteYear returns latest complete year", () => {
    const latest = getLatestCompleteYear(mockRecords, "citizenship");
    expect(latest).toBe("2024");
  });

  it("getHeadlineKpis calculates YoY delta properly for 2024", () => {
    const kpis = getHeadlineKpis(mockRecords, "2024", "citizenship", "es");
    // Pop: 13.4% vs 12.5% in 2023 = +0,90 pp
    expect(kpis.popKpi.foreignValue).toBe("13,4%");
    expect(kpis.popKpi.yoyDelta).toBe("+0,90 pp");

    // Working age: 83.1% vs 81.7% in 2023 = +1,4 pp
    expect(kpis.workingAgeKpi.foreignValue).toBe("83,1%");
    expect(kpis.workingAgeKpi.yoyDelta).toBe("+1,4 pp");

    // Employment rate: 62.3% vs 62.0% in 2023 = +0,3 pp
    expect(kpis.employmentKpi.foreignValue).toBe("62,3%");
    expect(kpis.employmentKpi.yoyDelta).toBe("+0,3 pp");

    // Median income: 13.800 € vs 13.500 € = +300 €
    expect(kpis.incomeKpi.foreignValue).toBe("13.800 €");
    expect(kpis.incomeKpi.yoyDelta).toBe("+300 €");
    expect(kpis.incomeKpi.notice).toBeUndefined();
  });

  it("getHeadlineKpis handles birthplace definition and notice", () => {
    const kpis = getHeadlineKpis(mockRecords, "2024", "birthplace", "es");
    expect(kpis.popKpi.foreignValue).toBe("18,1%");
    expect(kpis.incomeKpi.notice).toBe("ECV oficial por pasaporte");
  });

  it("getHeadlineKpis handles missing previous year gracefully without NaN", () => {
    const kpisFirstYear = getHeadlineKpis(mockRecords, "2023", "citizenship", "es");
    expect(kpisFirstYear.popKpi.yoyDelta).toBeNull();
    expect(kpisFirstYear.employmentKpi.yoyDelta).toBeNull();
    expect(kpisFirstYear.incomeKpi.yoyDelta).toBeNull();
  });

  it("buildRepresentationComparison returns 3 share rows without NaN", () => {
    const comp = buildRepresentationComparison(mockRecords[1], "citizenship");
    expect(comp.length).toBe(3);
    expect(comp[0].labelKey).toBe("totalPopulation");
    expect(comp[0].foreignSharePct).toBe(13.4);
    expect(comp[1].labelKey).toBe("workingAgeShare");
    expect(comp[1].foreignSharePct).toBe(16.8);
    expect(comp[2].labelKey).toBe("employedShare");
    expect(comp[2].foreignSharePct).toBe(15.0);
  });

  it("buildLaborTimeSeries formats chart rows and handles EU split", () => {
    const seriesWithEu = buildLaborTimeSeries(mockRecords, "citizenship", "employmentRatePct", true);
    expect(seriesWithEu.length).toBe(2);
    expect(seriesWithEu[1].foreigners).toBe(62.3);
    expect(seriesWithEu[1].nationals).toBe(66.8);
    expect(seriesWithEu[1].euForeigners).toBe(69.5);
    expect(seriesWithEu[1].nonEuForeigners).toBe(59.9);

    const seriesWithoutEu = buildLaborTimeSeries(mockRecords, "citizenship", "employmentRatePct", false);
    expect(seriesWithoutEu[1].euForeigners).toBeUndefined();
  });

  it("buildNaturalizationsSeries calculates cumulative sum", () => {
    const natSeries = buildNaturalizationsSeries(mockRecords);
    expect(natSeries.length).toBe(2);
    expect(natSeries[0].cumulativeSinceStart).toBe(240000);
    expect(natSeries[1].cumulativeSinceStart).toBe(490000);
  });

  it("buildLivingConditionsSeries calculates income ratio", () => {
    const livSeries = buildLivingConditionsSeries(mockRecords, "medianEquivalisedIncomeEur", false);
    expect(livSeries.length).toBe(2);
    // 2024: (13800 / 20400) * 100 = 67.6%
    expect(livSeries[1].ratioPct).toBe(67.6);
  });

  it("pure formatting functions format correctly", () => {
    expect(formatHeadcount(6502282, "es")).toBe("6,50 M");
    expect(formatHeadcount(6502282, "en")).toBe("6.50 M");
    expect(formatPercent(13.4, 1, "es")).toBe("13,4%");
    expect(formatPercent(13.4, 1, "en")).toBe("13.4%");
    expect(formatCurrencyEur(13800, "es")).toBe("13.800 €");
    expect(formatDelta(1.4, "pp", 1, "es")).toBe("+1,4 pp");
    expect(formatDelta(-0.5, "pp", 1, "es")).toBe("-0,5 pp");
  });
});
