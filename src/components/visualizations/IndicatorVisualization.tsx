"use client";

import dynamic from "next/dynamic";
import type { Indicator, Locale } from "@/domain/indicator.schema";
import { isFiscalBalanceItem, isNationalityIndicatorsItem } from "@/types";
import { ChartSkeleton } from "./ChartSkeleton";

const TimeSeriesChart = dynamic(() => import("./TimeSeriesChart"), {
  loading: () => <ChartSkeleton />,
});
const FiscalBalanceDashboard = dynamic(() => import("./FiscalBalanceDashboard"), {
  loading: () => <ChartSkeleton />,
});
const FiscalBalanceView = dynamic(() => import("../detail/fiscal/FiscalBalanceView"), {
  loading: () => <ChartSkeleton />,
});
const NationalityIndicatorsView = dynamic(() => import("../detail/nationality/NationalityIndicatorsView"), {
  loading: () => <ChartSkeleton />,
});
const ImmigrationExplorer = dynamic(() => import("./immigration/ImmigrationExplorer"), {
  loading: () => <ChartSkeleton />,
});

export function IndicatorVisualization({
  indicator,
  locale,
}: {
  indicator: Indicator | any;
  locale: Locale;
}) {
  if (isFiscalBalanceItem(indicator as any) || (indicator && "annualBalances" in indicator)) {
    return <FiscalBalanceView item={indicator as any} lang={locale} locale={locale} />;
  }

  if (
    isNationalityIndicatorsItem(indicator as any) ||
    indicator?.kind === "nationality-indicators" ||
    indicator?.chartType === "nationality-indicators" ||
    (indicator && "annualRecords" in indicator)
  ) {
    return <NationalityIndicatorsView item={indicator as any} lang={locale} locale={locale} />;
  }

  switch (indicator.kind) {
    case "time-series":
      return <TimeSeriesChart indicator={indicator} locale={locale} />;
    case "fiscal-balance":
      return <FiscalBalanceDashboard indicator={indicator} locale={locale} />;
    case "immigration-flow":
      return <ImmigrationExplorer indicator={indicator} locale={locale} />;
    default: {
      return <TimeSeriesChart indicator={indicator} locale={locale} />;
    }
  }
}
