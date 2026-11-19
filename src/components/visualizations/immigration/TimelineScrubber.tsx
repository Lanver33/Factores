"use client";

import { Play, Pause, ChevronLeft, ChevronRight, Calendar, Layers } from "lucide-react";
import type { Locale } from "@/domain/indicator.schema";
import { t } from "@/lib/i18n";

interface TimelineScrubberProps {
  years: string[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  rangeIndices: [number, number];
  onRangeChange: (indices: [number, number]) => void;
  mode: "single" | "range";
  onModeChange: (mode: "single" | "range") => void;
  isPlaying: boolean;
  onPlayPause: (playing: boolean) => void;
  locale: Locale;
}

export default function TimelineScrubber({
  years,
  currentIndex,
  onIndexChange,
  rangeIndices,
  onRangeChange,
  mode,
  onModeChange,
  isPlaying,
  onPlayPause,
  locale,
}: TimelineScrubberProps) {
  const maxIdx = Math.max(0, years.length - 1);
  const activeYear = years[currentIndex] ?? years[0] ?? "";
  const startYear = years[rangeIndices[0]] ?? years[0] ?? "";
  const endYear = years[rangeIndices[1]] ?? years[maxIdx] ?? "";

  const handleStepPrev = () => {
    onPlayPause(false);
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1);
    }
  };

  const handleStepNext = () => {
    onPlayPause(false);
    if (currentIndex < maxIdx) {
      onIndexChange(currentIndex + 1);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 text-white shadow-xl space-y-4">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Playback Controls & Mode Switcher */}
        <div className="flex items-center gap-3">
          {/* Step Prev */}
          <button
            type="button"
            onClick={handleStepPrev}
            disabled={currentIndex <= 0}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-40 flex items-center justify-center transition-colors"
            title={t("previousYear", locale)}
            aria-label={t("previousYear", locale)}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Play / Pause */}
          <button
            type="button"
            onClick={() => onPlayPause(!isPlaying)}
            className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg transition-all active:scale-95"
            title={isPlaying ? t("pauseAnimation", locale) : t("playChronology", locale)}
            aria-label={isPlaying ? t("pauseAnimation", locale) : t("playChronology", locale)}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          {/* Step Next */}
          <button
            type="button"
            onClick={handleStepNext}
            disabled={currentIndex >= maxIdx}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-40 flex items-center justify-center transition-colors"
            title={t("nextYear", locale)}
            aria-label={t("nextYear", locale)}
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Year Display Badge */}
          <div className="pl-2 border-l border-slate-800">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              {mode === "single" ? t("activeYear", locale) : t("accumulatedRange", locale)}
            </span>
            <span className="text-lg font-black font-mono text-blue-400">
              {mode === "single" ? activeYear : `${startYear} – ${endYear}`}
            </span>
          </div>
        </div>

        {/* Mode Selector Toggle */}
        <div className="flex items-center gap-2 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 self-start md:self-auto">
          <button
            type="button"
            onClick={() => {
              onPlayPause(false);
              onModeChange("single");
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              mode === "single"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{t("singleYear", locale)}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onPlayPause(false);
              onModeChange("range");
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              mode === "range"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{t("yearRange", locale)}</span>
          </button>
        </div>
      </div>

      {/* Index-Driven Slider */}
      {mode === "single" ? (
        <div className="space-y-2">
          <input
            type="range"
            min={0}
            max={maxIdx}
            step={1}
            value={currentIndex}
            onChange={(e) => {
              onPlayPause(false);
              onIndexChange(parseInt(e.target.value, 10));
            }}
            className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            aria-label={t("activeYear", locale)}
          />
          <div className="flex justify-between text-[11px] font-mono text-slate-400 px-1 overflow-x-auto no-scrollbar">
            {years.map((y, idx) => (
              <button
                type="button"
                key={y}
                onClick={() => {
                  onPlayPause(false);
                  onIndexChange(idx);
                }}
                className={`hover:text-blue-400 transition-colors px-1 ${
                  currentIndex === idx ? "text-blue-400 font-bold" : ""
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">
                {t("period", locale)} Start: {startYear}
              </label>
              <input
                type="range"
                min={0}
                max={rangeIndices[1]}
                step={1}
                value={rangeIndices[0]}
                onChange={(e) => {
                  onPlayPause(false);
                  onRangeChange([parseInt(e.target.value, 10), rangeIndices[1]]);
                }}
                className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">
                {t("period", locale)} End: {endYear}
              </label>
              <input
                type="range"
                min={rangeIndices[0]}
                max={maxIdx}
                step={1}
                value={rangeIndices[1]}
                onChange={(e) => {
                  onPlayPause(false);
                  onRangeChange([rangeIndices[0], parseInt(e.target.value, 10)]);
                }}
                className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
