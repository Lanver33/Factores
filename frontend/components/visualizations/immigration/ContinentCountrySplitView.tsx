"use client";

import { useState, useMemo } from "react";
import type { Locale } from "@/lib/types";
import {
  REGIONS,
  COUNTRIES,
  getCountryName,
  getRegionName,
  type RegionId,
} from "@/lib/geography";
import { formatNumber, formatPercent } from "@/lib/format";
import { t } from "@/lib/i18n";
import { Search, ChevronDown, ChevronUp } from "lucide-react";

interface ContinentCountrySplitViewProps {
  volumeByCountryIso2: Record<string, number>;
  residualByRegion: Record<string, number>;
  totalArrivals: number;
  hoveredIso2: string | null;
  onHoverIso2: (iso: string | null) => void;
  pinnedIso2: string | null;
  onPinIso2: (iso: string | null) => void;
  selectedTimeframeLabel: string;
  locale: Locale;
}

export default function ContinentCountrySplitView({
  volumeByCountryIso2,
  residualByRegion,
  totalArrivals,
  hoveredIso2,
  onHoverIso2,
  pinnedIso2,
  onPinIso2,
  selectedTimeframeLabel,
  locale,
}: ContinentCountrySplitViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<RegionId | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Continent Totals
  const continentTotals = useMemo(() => {
    const totals: Record<RegionId, number> = {
      "america-hispanohablante": 0,
      "america-no-hispanohablante": 0,
      europa: 0,
      africa: 0,
      asia: 0,
      oceania: 0,
    };

    // Country volumes
    for (const [iso, val] of Object.entries(volumeByCountryIso2)) {
      const meta = COUNTRIES[iso];
      if (meta && meta.region) {
        totals[meta.region] += val;
      }
    }

    // Residual regional volumes
    for (const [rId, val] of Object.entries(residualByRegion)) {
      if (rId in totals) {
        totals[rId as RegionId] += val;
      }
    }

    return totals;
  }, [volumeByCountryIso2, residualByRegion]);

  // Country Ranking List
  const countryList = useMemo(() => {
    return Object.entries(volumeByCountryIso2)
      .map(([iso, volume]) => ({
        iso,
        name: getCountryName(iso, locale),
        region: COUNTRIES[iso]?.region ?? ("europa" as RegionId),
        volume,
        pct: totalArrivals > 0 ? (volume / totalArrivals) * 100 : 0,
      }))
      .filter((c) => c.volume > 0)
      .sort((a, b) => b.volume - a.volume);
  }, [volumeByCountryIso2, totalArrivals, locale]);

  // Filtered Country List
  const filteredCountries = useMemo(() => {
    return countryList.filter((c) => {
      if (selectedRegionFilter && c.region !== selectedRegionFilter) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase().trim();
      return c.name.toLowerCase().includes(q) || c.iso.toLowerCase().includes(q);
    });
  }, [countryList, selectedRegionFilter, searchQuery]);

  const displayedCountries = isExpanded ? filteredCountries : filteredCountries.slice(0, 10);
  const activeSelectedIso = pinnedIso2 || hoveredIso2;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
      {/* Left Column: Continent Breakdown */}
      <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            {t("continentBreakdown", locale)}
          </h3>
          <span className="text-[11px] font-mono text-slate-400">
            {formatNumber(totalArrivals, locale)} {t("people", locale)}
          </span>
        </div>

        <div className="space-y-3">
          {(Object.keys(REGIONS) as RegionId[]).map((rId) => {
            const reg = REGIONS[rId];
            const volume = continentTotals[rId] ?? 0;
            const pct = totalArrivals > 0 ? (volume / totalArrivals) * 100 : 0;
            const isFilterActive = selectedRegionFilter === rId;

            return (
              <button
                type="button"
                key={rId}
                onClick={() => setSelectedRegionFilter(isFilterActive ? null : rId)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  isFilterActive
                    ? "bg-slate-800 border-blue-500/80 shadow-md ring-1 ring-blue-500/50"
                    : "bg-slate-950/50 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: reg.color }}
                    />
                    <span className="text-white">{reg.name[locale]}</span>
                  </div>
                  <span className="text-slate-300 font-mono">
                    {formatPercent(pct, locale, 1)}
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, Math.max(0, pct))}%`,
                      backgroundColor: reg.color,
                    }}
                  />
                </div>
                <div className="text-[11px] text-slate-400 mt-1 font-mono">
                  {formatNumber(volume, locale)} {t("people", locale)}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Column: Country Detailed Ranking */}
      <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {t("originRankingTitle", locale)}
            </h3>
            <span className="text-[11px] text-slate-400">{selectedTimeframeLabel}</span>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("searchCountryPlaceholder", locale)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Countries Ranking Table/List */}
        <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
          {displayedCountries.map((c, idx) => {
            const isHovered = activeSelectedIso === c.iso;
            const regionMeta = REGIONS[c.region];

            return (
              <div
                key={c.iso}
                onMouseEnter={() => onHoverIso2(c.iso)}
                onMouseLeave={() => onHoverIso2(null)}
                onClick={() => onPinIso2(pinnedIso2 === c.iso ? null : c.iso)}
                className={`p-2.5 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-all ${
                  isHovered
                    ? "bg-blue-600/20 border-blue-500 text-white shadow-md ring-1 ring-blue-500/50"
                    : "bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-300"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-[10px] font-mono text-slate-500 w-5 text-right shrink-0">
                    {idx + 1}
                  </span>
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: regionMeta?.color ?? "#94a3b8" }}
                  />
                  <span className="font-semibold text-white truncate">{c.name}</span>
                  <span className="text-[10px] font-mono text-slate-400 uppercase bg-slate-800 px-1.5 py-0.5 rounded shrink-0">
                    {c.iso}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0 font-mono text-right">
                  <span className="text-white font-bold">{formatNumber(c.volume, locale)}</span>
                  <span className="text-slate-400 text-[11px] w-12">
                    {formatPercent(c.pct, locale, 1)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {filteredCountries.length > 10 && (
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
            >
              <span>{isExpanded ? t("collapse", locale) : t("showMore", locale)}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
