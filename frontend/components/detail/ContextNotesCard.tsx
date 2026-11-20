import { Info } from "lucide-react";
import type { Lang } from "@/lib/types";
import { t } from "@/lib/i18n";

interface ContextNotesCardProps {
  notes?: string[];
  lang?: Lang;
  locale?: Lang;
}

export function ContextNotesCard({
  notes,
  lang,
  locale = "es",
}: ContextNotesCardProps) {
  const activeLang = lang || locale || "es";

  if (!notes || notes.length === 0) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
      <h3 className="text-sm font-bold text-white flex items-center gap-2">
        <Info className="w-4 h-4 text-blue-400" />
        <span>{t("methodologicalNotes", activeLang)}</span>
      </h3>
      <ul className="space-y-2 text-xs text-slate-300 leading-relaxed pl-5 list-disc">
        {notes.map((note, index) => (
          <li key={index} className="marker:text-blue-400">
            {note}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ContextNotesCard;
