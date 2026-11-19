import fs from "node:fs";
import path from "node:path";
import DatoClientView from "@/app/dato/[slug]/DatoClientView";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const itemsPath = path.join(process.cwd(), "data", "items.json");
    if (fs.existsSync(itemsPath)) {
      const items = JSON.parse(fs.readFileSync(itemsPath, "utf-8"));
      if (Array.isArray(items) && items.length > 0) {
        return items.map((item: { id: string }) => ({ slug: item.id }));
      }
    }
  } catch (err) {
    console.warn("Could not generate static params for items:", err);
  }
  return [{ slug: "_none" }];
}

export default async function EnglishDatoPage({ params }: PageProps) {
  const resolvedParams = await params;
  return <DatoClientView slug={resolvedParams.slug} lang="en" />;
}
