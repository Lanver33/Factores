"use client";

import dynamic from "next/dynamic";
import type { DatoItem, Lang } from "@/types";
import { isFiscalBalanceItem, isNationalityIndicatorsItem } from "@/types";
import { ChartSkeleton } from "@/src/components/visualizations/ChartSkeleton";
import InteractiveChart from "./InteractiveChart";

const FiscalBalanceView = dynamic(
  () => import("./fiscal/FiscalBalanceView"),
  { loading: () => <ChartSkeleton /> }
);

const NationalityIndicatorsView = dynamic(
  () => import("./nationality/NationalityIndicatorsView"),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

const ImmigrationExplorer = dynamic(
  () => import("@/src/components/visualizations/immigration/ImmigrationExplorer"),
  { loading: () => <ChartSkeleton /> }
);

interface ChartRendererProps {
  item: DatoItem | any;
  lang?: Lang;
  locale?: Lang;
}

export function ChartRenderer({ item, lang, locale = "es" }: ChartRendererProps) {
  const activeLang = lang || locale || "es";

  if (isFiscalBalanceItem(item)) {
    return <FiscalBalanceView item={item} lang={activeLang} locale={activeLang} />;
  }

  if (isNationalityIndicatorsItem(item)) {
    return <NationalityIndicatorsView item={item} lang={activeLang} locale={activeLang} />;
  }

  if (item.chartType === "immigration-flow" || "annualBlocks" in item || "blocks" in item) {
    return <ImmigrationExplorer indicator={item} locale={activeLang} />;
  }

  return <InteractiveChart item={item} lang={activeLang} locale={activeLang} />;
}

export default ChartRenderer;
