import { z } from "zod";

export const HttpUrlSchema = z
  .string()
  .url()
  .refine((u) => u.startsWith("https://") || u.startsWith("http://"), {
    message: "Only http(s) URLs are allowed",
  });

export const LocalizedTextSchema = z.object({
  es: z.string().min(1),
  en: z.string().min(1),
});

export const SourceSchema = z.object({
  institution: LocalizedTextSchema,
  title: LocalizedTextSchema,
  shortName: LocalizedTextSchema.optional(),
  tableId: z.string().optional(),
  period: z.string().optional(),
  lastUpdated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  url: HttpUrlSchema,
});

export const CategorySchema = z.enum([
  "housing",
  "economy-employment",
  "healthcare",
  "pensions-demography",
]);
export type Category = z.infer<typeof CategorySchema>;

export const ValueFormatSchema = z.enum([
  "number",
  "percent",
  "currency-eur",
  "currency-mmeur",
]);
export type ValueFormat = z.infer<typeof ValueFormatSchema>;

export const ConceptGuideSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().min(1),
  quickKeys: z.array(
    z.object({
      id: z.string(),
      badge: z.string(),
      title: z.string(),
      summary: z.string(),
      example: z.string().optional(),
    })
  ),
  categories: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
    })
  ),
  terms: z.array(
    z.object({
      code: z.string(),
      displayCode: z.string(),
      categoryId: z.string(),
      title: z.string(),
      shortDefinition: z.string(),
      explanation: z.string(),
      keyNote: z.string().optional(),
      relatedCodes: z.array(z.string()).optional(),
    })
  ),
});

export const BaseIndicatorSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  category: CategorySchema,
  question: LocalizedTextSchema,
  unit: LocalizedTextSchema,
  valueFormat: ValueFormatSchema,
  contextNotes: z.object({
    es: z.array(z.string().min(1)),
    en: z.array(z.string().min(1)),
  }),
  conceptGuide: ConceptGuideSchema.optional(),
  sources: z.array(SourceSchema).min(1),
  lastUpdated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const TimeSeriesIndicatorSchema = BaseIndicatorSchema.extend({
  kind: z.literal("time-series"),
  chartStyle: z.enum(["line", "bar"]),
  points: z.array(z.object({ period: z.string(), value: z.number() })).min(1),
});

export const FiscalBalanceIndicatorSchema = BaseIndicatorSchema.extend({
  kind: z.literal("fiscal-balance"),
  availableUnits: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        decimals: z.number().optional(),
      })
    )
    .optional(),
  taxonomy: z
    .object({
      revenues: z.array(z.any()),
      expenditures: z.array(z.any()),
    })
    .optional(),
  annualBalances: z.array(z.any()).optional(),
  points: z
    .array(
      z.object({
        year: z.string(),
        ratio: z.object({ foreign: z.number(), spanish: z.number() }),
        perCapitaEur: z.object({ foreign: z.number(), spanish: z.number() }),
        stateRevenueMmEur: z.record(z.string(), z.number()),
        stateSpendingMmEur: z.record(z.string(), z.number()),
        totalRevenueMmEur: z.number(),
        totalSpendingMmEur: z.number(),
        deficitMmEur: z.number(),
      })
    )
    .optional(),
});

export const ImmigrationFlowIndicatorSchema = BaseIndicatorSchema.extend({
  kind: z.literal("immigration-flow"),
  years: z
    .array(
      z.object({
        year: z.string(),
        declaredTotal: z.number().nonnegative(),
        byCountryIso2: z.record(z.string().length(2), z.number().nonnegative()),
        residualByRegion: z.record(z.string(), z.number().nonnegative()),
      })
    )
    .min(1),
});

// Discriminated union by visualization kind
export const IndicatorSchema = z.discriminatedUnion("kind", [
  TimeSeriesIndicatorSchema,
  FiscalBalanceIndicatorSchema,
  ImmigrationFlowIndicatorSchema,
]);

export type Indicator = z.infer<typeof IndicatorSchema>;
export type TimeSeriesIndicator = z.infer<typeof TimeSeriesIndicatorSchema>;
export type FiscalBalanceIndicator = z.infer<typeof FiscalBalanceIndicatorSchema>;
export type ImmigrationFlowIndicator = z.infer<typeof ImmigrationFlowIndicatorSchema>;

export type Locale = "es" | "en";

export interface DirectoryIndexItem {
  id: string;
  kind: Indicator["kind"];
  category: Category;
  question: { es: string; en: string };
  unit: { es: string; en: string };
  valueFormat: ValueFormat;
  latestValue: number;
  latestPeriod: string;
  timeHorizon: string;
  primarySource: { es: string; en: string };
  searchSummary: { es: string; en: string };
  sparkline: number[];
}
