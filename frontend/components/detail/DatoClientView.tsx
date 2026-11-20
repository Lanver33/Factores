"use client";

import type { DatoItem, Lang } from "@/lib/types";
import { ConceptGuideProvider } from "./guide/ConceptGuideContext";
import ConceptGuideSection from "./guide/ConceptGuideSection";
import ChartRenderer from "./ChartRenderer";
import ContextNotesCard from "./ContextNotesCard";
import SourceCard from "./SourceCard";

interface DatoClientViewProps {
  dato: DatoItem | any;
  lang?: Lang;
  locale?: Lang;
}

export function DatoClientView({ dato, lang, locale = "es" }: DatoClientViewProps) {
  const activeLang = lang || locale || "es";
  const notesArray = Array.isArray(dato.contextNotes)
    ? dato.contextNotes
    : typeof dato.contextNotes === "object" && dato.contextNotes !== null
    ? dato.contextNotes[activeLang] || dato.contextNotes.es
    : [];

  return (
    <ConceptGuideProvider guide={dato.conceptGuide}>
      <div className="space-y-6">
        <ChartRenderer item={dato} lang={activeLang} locale={activeLang} />
        {dato.conceptGuide && <ConceptGuideSection lang={activeLang} />}
        <ContextNotesCard notes={notesArray} lang={activeLang} locale={activeLang} />
        <SourceCard
          sources={dato.sources || (dato.source ? [dato.source] : [])}
          lastUpdated={dato.lastUpdated || dato.last_updated}
          lang={activeLang}
          locale={activeLang}
        />
      </div>
    </ConceptGuideProvider>
  );
}

export default DatoClientView;
