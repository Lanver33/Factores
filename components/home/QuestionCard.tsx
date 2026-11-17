import Link from "next/link";
import { ItemIndexItem, DatoItem } from "@/types";
import { ChevronRight, Calendar } from "lucide-react";

interface QuestionCardProps {
  item: ItemIndexItem | DatoItem;
}

export default function QuestionCard({ item }: QuestionCardProps) {
  const category = item.category;
  const question = item.question;
  const unit = item.unit;

  let latestYear = "";
  let latestValue: number | string = "";

  if ("latestYear" in item) {
    latestYear = item.latestYear;
    latestValue = item.latestValue;
  } else if ("dataPoints" in item && item.dataPoints?.length) {
    const lastPoint = item.dataPoints[item.dataPoints.length - 1];
    latestYear = lastPoint.year || lastPoint.date || "";
    latestValue = lastPoint.value;
  }

  return (
    <Link
      href={`/dato/${item.id}`}
      className="group block bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 active:scale-[0.99] touch-manipulation"
    >
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span className="inline-block px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-lg">
          {category}
        </span>
        {latestYear && (
          <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {latestYear}
          </span>
        )}
      </div>

      <h2 className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug mb-4">
        {question}
      </h2>

      <div className="flex items-end justify-between border-t border-slate-100 pt-3 mt-2">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
            Último dato {latestYear ? `(${latestYear})` : ""}
          </div>
          <div className="text-xl font-bold text-slate-900 leading-none mt-1">
            {latestValue !== "" ? latestValue : "N/A"}{" "}
            {unit && (
              <span className="text-xs font-normal text-slate-500">
                {unit}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform">
          <span>Ver gráfico</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  );
}
