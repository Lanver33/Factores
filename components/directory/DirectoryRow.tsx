"use client";

import { useState } from "react";
import { ItemIndexItem, DatoItem } from "@/types";
import { formatSpanishCompact, formatSpanishExact } from "./utils";
import Sparkline from "./Sparkline";
import { ChevronRight, ExternalLink } from "lucide-react";
import Link from "next/link";

interface DirectoryRowProps {
  item: ItemIndexItem;
  detail?: DatoItem | null;
}

export default function DirectoryRow({ item, detail }: DirectoryRowProps) {
  const [showModal, setShowModal] = useState(false);

  let latestYear = item.latestYear || "";
  let latestValue = item.latestValue ?? 0;

  if (detail?.dataPoints && detail.dataPoints.length > 0) {
    const lastPt = detail.dataPoints[detail.dataPoints.length - 1];
    latestYear = lastPt.year || lastPt.date || latestYear;
    const rawVal = lastPt.value;
    if (typeof rawVal === "number") {
      latestValue = rawVal;
    } else if (Array.isArray(rawVal)) {
      const totObj = rawVal.find((o: any) => o && typeof o === "object" && "total" in o) || rawVal[0];
      latestValue = totObj ? (Object.values(totObj)[0] as number) : latestValue;
    }
  }

  const compactVal = formatSpanishCompact(latestValue);
  const exactVal = formatSpanishExact(latestValue);
  const sourceName = detail?.source?.institution || "INE";
  const unit = item.unit || "personas";
  const description = detail?.contextNotes?.[0] || item.question;

  return (
    <>
      <div
        onClick={() => setShowModal(true)}
        className="group flex flex-col sm:flex-row sm:items-center justify-between py-3.5 px-3 rounded-xl hover:bg-white/[0.02] border-b border-white/[0.06] transition-all cursor-pointer gap-3 sm:gap-4"
      >
        {/* Left Editorial Content */}
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-[#F1F5F9] group-hover:text-[#3B82F6] transition-colors leading-snug truncate">
              {item.question}
            </h4>
          </div>
          <p className="text-xs text-[#94A3B8] line-clamp-1">
            {description}
          </p>
          <div className="text-[11px] text-[#64748B] flex items-center gap-1.5 font-medium">
            <span>{sourceName}</span>
            <span>·</span>
            <span>{latestYear}</span>
          </div>
        </div>

        {/* Right Numeric & Sparkline Content */}
        <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
          {detail?.dataPoints && (
            <div className="hidden md:block">
              <Sparkline dataPoints={detail.dataPoints} width={90} height={28} color="#3B82F6" />
            </div>
          )}

          <div className="text-left sm:text-right">
            <div
              className="text-base font-bold text-white font-mono tabular-nums tracking-tight"
              title={`${exactVal} ${unit}`}
            >
              {compactVal}
            </div>
            <div className="text-[11px] text-[#64748B] font-medium">
              {unit}
            </div>
          </div>

          <div className="w-6 h-6 rounded-full bg-white/[0.04] group-hover:bg-blue-600/20 text-[#64748B] group-hover:text-[#3B82F6] flex items-center justify-center transition-all">
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0B101D] border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-950/80 rounded-md border border-blue-800/60 mb-1">
                  {item.category}
                </span>
                <h3 className="text-base font-bold text-white leading-snug">
                  {item.question}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Valor Exacto</span>
                  <span className="text-lg font-black font-mono text-yellow-300">
                    {exactVal} {unit}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Último Periodo</span>
                  <span className="text-lg font-black font-mono text-white">
                    {latestYear}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Fuente Oficial</span>
                  <span className="text-xs font-bold text-blue-400 truncate block mt-1">
                    {sourceName}
                  </span>
                </div>
              </div>

              {/* Context Notes */}
              {detail?.contextNotes && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Contexto y Metodología</h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {detail.contextNotes.map((note, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-blue-500 font-bold">•</span>
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between">
              <Link
                href={`/dato/${item.id}`}
                onClick={() => setShowModal(false)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
              >
                <span>Ver página completa del indicador</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
