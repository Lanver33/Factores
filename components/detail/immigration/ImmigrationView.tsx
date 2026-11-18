"use client";

import { useState, useMemo, useEffect } from "react";
import { ImmigrationItem } from "./utils";
import WebGisChronoArcs from "./WebGisChronoArcs";
import TimelineScrubber from "./TimelineScrubber";
import ConcentricSunburstRanking from "./ConcentricSunburstRanking";

interface ImmigrationViewProps {
  item: ImmigrationItem;
}

export default function ImmigrationView({ item }: ImmigrationViewProps) {
  const years = useMemo(() => item.annualBlocks.map((d) => d.year), [item]);

  // Timeline scrubber state
  const [selectedYear, setSelectedYear] = useState<string>(
    years[years.length - 1] || "2024"
  );
  const [yearRange, setYearRange] = useState<[string, string]>([
    years[Math.max(0, years.length - 5)] || "2019",
    years[years.length - 1] || "2024",
  ]);
  const [mode, setMode] = useState<"single" | "range">("single");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Filtering & Interaction state
  const [hoveredCountryId, setHoveredCountryId] = useState<string | null>(null);
  const [pinnedCountryId, setPinnedCountryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedBlockFilter, setSelectedBlockFilter] = useState<string>("");
  const [minVolumeThreshold, setMinVolumeThreshold] = useState<number>(0);

  // Playback timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isPlaying && mode === "single") {
      timer = setInterval(() => {
        setSelectedYear((prev) => {
          const currentIdx = years.indexOf(prev);
          if (currentIdx >= years.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return years[currentIdx + 1];
        });
      }, 900);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, mode, years]);

  // Active data calculation for single year OR multi-year cumulative range
  const { activeDataMap, totalArrivals, timeframeLabel } = useMemo(() => {
    const dataMap: Record<string, number> = {};
    let total = 0;
    let label = "";

    if (mode === "single") {
      label = `Año ${selectedYear}`;
      const ab = item.annualBlocks.find((d) => d.year === selectedYear);
      if (ab) {
        total = ab.total;
        Object.values(ab.blocks).forEach((bData) => {
          Object.entries(bData.countries).forEach(([cId, vol]) => {
            dataMap[cId] = (dataMap[cId] || 0) + vol;
          });
        });
      }
    } else {
      label = `Rango ${yearRange[0]}–${yearRange[1]}`;
      const startIdx = years.indexOf(yearRange[0]);
      const endIdx = years.indexOf(yearRange[1]);

      item.annualBlocks.forEach((ab) => {
        const yIdx = years.indexOf(ab.year);
        if (yIdx >= startIdx && yIdx <= endIdx) {
          total += ab.total;
          Object.values(ab.blocks).forEach((bData) => {
            Object.entries(bData.countries).forEach(([cId, vol]) => {
              dataMap[cId] = (dataMap[cId] || 0) + vol;
            });
          });
        }
      });
    }

    return { activeDataMap: dataMap, totalArrivals: total, timeframeLabel: label };
  }, [item, mode, selectedYear, yearRange, years]);

  return (
    <div className="space-y-6">
      {/* 1. Map Canvas (Full width, no side drawer) */}
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

      {/* 2. Concentric Sunburst Ranking Component (Full width, no side drawer) */}
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

      {/* Bottom Timeline Scrubber */}
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
    </div>
  );
}
