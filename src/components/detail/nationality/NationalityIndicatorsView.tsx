"use client";

import React, { useState } from "react";
import type { NationalityIndicatorsItem, PopulationDefinition, Lang } from "@/types";
import { getLatestCompleteYear } from "./nationalitySelectors";
import NationalityControlBar from "./NationalityControlBar";
import DemographicStructureView from "./DemographicStructureView";
import LaborMarketComparisonChart from "./LaborMarketComparisonChart";
import IncomeAndConditionsPanel from "./IncomeAndConditionsPanel";

interface NationalityIndicatorsViewProps {
  item: NationalityIndicatorsItem;
  lang?: Lang;
  locale?: Lang;
}

export function NationalityIndicatorsView({
  item,
  lang,
  locale = "es",
}: NationalityIndicatorsViewProps) {
  const activeLang = lang || locale || "es";
  const records = item.annualRecords || [];

  const [definition, setDefinition] = useState<PopulationDefinition>("citizenship");
  const [selectedYear, setSelectedYear] = useState<string>(() =>
    getLatestCompleteYear(records, "citizenship")
  );

  return (
    <div className="space-y-6">
      {/* Layer 0: Control Bar & KPI Summary */}
      <NationalityControlBar
        records={records}
        selectedYear={selectedYear}
        onSelectYear={setSelectedYear}
        definition={definition}
        onSelectDefinition={setDefinition}
        lang={activeLang}
      />

      {/* Layer 1: Demographic Structure & Representation */}
      <DemographicStructureView
        records={records}
        selectedYear={selectedYear}
        onSelectYear={setSelectedYear}
        definition={definition}
        lang={activeLang}
      />

      {/* Layer 2: Labor Market Historical Comparison */}
      <LaborMarketComparisonChart
        records={records}
        selectedYear={selectedYear}
        onSelectYear={setSelectedYear}
        definition={definition}
        lang={activeLang}
      />

      {/* Layer 3: Equivalised Net Income & Living Conditions */}
      <IncomeAndConditionsPanel
        records={records}
        selectedYear={selectedYear}
        onSelectYear={setSelectedYear}
        definition={definition}
        lang={activeLang}
      />
    </div>
  );
}

export default NationalityIndicatorsView;
