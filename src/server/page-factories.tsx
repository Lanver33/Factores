import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Tag } from "lucide-react";
import type { Locale } from "@/domain/indicator.schema";
import { getDirectoryIndex, getIndicatorBySlug, getAllIndicatorSlugs } from "./indicators";
import { routes, CATEGORY_LABELS, t } from "@/lib/i18n";
import DirectoryExplorer from "@/components/directory/DirectoryExplorer";
import { IndicatorVisualization } from "@/components/visualizations/IndicatorVisualization";
import SourceCard from "@/components/detail/SourceCard";
import ContextNotesCard from "@/components/detail/ContextNotesCard";
import { ConceptGuideProvider } from "@/components/detail/guide/ConceptGuideContext";
import ConceptGuideSection from "@/components/detail/guide/ConceptGuideSection";

export async function renderHomePage(locale: Locale) {
  const initialItems = await getDirectoryIndex();
  return <DirectoryExplorer initialItems={initialItems} locale={locale} />;
}

export async function generateIndicatorStaticParams() {
  const slugs = await getAllIndicatorSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateIndicatorMetadata(
  locale: Locale,
  slug: string
): Promise<Metadata> {
  const indicator = await getIndicatorBySlug(slug);
  if (!indicator) {
    return {
      title: locale === "en" ? "Indicator Not Found | Factor.es" : "Indicador no encontrado | Factor.es",
    };
  }

  const question = indicator.question[locale];
  const summary = indicator.contextNotes[locale][0] ?? question;

  return {
    title: `${question} | Factor.es`,
    description: summary,
    openGraph: {
      title: `${question} | Factor.es`,
      description: summary,
    },
  };
}

export async function renderIndicatorPage(locale: Locale, slug: string) {
  const indicator = await getIndicatorBySlug(slug);
  if (!indicator) {
    notFound();
  }

  const question = indicator.question[locale];
  const categoryLabel = CATEGORY_LABELS[indicator.category]?.[locale] ?? indicator.category;
  const backHref = routes.home(locale);

  return (
    <ConceptGuideProvider guide={(indicator as any).conceptGuide}>
      <article className="space-y-6 animate-in fade-in duration-200">
        {/* Back to Directory Button */}
        <div>
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3.5 py-2 rounded-full transition-colors shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t("backToExplorer", locale)}</span>
          </Link>
        </div>

        {/* Category Badge */}
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-950 text-blue-300 border border-blue-800/80 rounded-lg text-xs font-semibold">
            <Tag className="w-3 h-3 text-blue-400" />
            {categoryLabel}
          </span>
        </div>

        {/* H1 Question Header */}
        <header className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold text-white leading-snug tracking-tight">
            {question}
          </h1>
        </header>

        {/* Interactive Visualization (Kind Dispatched) */}
        <IndicatorVisualization indicator={indicator} locale={locale} />

        {/* Concept Guide & Glossary Section */}
        <ConceptGuideSection lang={locale} />

        {/* Methodological Context Notes */}
        <ContextNotesCard notes={indicator.contextNotes[locale]} lang={locale} locale={locale} />

        {/* Official Data Source & Traceability */}
        <SourceCard
          sources={indicator.sources}
          lastUpdated={indicator.lastUpdated}
          locale={locale}
        />
      </article>
    </ConceptGuideProvider>
  );
}
