import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Tag } from "lucide-react";
import type { Locale } from "@/lib/types";
import { getIndicatorBySlug, getAllIndicatorSlugs } from "@/lib/data";
import { routes, CATEGORY_LABELS, t } from "@/lib/i18n";
import { IndicatorVisualization } from "@/components/shared/IndicatorVisualization";
import SourceCard from "@/components/shared/SourceCard";
import ContextNotesCard from "@/components/shared/ContextNotesCard";
import { ConceptGuideProvider } from "@/components/shared/guide/ConceptGuideContext";
import ConceptGuideSection from "@/components/shared/guide/ConceptGuideSection";

interface PageProps {
  params: Promise<{ lang: string; slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllIndicatorSlugs();
  const params: Array<{ lang: string; slug: string }> = [];
  for (const lang of ["es", "en"]) {
    for (const slug of slugs) {
      params.push({ lang, slug });
    }
  }
  return params;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const lang = (resolvedParams?.lang === "en" ? "en" : "es") as Locale;
  const slug = resolvedParams?.slug;

  const indicator = await getIndicatorBySlug(slug, lang);
  if (!indicator) {
    return {
      title: lang === "en" ? "Indicator Not Found | Factor.es" : "Indicador no encontrado | Factor.es",
    };
  }

  const question = indicator.question[lang] || indicator.question.es;
  const summary = indicator.contextNotes[lang]?.[0] || indicator.contextNotes.es[0] || question;

  return {
    title: `${question} | Factor.es`,
    description: summary,
    openGraph: {
      title: `${question} | Factor.es`,
      description: summary,
    },
  };
}

export default async function IndicatorPage({ params }: PageProps) {
  const resolvedParams = await params;
  const lang = (resolvedParams?.lang === "en" ? "en" : "es") as Locale;
  const slug = resolvedParams?.slug;

  const indicator = await getIndicatorBySlug(slug, lang);
  if (!indicator) {
    notFound();
  }

  const question = indicator.question[lang] || indicator.question.es;
  const categoryLabel = CATEGORY_LABELS[indicator.category]?.[lang] ?? indicator.category;
  const backHref = routes.home(lang);

  return (
    <ConceptGuideProvider guide={(indicator as any).conceptGuide}>
      <article className="space-y-6 animate-in fade-in duration-200">
        <div>
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3.5 py-2 rounded-full transition-colors shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t("backToExplorer", lang)}</span>
          </Link>
        </div>

        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-950 text-blue-300 border border-blue-800/80 rounded-lg text-xs font-semibold">
            <Tag className="w-3 h-3 text-blue-400" />
            {categoryLabel}
          </span>
        </div>

        <header className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold text-white leading-snug tracking-tight">
            {question}
          </h1>
        </header>

        <IndicatorVisualization indicator={indicator} locale={lang} />

        {(indicator as any).conceptGuide && <ConceptGuideSection lang={lang} />}

        <ContextNotesCard
          notes={indicator.contextNotes[lang] || indicator.contextNotes.es}
          lang={lang}
          locale={lang}
        />

        <SourceCard
          sources={indicator.sources}
          lastUpdated={indicator.lastUpdated}
          locale={lang}
          lang={lang}
        />
      </article>
    </ConceptGuideProvider>
  );
}
