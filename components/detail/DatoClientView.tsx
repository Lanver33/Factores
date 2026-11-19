"use client";

import type { DatoItem, Lang } from "@/types";
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

  return (
    <div className="space-y-6">
      <ChartRenderer item={dato} lang={activeLang} locale={activeLang} />
      <ContextNotesCard notes={dato.contextNotes} lang={activeLang} locale={activeLang} />
      <SourceCard
        sources={dato.sources || (dato.source ? [dato.source] : [])}
        lastUpdated={dato.lastUpdated || dato.last_updated}
        lang={activeLang}
        locale={activeLang}
      />
    </div>
  );
}

export default DatoClientView;
