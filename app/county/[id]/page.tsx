import fs from "node:fs";
import path from "node:path";
import CountyClientView from "./CountyClientView";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  try {
    const countiesPath = path.join(process.cwd(), "data", "counties.json");
    if (fs.existsSync(countiesPath)) {
      const counties = JSON.parse(fs.readFileSync(countiesPath, "utf-8"));
      return counties.map((c: { id: string }) => ({ id: c.id }));
    }
  } catch (err) {
    console.error("Error generating static params for counties:", err);
  }
  return [{ id: "1001" }];
}

export default async function CountyDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  return <CountyClientView countyId={resolvedParams.id} />;
}
