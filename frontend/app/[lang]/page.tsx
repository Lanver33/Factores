import { getDirectoryIndex } from "@/lib/data";
import DirectoryExplorer from "@/components/directory/DirectoryExplorer";
import type { Locale } from "@/lib/types";

interface PageProps {
  params: Promise<{ lang: string }>;
}

export async function generateStaticParams() {
  return [{ lang: "es" }, { lang: "en" }];
}

export default async function HomePage({ params }: PageProps) {
  const resolvedParams = await params;
  const lang = (resolvedParams?.lang === "en" ? "en" : "es") as Locale;
  const initialItems = await getDirectoryIndex(lang);
  return <DirectoryExplorer initialItems={initialItems} locale={lang} />;
}
