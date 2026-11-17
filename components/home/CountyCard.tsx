import Link from "next/link";
import { CountyIndexItem, MetricMeta } from "@/types";
import { ChevronRight, Calendar, MapPin } from "lucide-react";

interface CountyCardProps {
  county: CountyIndexItem;
  selectedMetric: string;
  metricMeta?: MetricMeta;
}

export default function CountyCard({ county, selectedMetric, metricMeta }: CountyCardProps) {
  const latestValue = county.latest_summary ? county.latest_summary[selectedMetric] : county.latestValue;
  const unit = metricMeta?.unit || "";
  const title = metricMeta?.title || selectedMetric;

  const formattedValue =
    typeof latestValue === "number"
      ? unit === "percent"
        ? `${latestValue}%`
        : latestValue.toLocaleString()
      : "N/A";

  return (
    <Link
      href={`/county/${county.id}`}
      className="group block bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 active:scale-[0.99] touch-manipulation"
    >
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-lg">
          <MapPin className="w-3 h-3 text-blue-600" />
          {county.state ? `${county.name}, ${county.state}` : county.name}
        </span>
        <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          County ID: {county.id}
        </span>
      </div>

      <h2 className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug mb-4">
        {county.name}
      </h2>

      <div className="flex items-end justify-between border-t border-slate-100 pt-3 mt-2">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
            {title}
          </div>
          <div className="text-xl font-bold text-slate-900 leading-none mt-1">
            {formattedValue}{" "}
            {unit && unit !== "percent" && (
              <span className="text-xs font-normal text-slate-500">
                {unit}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform">
          <span>View Dashboard</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  );
}
