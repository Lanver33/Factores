import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { DirectoryIndexItem, Locale } from "@/domain/indicator.schema";
import { routes } from "@/lib/i18n";
import { formatIndicatorValue } from "@/lib/format";
import Sparkline from "./Sparkline";

interface DirectoryRowProps {
  item: DirectoryIndexItem;
  locale: Locale;
}

export function DirectoryRow({ item, locale }: DirectoryRowProps) {
  const compactVal = formatIndicatorValue(item.latestValue, item.valueFormat, locale, true);
  const exactVal = formatIndicatorValue(item.latestValue, item.valueFormat, locale, false);
  const question = item.question[locale];
  const unit = item.unit[locale];
  const primarySource = item.primarySource[locale];
  const href = routes.indicator(locale, item.id);

  return (
    <Link
      href={href}
      className="group flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900/60 hover:bg-slate-900 border border-slate-800/90 hover:border-slate-700 rounded-xl px-4 py-3.5 transition-all cursor-pointer gap-3 sm:gap-4 no-underline"
    >
      {/* Left Column: Question, Source and Time Horizon */}
      <div className="space-y-1 flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-[#F1F5F9] group-hover:text-[#3B82F6] transition-colors leading-snug truncate">
          {question}
        </h4>
        <div className="text-xs text-[#94A3B8] font-medium flex items-center gap-1.5 font-mono">
          <span>{primarySource}</span>
          <span>·</span>
          <span>{item.timeHorizon}</span>
        </div>
      </div>

      {/* Right Column: Sparkline and Numeric Value */}
      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
        {item.sparkline.length > 1 && (
          <div className="hidden md:block">
            <Sparkline data={item.sparkline} width={90} height={28} color="#3B82F6" />
          </div>
        )}

        <div className="text-left sm:text-right">
          <div
            className="text-base font-bold text-white font-mono tabular-nums tracking-tight"
            title={`${exactVal} ${unit}`}
          >
            {compactVal}
          </div>
          <div className="text-[11px] text-[#64748B] font-medium truncate max-w-[120px]">
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

export default DirectoryRow;
