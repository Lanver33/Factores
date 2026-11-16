import { Info } from "lucide-react";

interface ContextNotesProps {
  notes: string[];
}

export default function ContextNotes({ notes }: ContextNotesProps) {
  return (
    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Info className="w-4 h-4 text-blue-600 shrink-0" />
        <h3 className="text-sm font-semibold text-slate-900">
          Contexto Técnico y Notas Metodológicas
        </h3>
      </div>
      
      <ul className="space-y-2.5 text-xs text-slate-700">
        {notes.map((note, index) => (
          <li key={index} className="flex items-start gap-2.5 leading-relaxed">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
            <span>{note}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
