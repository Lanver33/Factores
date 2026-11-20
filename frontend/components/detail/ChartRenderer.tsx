"use client";

import dynamic from "next/dynamic";
import type { DatoItem, Lang } from "@/lib/types";
import { isFiscalBalanceItem, isNationalityIndicatorsItem } from "@/lib/types";
import { ChartSkeleton } from "@/components/visualizations/ChartSkeleton";
import InteractiveChart from "./InteractiveChart";

const FiscalBalanceView = dynamic(
  () => import("./fiscal/FiscalBalanceView"),
  { loading: () => <ChartSkeleton /> }
);

const NationalityIndicatorsView = dynamic(
  () => import("./nationality/NationalityIndicatorsView"),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

const AdminRegistersChart = dynamic(
  () => import("./admin-registers/AdminRegistersChart"),
  { loading: () => <ChartSkeleton /> }
);

const ImmigrationExplorer = dynamic(
  () => import("@/components/visualizations/immigration/ImmigrationExplorer"),
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

  if (item?.kind === "admin-registers-nationality") {
    return <AdminRegistersChart records={item.annualRecords || []} lang={activeLang} />;
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
