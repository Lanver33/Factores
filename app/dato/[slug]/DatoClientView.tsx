"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DatoItem } from "@/types";
import { fetchItemDetail, DATA_BASE_URL } from "@/lib/data-utils";
import InteractiveChart from "@/components/detail/InteractiveChart";
import SourceCard from "@/components/detail/SourceCard";
import { ArrowLeft, Tag, Loader2, AlertCircle } from "lucide-react";
import { t, translateCategory } from "@/lib/i18n";

interface DatoClientViewProps {
  slug: string;
  lang?: "es" | "en";
}

export default function DatoClientView({ slug, lang = "es" }: DatoClientViewProps) {
  const [dato, setDato] = useState<DatoItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  useEffect(() => {
    async function loadItem() {
      if (slug === "_none") {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const item = await fetchItemDetail(slug, lang);
        if (!item) {
          setError(lang === "en" ? `Indicator '${slug}' not found.` : `No se encontró el dato '${slug}'.`);
        } else {
          setDato(item);
        }
      } catch (err) {
        console.error("Error loading item detail:", err);
        setError(`Error fetching data from ${DATA_BASE_URL}/items/${slug}.json`);
      } finally {
        setLoading(false);
      }
    }
    loadItem();
  }, [slug, lang]);

  const backUrl = lang === "en" ? "/en" : "/";

  return (
    <div className="w-full space-y-6">
      {loading ? (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-12 text-center space-y-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">{t("loadingData", lang)}</p>
        </div>
      ) : error || !dato || slug === "_none" ? (
        <div className="space-y-4">
          <div>
            <Link
              href={backUrl}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3.5 py-2 rounded-full transition-colors shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t("backToExplorer", lang)}</span>
            </Link>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 text-center space-y-3">
            <AlertCircle className="w-6 h-6 text-red-500 mx-auto" />
            <h2 className="text-base font-bold text-white">
              {error || t("noDataYet", lang)}
            </h2>
            <p className="text-xs text-slate-400">
              {lang === "en" ? "You can add a new JSON data file in" : "Puedes añadir un nuevo dato JSON en"}{" "}
              <code className="bg-slate-800 px-1 py-0.5 rounded text-slate-300">data/items/{slug}.json</code>
            </p>
          </div>
        </div>
      ) : (
        <article className="space-y-6 animate-in fade-in duration-200">
          {/* Botón Volver */}
          <div>
            <Link
              href={backUrl}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3.5 py-2 rounded-full transition-colors shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t("backToExplorer", lang)}</span>
            </Link>
          </div>

          {/* Categoría Badge */}
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-950 text-blue-300 border border-blue-800/80 rounded-lg text-xs font-semibold">
              <Tag className="w-3 h-3 text-blue-400" />
              {translateCategory(dato.category, lang)}
            </span>
          </div>

          {/* 1. La Pregunta (H1) */}
          <header className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white leading-snug tracking-tight">
              {dato.question}
            </h1>
          </header>

          {/* 2. El Gráfico Interactivo */}
          <section>
            <InteractiveChart
              series={dato.dataPoints.map((dp) => {
                let val = 0;
                const rawVal = dp.value as any;
                if (typeof rawVal === "number") {
                  val = rawVal;
                } else if (Array.isArray(rawVal)) {
                  const totalObj = rawVal.find((item: any) => item && typeof item === "object" && "total" in item) || rawVal[0];
                  val = totalObj ? (Object.values(totalObj)[0] as number) : 0;
                }
                return {
                  year: dp.year || dp.date || "",
                  date: dp.date || dp.year || "",
                  value: val,
                };
              })}
              rawPoints={dato.dataPoints}
              continentsPoints={(dato as any).continentsDataPoints}
              chartType={dato.chartType || "line"}
              unit={dato.unit}
              item={dato}
              lang={lang}
            />
          </section>

          {/* Notas Metodológicas y Contexto */}
          {Array.isArray(dato.contextNotes) && dato.contextNotes.length > 0 && (
            <section className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                {lang === "en" ? "Methodological Notes & Context" : "Notas Metodológicas y Contexto"}
              </h3>
              <ul className="space-y-2 text-xs text-slate-400">
                {dato.contextNotes.map((note, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-blue-400 font-mono mt-0.5">•</span>
                    <span className="leading-relaxed">{note}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 3. Trazabilidad y Fuentes Oficiales */}
          <section>
            <SourceCard
              sources={dato.sources}
              lastUpdated={dato.sources?.[0]?.lastUpdated || dato.last_updated}
            />
          </section>
        </article>
      )}
    </div>
  );
}
