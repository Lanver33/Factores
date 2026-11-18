"use client";

import { useState, useMemo, useEffect } from "react";
import { ImmigrationItem, AnnualBlock } from "@/types";
import WebGisChronoArcs from "./WebGisChronoArcs";
import TimelineScrubber from "./TimelineScrubber";
import ConcentricSunburstRanking from "./ConcentricSunburstRanking";
import SourceCard from "@/components/detail/SourceCard";

type TimeframeMode = "single" | "range";
type YearRange = [string, string];

const PLAYBACK_INTERVAL_MS = 900;
const DEFAULT_FALLBACK_END_YEAR = "2024";
const DEFAULT_FALLBACK_START_YEAR = "2019";
const DEFAULT_RANGE_SPAN = 5;

interface ImmigrationViewProps {
  item: ImmigrationItem;
}

interface AggregatedMetrics {
  activeDataMap: Record<string, number>;
  totalArrivals: number;
  timeframeLabel: string;
}

function aggregateAnnualBlocks(blocks: AnnualBlock[]): {
  dataMap: Record<string, number>;
  total: number;
} {
  const dataMap: Record<string, number> = {};
  let total = 0;

  for (const annualBlock of blocks) {
    total += annualBlock.total;
    for (const regionalBlock of Object.values(annualBlock.blocks)) {
      for (const [countryId, volume] of Object.entries(regionalBlock.countries)) {
        dataMap[countryId] = (dataMap[countryId] ?? 0) + volume;
      }
    }
  }

  return { dataMap, total };
}

export default function ImmigrationView({ item }: ImmigrationViewProps) {
  const years = useMemo(
    () => item.annualBlocks.map((block) => block.year),
    [item.annualBlocks]
  );

  const latestYear = years.at(-1) ?? DEFAULT_FALLBACK_END_YEAR;
  const defaultRangeStart =
    years[Math.max(0, years.length - DEFAULT_RANGE_SPAN)] ?? DEFAULT_FALLBACK_START_YEAR;

  const [selectedYear, setSelectedYear] = useState<string>(latestYear);
  const [yearRange, setYearRange] = useState<YearRange>([defaultRangeStart, latestYear]);
  const [mode, setMode] = useState<TimeframeMode>("single");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const [hoveredCountryId, setHoveredCountryId] = useState<string | null>(null);
  const [pinnedCountryId, setPinnedCountryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedBlockFilter, setSelectedBlockFilter] = useState<string>("");
  const [minVolumeThreshold, setMinVolumeThreshold] = useState<number>(0);

  // Stop playback when reaching the end of the timeline without triggering impure state updates inside setSelectedYear
  useEffect(() => {
    if (!isPlaying || mode !== "single") return;

    const currentIdx = years.indexOf(selectedYear);
    if (currentIdx === -1 || currentIdx >= years.length - 1) {
      setIsPlaying(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setSelectedYear(years[currentIdx + 1]);
    }, PLAYBACK_INTERVAL_MS);

    return () => window.clearTimeout(timer);
  }, [isPlaying, mode, selectedYear, years]);

  const { activeDataMap, totalArrivals, timeframeLabel } = useMemo<AggregatedMetrics>(() => {
    if (mode === "single") {
      const targetBlock = item.annualBlocks.find((d) => d.year === selectedYear);
      const { dataMap, total } = aggregateAnnualBlocks(targetBlock ? [targetBlock] : []);
      return {
        activeDataMap: dataMap,
        totalArrivals: total,
        timeframeLabel: `Año ${selectedYear}`,
      };
    }

    const startIdx = years.indexOf(yearRange[0]);
    const endIdx = years.indexOf(yearRange[1]);

    const matchingBlocks =
      startIdx !== -1 && endIdx !== -1
        ? item.annualBlocks.filter((ab) => {
            const yIdx = years.indexOf(ab.year);
            return yIdx >= Math.min(startIdx, endIdx) && yIdx <= Math.max(startIdx, endIdx);
          })
        : [];

    const { dataMap, total } = aggregateAnnualBlocks(matchingBlocks);

    return {
      activeDataMap: dataMap,
      totalArrivals: total,
      timeframeLabel: `Rango ${yearRange[0]}–${yearRange[1]}`,
    };
  }, [item.annualBlocks, mode, selectedYear, yearRange, years]);

  const hasSources = Boolean(item.sources?.length || item.source);

  return (
    <div className="space-y-6">
      {/* Top Timeline Scrubber (Placed right at the top) */}
      <TimelineScrubber
        years={years}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        yearRange={yearRange}
        setYearRange={setYearRange}
        mode={mode}
        setMode={setMode}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
      />

      {/* 1. Map Canvas */}
      <div className="w-full">
        <WebGisChronoArcs
          timeframeLabel={timeframeLabel}
          activeDataMap={activeDataMap}
          totalArrivals={totalArrivals}
          hoveredCountryId={hoveredCountryId}
          setHoveredCountryId={setHoveredCountryId}
          pinnedCountryId={pinnedCountryId}
          setPinnedCountryId={setPinnedCountryId}
          searchQuery={searchQuery}
          selectedBlockFilter={selectedBlockFilter}
          minVolumeThreshold={minVolumeThreshold}
        />
      </div>

      {/* 2. Concentric Sunburst Ranking Component */}
      <ConcentricSunburstRanking
        item={item}
        activeDataMap={activeDataMap}
        totalArrivals={totalArrivals}
        pinnedCountryId={pinnedCountryId}
        setPinnedCountryId={setPinnedCountryId}
        hoveredCountryId={hoveredCountryId}
        setHoveredCountryId={setHoveredCountryId}
        selectedTimeframeLabel={timeframeLabel}
      />

      {/* 3. Trazabilidad y Fuentes por tramos */}
      {hasSources && (
        <section>
          <SourceCard
            sources={item.sources}
            source={item.source}
          />
        </section>
      )}
    </div>
  );
}
