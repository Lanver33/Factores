import React from "react";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import type { Locale } from "@/lib/types";

export async function generateStaticParams() {
  return [{ lang: "es" }, { lang: "en" }];
}

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}

export default async function LangLayout({ children, params }: LayoutProps) {
  const resolvedParams = await params;
  const lang = (resolvedParams?.lang === "en" ? "en" : "es") as Locale;

  return (
    <>
      <Header locale={lang} />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        {children}
      </main>
      <Footer locale={lang} />
    </>
  );
}
