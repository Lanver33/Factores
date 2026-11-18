"use client";

import { useState } from "react";
import { Play, Pause, ChevronLeft, ChevronRight, Calendar, Layers } from "lucide-react";

interface TimelineScrubberProps {
  years: string[];
  selectedYear: string;
  setSelectedYear: (y: string) => void;
  yearRange: [string, string];
  setYearRange: (r: [string, string]) => void;
  mode: "single" | "range";
  setMode: (m: "single" | "range") => void;
  isPlaying: boolean;
  setIsPlaying: (p: boolean) => void;
}

export default function TimelineScrubber({
  years,
  selectedYear,
  setSelectedYear,
  yearRange,
  setYearRange,
  mode,
  setMode,
  isPlaying,
  setIsPlaying,
}: TimelineScrubberProps) {
  const currentIdx = years.indexOf(selectedYear);

  const handleStepPrev = () => {
    setIsPlaying(false);
    if (currentIdx > 0) {
      setSelectedYear(years[currentIdx - 1]);
    }
  };

  const handleStepNext = () => {
    setIsPlaying(false);
    if (currentIdx < years.length - 1) {
      setSelectedYear(years[currentIdx + 1]);
    }
  };

  const handleRangeStartChange = (val: string) => {
    setIsPlaying(false);
    const startIdx = years.indexOf(val);
    const endIdx = years.indexOf(yearRange[1]);
    if (startIdx <= endIdx) {
      setYearRange([val, yearRange[1]]);
    } else {
      setYearRange([val, val]);
    }
  };

  const handleRangeEndChange = (val: string) => {
    setIsPlaying(false);
    const startIdx = years.indexOf(yearRange[0]);
    const endIdx = years.indexOf(val);
    if (endIdx >= startIdx) {
      setYearRange([yearRange[0], val]);
    } else {
      setYearRange([val, val]);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 text-white shadow-2xl space-y-4">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Playback Controls & Mode Switcher */}
        <div className="flex items-center gap-3">
          {/* Step Prev */}
          <button
            onClick={handleStepPrev}
            disabled={currentIdx <= 0}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-40 flex items-center justify-center transition-colors"
            title="Año anterior (<)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Play / Pause */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg transition-all active:scale-95"
            title={isPlaying ? "Pausar animación" : "Reproducir cronología"}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          {/* Step Next */}
          <button
            onClick={handleStepNext}
            disabled={currentIdx >= years.length - 1}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-40 flex items-center justify-center transition-colors"
            title="Año siguiente (>)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Year Display Badge */}
          <div className="pl-2 border-l border-slate-800">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              {mode === "single" ? "Año Activo" : "Rango Acumulado"}
            </span>
            <span className="text-lg font-black font-mono text-blue-400">
              {mode === "single"
                ? selectedYear
                : `${yearRange[0]} – ${yearRange[1]}`}
            </span>
          </div>
        </div>

        {/* Mode Selector Toggle */}
        <div className="flex items-center gap-2 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 self-start md:self-auto">
          <button
            onClick={() => {
              setIsPlaying(false);
              setMode("single");
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              mode === "single"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Año Único
          </button>
          <button
            onClick={() => {
              setIsPlaying(false);
              setMode("range");
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              mode === "range"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Rango de Años
          </button>
        </div>
      </div>

      {/* Scrubber Sliders */}
      {mode === "single" ? (
        <div className="space-y-2">
          <input
            type="range"
            min="2008"
            max="2024"
            step="1"
            value={selectedYear}
            onChange={(e) => {
              setIsPlaying(false);
              setSelectedYear(e.target.value);
            }}
            className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-[11px] font-mono text-slate-400 px-1">
            {years.map((y, idx) => (
              <button
                key={y}
                onClick={() => {
                  setIsPlaying(false);
                  setSelectedYear(y);
                }}
                className={`hover:text-blue-400 transition-colors ${
                  selectedYear === y ? "text-blue-400 font-bold" : ""
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
              <label className="text-[11px] font-medium text-slate-400 block mb-1">
                Desde: <span className="font-bold text-white font-mono">{yearRange[0]}</span>
              </label>
              <select
                value={yearRange[0]}
                onChange={(e) => handleRangeStartChange(e.target.value)}
                className="w-full bg-slate-800 text-xs font-mono font-bold text-white border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">
                Hasta: <span className="font-bold text-white font-mono">{yearRange[1]}</span>
              </label>
              <select
                value={yearRange[1]}
                onChange={(e) => handleRangeEndChange(e.target.value)}
                className="w-full bg-slate-800 text-xs font-mono font-bold text-white border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
