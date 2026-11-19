"use client";

import { ItemIndexItem, DatoItem } from "@/types";
import { formatSpanishCompact, formatSpanishExact } from "./utils";
import Sparkline from "./Sparkline";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { formatCompactNumber, formatNumber } from "@/lib/i18n";

interface DirectoryRowProps {
  item: ItemIndexItem;
  detail?: DatoItem | null;
  lang?: "es" | "en";
}

export default function DirectoryRow({ item, detail, lang = "es" }: DirectoryRowProps) {
  let latestYear = item.latestYear || "";
  let latestValue = item.latestValue ?? 0;

  if (detail?.dataPoints && detail.dataPoints.length > 0) {
    const lastPt = detail.dataPoints[detail.dataPoints.length - 1];
    latestYear = lastPt.year || lastPt.date || latestYear;
    const rawVal = lastPt.value;
    if (typeof rawVal === "number") {
      latestValue = rawVal;
    } else if (Array.isArray(rawVal)) {
      const arr = rawVal as Array<any>;
      const totObj = arr.find((o: any) => o && typeof o === "object" && "total" in o) || arr[0];
      latestValue = totObj ? (Object.values(totObj)[0] as number) : latestValue;
    }
  }

  const compactVal = formatCompactNumber(latestValue, lang);
  const exactVal = formatNumber(latestValue, lang);
  const sourceName = detail?.sources?.[0]?.institution || detail?.source?.institution || "INE";
  const unit = item.unit || (lang === "en" ? "people" : "personas");

  return (
    <Link
      href={lang === "en" ? `/en/dato/${item.id}` : `/dato/${item.id}`}
      className="group flex flex-col sm:flex-row sm:items-center justify-between py-3.5 px-3 rounded-xl hover:bg-white/[0.02] border-b border-white/[0.06] transition-all cursor-pointer gap-3 sm:gap-4 no-underline"
    >
      {/* Left Editorial Content */}
      <div className="space-y-1 flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-[#F1F5F9] group-hover:text-[#3B82F6] transition-colors leading-snug truncate">
            {item.question}
          </h4>
        </div>
        <div className="text-xs text-[#94A3B8] font-medium flex items-center gap-1.5">
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
    </Link>
  );
}
