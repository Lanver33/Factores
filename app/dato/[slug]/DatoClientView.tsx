"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DatoItem } from "@/types";
import { fetchItemDetail, DATA_BASE_URL } from "@/lib/data-utils";
import InteractiveChart from "@/components/detail/InteractiveChart";
import ContextNotes from "@/components/detail/ContextNotes";
import SourceCard from "@/components/detail/SourceCard";
import { ArrowLeft, Tag, Loader2, AlertCircle } from "lucide-react";

interface DatoClientViewProps {
  slug: string;
}

export default function DatoClientView({ slug }: DatoClientViewProps) {
  const [dato, setDato] = useState<DatoItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadItem() {
      if (slug === "_none") {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const item = await fetchItemDetail(slug);
        if (!item) {
          setError(`No se encontró el dato '${slug}'.`);
        } else {
          setDato(item);
        }
      } catch (err) {
        console.error("Error cargando el dato:", err);
        setError(`Error al obtener el dato desde ${DATA_BASE_URL}/items/${slug}.json`);
      } finally {
        setLoading(false);
      }
    }
    loadItem();
  }, [slug]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
        <p className="text-sm font-semibold text-slate-700">Cargando dato vía HTTP...</p>
      </div>
    );
  }

  if (error || !dato || slug === "_none") {
    return (
      <div className="space-y-4">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-3.5 py-2 rounded-full transition-colors shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al explorador</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
          <AlertCircle className="w-6 h-6 text-red-600 mx-auto" />
          <h2 className="text-base font-bold text-slate-900">
            {error || "No hay datos registrados aún"}
          </h2>
          <p className="text-xs text-slate-500">
            Puedes añadir un nuevo dato JSON en <code className="bg-slate-100 px-1 py-0.5 rounded">data/items/{slug}.json</code>
          </p>
        </div>
      </div>
    );
  }

  const seriesPoints = dato.dataPoints.map((dp) => ({
    year: dp.year || dp.date || "",
    date: dp.date || dp.year || "",
    value: dp.value,
  }));

  return (
    <article className="space-y-6 animate-in fade-in duration-200">
      {/* Botón Volver */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-3.5 py-2 rounded-full transition-colors shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al explorador</span>
        </Link>
      </div>

      {/* Categoría Badge */}
      <div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-xs font-semibold">
          <Tag className="w-3 h-3 text-blue-600" />
          {dato.category}
        </span>
      </div>

      {/* 1. La Pregunta (H1) */}
      <header className="space-y-2">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug tracking-tight">
          {dato.question}
        </h1>
      </header>

      {/* 2. El Gráfico Interactivo */}
      <section>
        <InteractiveChart
          series={seriesPoints}
          chartType={dato.chartType || "line"}
          unit={dato.unit}
        />
      </section>

      {/* 3. Contexto Técnico */}
      {dato.contextNotes && dato.contextNotes.length > 0 && (
        <section>
          <ContextNotes notes={dato.contextNotes} />
        </section>
      )}

      {/* 4. Trazabilidad */}
      {dato.source && (
        <section>
          <SourceCard source={dato.source} lastUpdated={dato.source.lastUpdated || dato.last_updated} />
        </section>
      )}
    </article>
  );
}
