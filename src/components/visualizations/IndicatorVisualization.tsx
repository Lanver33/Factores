"use client";

import dynamic from "next/dynamic";
import type { Indicator, Locale } from "@/domain/indicator.schema";
import { ChartSkeleton } from "./ChartSkeleton";

const TimeSeriesChart = dynamic(() => import("./TimeSeriesChart"), {
  loading: () => <ChartSkeleton />,
});
const FiscalBalanceDashboard = dynamic(() => import("./FiscalBalanceDashboard"), {
  loading: () => <ChartSkeleton />,
});
const ImmigrationExplorer = dynamic(() => import("./immigration/ImmigrationExplorer"), {
  loading: () => <ChartSkeleton />,
});

export function IndicatorVisualization({
  indicator,
  locale,
}: {
  indicator: Indicator;
  locale: Locale;
}) {
  switch (indicator.kind) {
    case "time-series":
      return <TimeSeriesChart indicator={indicator} locale={locale} />;
    case "fiscal-balance":
      return <FiscalBalanceDashboard indicator={indicator} locale={locale} />;
    case "immigration-flow":
      return <ImmigrationExplorer indicator={indicator} locale={locale} />;
    default: {
      const _exhaustive: never = indicator;
      return _exhaustive;
    }
  }
}
