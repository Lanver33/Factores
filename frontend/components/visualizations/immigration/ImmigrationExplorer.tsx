"use client";

import { useState, useMemo, useEffect } from "react";
import type { ImmigrationFlowIndicator, Locale } from "@/lib/types";
import TimelineScrubber from "./TimelineScrubber";
import ChoroplethMap from "./ChoroplethMap";
import ContinentCountrySplitView from "./ContinentCountrySplitView";
import { t } from "@/lib/i18n";

interface ImmigrationExplorerProps {
  indicator: ImmigrationFlowIndicator;
  locale: Locale;
}

const PLAYBACK_INTERVAL_MS = 1000;

export default function ImmigrationExplorer({
  indicator,
  locale,
}: ImmigrationExplorerProps) {
  const { years } = indicator;
  const yearStrings = useMemo(() => years.map((y) => y.year), [years]);

  const maxIndex = Math.max(0, years.length - 1);
  const defaultRangeStartIndex = Math.max(0, years.length - 5);

  const [currentIndex, setCurrentIndex] = useState<number>(maxIndex);
  const [rangeIndices, setRangeIndices] = useState<[number, number]>([
    defaultRangeStartIndex,
    maxIndex,
  ]);
  const [mode, setMode] = useState<"single" | "range">("single");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const [hoveredIso2, setHoveredIso2] = useState<string | null>(null);
  const [pinnedIso2, setPinnedIso2] = useState<string | null>(null);

  // Playback timer
  useEffect(() => {
    if (!isPlaying || mode !== "single") return;

    if (currentIndex >= maxIndex) {
      setIsPlaying(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setCurrentIndex((prev) => {
        if (prev >= maxIndex - 1) {
          setIsPlaying(false);
          return maxIndex;
        }
        return prev + 1;
      });
    }, PLAYBACK_INTERVAL_MS);

    return () => window.clearTimeout(timer);
  }, [isPlaying, mode, currentIndex, maxIndex]);

  // Aggregate metrics based on mode
  const {
    volumeByCountryIso2,
    residualByRegion,
    totalArrivals,
    timeframeLabel,
  } = useMemo(() => {
    const byCountry: Record<string, number> = {};
    const byRegion: Record<string, number> = {};
    let total = 0;

    let targetYears: typeof years = [];

    if (mode === "single") {
      const singleYear = years[currentIndex];
      targetYears = singleYear ? [singleYear] : [];
    } else {
      const [start, end] = rangeIndices;
      targetYears = years.slice(Math.min(start, end), Math.max(start, end) + 1);
    }

    for (const y of targetYears) {
      total += y.declaredTotal;
      for (const [iso, val] of Object.entries(y.byCountryIso2)) {
        byCountry[iso] = (byCountry[iso] ?? 0) + val;
      }
      for (const [rId, val] of Object.entries(y.residualByRegion)) {
        byRegion[rId] = (byRegion[rId] ?? 0) + val;
      }
    }

    const label =
      mode === "single"
        ? `${t("yearLabel", locale)} ${yearStrings[currentIndex] ?? ""}`
        : `${yearStrings[rangeIndices[0]] ?? ""}–${yearStrings[rangeIndices[1]] ?? ""}`;

    return {
      volumeByCountryIso2: byCountry,
      residualByRegion: byRegion,
      totalArrivals: total,
      timeframeLabel: label,
    };
  }, [years, mode, currentIndex, rangeIndices, yearStrings, locale]);

  return (
    <div className="space-y-6">
      {/* 1. Top Timeline Scrubber */}
      <TimelineScrubber
        years={yearStrings}
        currentIndex={currentIndex}
        onIndexChange={setCurrentIndex}
        rangeIndices={rangeIndices}
        onRangeChange={setRangeIndices}
        mode={mode}
        onModeChange={setMode}
        isPlaying={isPlaying}
        onPlayPause={setIsPlaying}
        locale={locale}
      />

      {/* 2. Interactive Natural Earth Choropleth Map */}
      <ChoroplethMap
        timeframeLabel={timeframeLabel}
        volumeByCountryIso2={volumeByCountryIso2}
        totalVolume={totalArrivals}
        hoveredIso2={hoveredIso2}
        onHoverIso2={setHoveredIso2}
        pinnedIso2={pinnedIso2}
        onPinIso2={setPinnedIso2}
        locale={locale}
      />

      {/* 3. Continent Donut & Country Ranking Split View */}
      <ContinentCountrySplitView
        volumeByCountryIso2={volumeByCountryIso2}
        residualByRegion={residualByRegion}
        totalArrivals={totalArrivals}
        hoveredIso2={hoveredIso2}
        onHoverIso2={setHoveredIso2}
        pinnedIso2={pinnedIso2}
        onPinIso2={setPinnedIso2}
        selectedTimeframeLabel={timeframeLabel}
        locale={locale}
      />
    </div>
  );
}
