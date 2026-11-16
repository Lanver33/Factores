import Link from "next/link";
import { DatoItem } from "@/types";
import { ChevronRight, Calendar, ArrowUpRight } from "lucide-react";

interface QuestionCardProps {
  dato: DatoItem;
}

export default function QuestionCard({ dato }: QuestionCardProps) {
  const latestDataPoint = dato.dataPoints[dato.dataPoints.length - 1];
  const firstDataPoint = dato.dataPoints[0];

  return (
    <Link
      href={`/dato/${dato.id}`}
      className="group block bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 active:scale-[0.99] touch-manipulation"
    >
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span className="inline-block px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-lg">
          {dato.category}
        </span>
        <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {latestDataPoint.year}
        </span>
      </div>

      <h2 className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug mb-4">
        {dato.question}
      </h2>

      <div className="flex items-end justify-between border-t border-slate-100 pt-3 mt-2">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
            Último dato ({latestDataPoint.year})
          </div>
          <div className="text-xl font-bold text-slate-900 leading-none mt-1">
            {latestDataPoint.value}{" "}
            <span className="text-xs font-normal text-slate-500">
              {dato.unit}
            </span>
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
