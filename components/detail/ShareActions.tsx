"use client";

import { useState } from "react";
import { Share2, Copy, Send, Twitter } from "lucide-react";
import Toast from "@/components/ui/Toast";

interface ShareActionsProps {
  question: string;
  id: string;
}

export default function ShareActions({ question, id }: ShareActionsProps) {
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const getShareUrl = () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/dato/${id}`;
    }
    return `https://datooficial.es/dato/${id}`;
  };

  const getShareText = () => {
    return `${question}\nConsulta los datos oficiales sin filtro político en DatoOficial.es:`;
  };

  const handleNativeShare = async () => {
    const shareUrl = getShareUrl();
    const shareText = getShareText();

    if (navigator.share) {
      try {
        await navigator.share({
          title: question,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or share failed, fallback to copy
        if ((err as Error).name !== "AbortError") {
          copyToClipboard();
        }
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = async () => {
    const shareUrl = getShareUrl();
    try {
      await navigator.clipboard.writeText(shareUrl);
      setToastMessage("¡Enlace copiado al portapapeles!");
      setToastOpen(true);
    } catch {
      setToastMessage("No se pudo copiar el enlace");
      setToastOpen(true);
    }
  };

  const shareUrl = getShareUrl();
  const shareText = encodeURIComponent(`${getShareText()} ${shareUrl}`);

  return (
    <div className="space-y-3">
      {/* Botón Primario Móvil */}
      <button
        onClick={handleNativeShare}
        className="w-full py-3.5 px-5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] touch-manipulation"
      >
        <Share2 className="w-4 h-4 text-blue-400" />
        <span>Compartir dato en WhatsApp / X / App</span>
      </button>

      {/* Accesos Directos de 1 clic */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={copyToClipboard}
          className="py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors touch-manipulation"
        >
          <Copy className="w-3.5 h-3.5 text-slate-500" />
          <span>Copiar enlace</span>
        </button>

        <a
          href={`https://api.whatsapp.com/send?text=${shareText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors touch-manipulation"
        >
          <Send className="w-3.5 h-3.5 text-emerald-600" />
          <span>WhatsApp</span>
        </a>

        <a
          href={`https://twitter.com/intent/tweet?text=${shareText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="py-2.5 px-3 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors touch-manipulation"
        >
          <Twitter className="w-3.5 h-3.5 text-blue-400 fill-current" />
          <span>X / Twitter</span>
        </a>
      </div>

      <Toast
        message={toastMessage}
        isOpen={toastOpen}
        onClose={() => setToastOpen(false)}
      />
    </div>
  );
}
