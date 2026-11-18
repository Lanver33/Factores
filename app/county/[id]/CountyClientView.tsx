"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GlobalMetadata, CountyDetail } from "@/types";
import { fetchMetadata, fetchCountyDetail, DATA_BASE_URL } from "@/lib/data-utils";
import InteractiveChart from "@/components/detail/InteractiveChart";
import SourceCard from "@/components/detail/SourceCard";
import { ArrowLeft, MapPin, Calendar, Loader2, AlertCircle, Filter } from "lucide-react";

interface CountyClientViewProps {
  countyId: string;
}

export default function CountyClientView({ countyId }: CountyClientViewProps) {
  const [metadata, setMetadata] = useState<GlobalMetadata | null>(null);
  const [county, setCounty] = useState<CountyDetail | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCountyData() {
      try {
        setLoading(true);
        setError(null);
        const [metaData, countyData] = await Promise.all([
          fetchMetadata(),
          fetchCountyDetail(countyId),
        ]);

        if (!countyData) {
          setError(`County record '${countyId}' not found.`);
          return;
        }

        setMetadata(metaData);
        setCounty(countyData);

        const availableMetrics = Object.keys(countyData.metrics || {});
        if (availableMetrics.length > 0) {
          setSelectedMetric(availableMetrics[0]);
        }
      } catch (err) {
        console.error("Failed to lazy-load county detail:", err);
        setError(`Failed to fetch county data from ${DATA_BASE_URL}/counties/${countyId}.json`);
      } finally {
        setLoading(false);
      }
    }

    loadCountyData();
  }, [countyId]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
        <p className="text-sm font-semibold text-slate-700">
          Lazy-loading county detail JSON via HTTP...
        </p>
      </div>
    );
  }

  if (error || !county) {
    return (
      <div className="space-y-4">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-3.5 py-2 rounded-full transition-colors shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Explorer</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
          <AlertCircle className="w-6 h-6 text-red-600 mx-auto" />
          <h2 className="text-base font-bold text-slate-900">{error || "County Not Found"}</h2>
          <p className="text-xs text-slate-500">
            Requested County ID: {countyId}
          </p>
        </div>
      </div>
    );
  }

  const metricKeys = Object.keys(county.metrics || {});
  const currentMetricData = selectedMetric && county.metrics ? county.metrics[selectedMetric] : undefined;
  const currentMetricMeta = metadata?.metrics ? metadata.metrics[selectedMetric] : undefined;

  const unit = currentMetricData?.unit || currentMetricMeta?.unit || "";
  const title = currentMetricMeta?.title || selectedMetric;

  return (
    <article className="space-y-6 animate-in fade-in duration-200">
      {/* Back Button */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-3.5 py-2 rounded-full transition-colors shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Explorer</span>
        </Link>
      </div>

      {/* Header */}
      <header className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-xs font-semibold">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              {county.state ? `${county.name}, ${county.state}` : county.name}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2 tracking-tight">
              {county.name} Dashboard
            </h1>
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full self-start sm:self-auto">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Updated: {county.last_updated || metadata?.last_updated}</span>
          </div>
        </div>
      </header>

      {/* Metric Selector Tabs */}
      {metricKeys.length > 1 && (
        <section className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5" />
            <span>Select Metric Series</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {metricKeys.map((key) => {
              const meta = metadata?.metrics ? metadata.metrics[key] : undefined;
              const isSelected = selectedMetric === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedMetric(key)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isSelected
                      ? "bg-slate-900 text-white shadow-sm ring-1 ring-slate-900"
                      : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {meta?.title || key}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Interactive Time-Series Chart */}
      {currentMetricData && (
        <section>
          <InteractiveChart
            series={currentMetricData.series}
            chartType="line"
            unit={unit}
            title={title}
          />
        </section>
      )}

      {/* Source Attribution & Traceability Card */}
      <section>
        <SourceCard
          sources={county.sources}
          lastUpdated={county.last_updated || metadata?.last_updated}
        />
      </section>
    </article>
  );
}
