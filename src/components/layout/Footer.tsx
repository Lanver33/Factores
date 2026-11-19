import Link from "next/link";
import { ShieldCheck, Mail } from "lucide-react";
import type { Locale } from "@/domain/indicator.schema";
import { routes, t } from "@/lib/i18n";

interface FooterProps {
  locale: Locale;
}

export function Footer({ locale }: FooterProps) {
  return (
    <footer className="border-t border-slate-800 bg-slate-900/90 py-8 px-4 mt-16 text-slate-400 text-xs">
      <div className="max-w-5xl mx-auto flex flex-col gap-4 text-center sm:text-left sm:flex-row sm:justify-between sm:items-center">
        <div className="space-y-1">
          <p className="font-semibold text-slate-200 flex items-center justify-center sm:justify-start gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-400 inline" />
            {t("transparencyBadge", locale)}
          </p>
          <p className="text-slate-400">{t("footerSubtitle", locale)}</p>
        </div>
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-4 text-slate-400">
          <Link href={routes.home(locale)} className="hover:text-white underline">
            {t("homeLink", locale)}
          </Link>
          <a
            href="mailto:factores-feedback@proton.me"
            className="inline-flex items-center gap-1 text-slate-300 hover:text-blue-400 transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>factores-feedback@proton.me</span>
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
