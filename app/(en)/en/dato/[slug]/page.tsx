import {
  renderIndicatorPage,
  generateIndicatorMetadata,
  generateIndicatorStaticParams,
} from "@/src/server/page-factories";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return generateIndicatorStaticParams();
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  return generateIndicatorMetadata("en", slug);
}

export default async function EnglishDatoPage({ params }: PageProps) {
  const { slug } = await params;
  return renderIndicatorPage("en", slug);
}
