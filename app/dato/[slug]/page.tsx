import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllDatos, getDatoById } from "@/lib/data-utils";
import InteractiveChart from "@/components/detail/InteractiveChart";
import ContextNotes from "@/components/detail/ContextNotes";
import SourceCard from "@/components/detail/SourceCard";
import { ArrowLeft, Tag } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const datos = getAllDatos();
  return datos.map((dato) => ({
    slug: dato.id,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const dato = getDatoById(resolvedParams.slug);

  if (!dato) {
    return {
      title: "Dato no encontrado | Factores.es",
    };
  }

  return {
    title: `${dato.question} | Factores.es`,
    description: `Serie histórica oficial (${dato.dataPoints[0]?.year}-${dato.dataPoints[dato.dataPoints.length - 1]?.year}) sobre ${dato.question}. Fuente: ${dato.source.institution}.`,
    openGraph: {
      title: dato.question,
      description: `Consulta la serie histórica oficial sin sesgo. Fuente: ${dato.source.institution}`,
    },
  };
}

export default async function DatoPage({ params }: PageProps) {
  const resolvedParams = await params;
  const dato = getDatoById(resolvedParams.slug);

  if (!dato) {
    notFound();
  }

  return (
    <article className="space-y-6 animate-in fade-in duration-200">
      {/* Botón Volver */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full transition-colors shadow-xs"
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
          dataPoints={dato.dataPoints}
          chartType={dato.chartType}
          unit={dato.unit}
        />
      </section>

      {/* 3. Contexto Técnico (2-3 viñetas) */}
      <section>
        <ContextNotes notes={dato.contextNotes} />
      </section>

      {/* 4. Trazabilidad (Caja de Fuente Oficial) */}
      <section>
        <SourceCard source={dato.source} />
      </section>
    </article>
  );
}
