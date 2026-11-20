import type { Locale } from "@/lib/types";
import { t } from "@/lib/i18n";

interface MethodologicalNotesProps {
  notes: string[];
  locale: Locale;
}

export function MethodologicalNotes({ notes, locale }: MethodologicalNotesProps) {
  if (!notes || notes.length === 0) return null;

  return (
    <section className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-3 shadow-xl">
      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-500" />
        {t("methodologicalNotesTitle", locale)}
      </h3>
      <ul className="space-y-2 text-xs text-slate-400">
        {notes.map((note, idx) => (
          <li key={idx} className="flex items-start gap-2">
            <span className="text-blue-400 font-mono mt-0.5">•</span>
            <span className="leading-relaxed">{note}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default MethodologicalNotes;
