/**
 * CONSOLIDATED TYPESCRIPT & TSX CODE DUMP
 * Generated on: 2026-11-18T13:21:06.201Z
 */

// ==========================================
// FILE: app/county/[id]/CountyClientView.tsx
// ==========================================

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GlobalMetadata, CountyDetail } from "@/types";
import { fetchMetadata, fetchCountyDetail, DATA_BASE_URL } from "@/lib/data-utils";
import InteractiveChart from "@/components/detail/InteractiveChart";
import SourceCard from "@/components/detail/SourceCard";
import { ArrowLeft, MapPin, Calendar, Loader2, AlertCircle, Filter } from "lucide-react";

interface CountyClientViewProps {
  countyId: string;
}

export default function CountyClientView({ countyId }: CountyClientViewProps) {
  const [metadata, setMetadata] = useState<GlobalMetadata | null>(null);
  const [county, setCounty] = useState<CountyDetail | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCountyData() {
      try {
        setLoading(true);
        setError(null);
        const [metaData, countyData] = await Promise.all([
          fetchMetadata(),
          fetchCountyDetail(countyId),
        ]);

        if (!countyData) {
          setError(`County record '${countyId}' not found.`);
          return;
        }

        setMetadata(metaData);
        setCounty(countyData);

        const availableMetrics = Object.keys(countyData.metrics || {});
        if (availableMetrics.length > 0) {
          setSelectedMetric(availableMetrics[0]);
        }
      } catch (err) {
        console.error("Failed to lazy-load county detail:", err);
        setError(`Failed to fetch county data from ${DATA_BASE_URL}/counties/${countyId}.json`);
      } finally {
        setLoading(false);
      }
    }

    loadCountyData();
  }, [countyId]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
        <p className="text-sm font-semibold text-slate-700">
          Lazy-loading county detail JSON via HTTP...
        </p>
      </div>
    );
  }

  if (error || !county) {
    return (
      <div className="space-y-4">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-3.5 py-2 rounded-full transition-colors shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Explorer</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
          <AlertCircle className="w-6 h-6 text-red-600 mx-auto" />
          <h2 className="text-base font-bold text-slate-900">{error || "County Not Found"}</h2>
          <p className="text-xs text-slate-500">
            Requested County ID: {countyId}
          </p>
        </div>
      </div>
    );
  }

  const metricKeys = Object.keys(county.metrics || {});
  const currentMetricData = selectedMetric && county.metrics ? county.metrics[selectedMetric] : undefined;
  const currentMetricMeta = metadata?.metrics ? metadata.metrics[selectedMetric] : undefined;

  const unit = currentMetricData?.unit || currentMetricMeta?.unit || "";
  const title = currentMetricMeta?.title || selectedMetric;

  return (
    <article className="space-y-6 animate-in fade-in duration-200">
      {/* Back Button */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-3.5 py-2 rounded-full transition-colors shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Explorer</span>
        </Link>
      </div>

      {/* Header */}
      <header className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-xs font-semibold">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              {county.state ? `${county.name}, ${county.state}` : county.name}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2 tracking-tight">
              {county.name} Dashboard
            </h1>
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full self-start sm:self-auto">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Updated: {county.last_updated || metadata?.last_updated}</span>
          </div>
        </div>
      </header>

      {/* Metric Selector Tabs */}
      {metricKeys.length > 1 && (
        <section className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5" />
            <span>Select Metric Series</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {metricKeys.map((key) => {
              const meta = metadata?.metrics ? metadata.metrics[key] : undefined;
              const isSelected = selectedMetric === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedMetric(key)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isSelected
                      ? "bg-slate-900 text-white shadow-sm ring-1 ring-slate-900"
                      : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {meta?.title || key}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Interactive Time-Series Chart */}
      {currentMetricData && (
        <section>
          <InteractiveChart
            series={currentMetricData.series}
            chartType="line"
            unit={unit}
            title={title}
          />
        </section>
      )}

      {/* Source Attribution & Traceability Card */}
      <section>
        <SourceCard
          source={currentMetricMeta?.source}
          lastUpdated={county.last_updated || metadata?.last_updated}
        />
      </section>
    </article>
  );
}


// ==========================================
// FILE: app/county/[id]/page.tsx
// ==========================================

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


// ==========================================
// FILE: app/dato/[slug]/DatoClientView.tsx
// ==========================================

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DatoItem } from "@/types";
import { fetchItemDetail, DATA_BASE_URL } from "@/lib/data-utils";
import InteractiveChart from "@/components/detail/InteractiveChart";
import SourceCard from "@/components/detail/SourceCard";
import { ArrowLeft, Tag, Loader2, AlertCircle } from "lucide-react";

interface DatoClientViewProps {
  slug: string;
}

export default function DatoClientView({ slug }: DatoClientViewProps) {
  const [dato, setDato] = useState<DatoItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadItem() {
      if (slug === "_none") {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const item = await fetchItemDetail(slug);
        if (!item) {
          setError(`No se encontró el dato '${slug}'.`);
        } else {
          setDato(item);
        }
      } catch (err) {
        console.error("Error cargando el dato:", err);
        setError(`Error al obtener el dato desde ${DATA_BASE_URL}/items/${slug}.json`);
      } finally {
        setLoading(false);
      }
    }
    loadItem();
  }, [slug]);

  if (loading) {
    return (
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-12 text-center space-y-3">
        <Loader2 className="w-6 h-6 animate-spin text-blue-400 mx-auto" />
        <p className="text-sm font-semibold text-slate-300">Cargando dato vía HTTP...</p>
      </div>
    );
  }

  if (error || !dato || slug === "_none") {
    return (
      <div className="space-y-4">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3.5 py-2 rounded-full transition-colors shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al explorador</span>
          </Link>
        </div>

        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 text-center space-y-3">
          <AlertCircle className="w-6 h-6 text-red-500 mx-auto" />
          <h2 className="text-base font-bold text-white">
            {error || "No hay datos registrados aún"}
          </h2>
          <p className="text-xs text-slate-400">
            Puedes añadir un nuevo dato JSON en <code className="bg-slate-800 px-1 py-0.5 rounded text-slate-300">data/items/{slug}.json</code>
          </p>
        </div>
      </div>
    );
  }

  const isImmigrationItem = dato.id === "inmigracion-procedencia" || Boolean((dato as any).annualBlocks);

  const seriesPoints = dato.dataPoints.map((dp) => {
    let val = 0;
    const rawVal = dp.value as any;
    if (typeof rawVal === "number") {
      val = rawVal;
    } else if (Array.isArray(rawVal)) {
      const totalObj = rawVal.find((item: any) => item && typeof item === "object" && "total" in item) || rawVal[0];
      val = totalObj ? (Object.values(totalObj)[0] as number) : 0;
    }
    return {
      year: dp.year || dp.date || "",
      date: dp.date || dp.year || "",
      value: val,
    };
  });

  return (
    <article className="space-y-6 animate-in fade-in duration-200">
      {/* Botón Volver */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3.5 py-2 rounded-full transition-colors shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al explorador</span>
        </Link>
      </div>

      {/* Categoría Badge */}
      <div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-950 text-blue-300 border border-blue-800/80 rounded-lg text-xs font-semibold">
          <Tag className="w-3 h-3 text-blue-400" />
          {dato.category}
        </span>
      </div>

      {/* 1. La Pregunta (H1) */}
      <header className="space-y-2">
        <h1 className="text-xl sm:text-2xl font-bold text-white leading-snug tracking-tight">
          {dato.question}
        </h1>
      </header>

      {/* 2. El Gráfico Interactivo */}
      <section>
        <InteractiveChart
          series={seriesPoints}
          rawPoints={dato.dataPoints}
          continentsPoints={(dato as any).continentsDataPoints}
          chartType={dato.chartType || "line"}
          unit={dato.unit}
          item={dato}
        />
      </section>

      {/* 3. Trazabilidad (solo si no lo renderiza ya ImmigrationView) */}
      {!isImmigrationItem && (dato.sources?.length || dato.source) && (
        <section>
          <SourceCard
            sources={dato.sources}
            source={dato.source}
            lastUpdated={dato.source?.lastUpdated || dato.last_updated}
          />
        </section>
      )}
    </article>
  );
}


// ==========================================
// FILE: app/dato/[slug]/page.tsx
// ==========================================

import fs from "node:fs";
import path from "node:path";
import DatoClientView from "./DatoClientView";

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

export default async function DatoPage({ params }: PageProps) {
  const resolvedParams = await params;
  return <DatoClientView slug={resolvedParams.slug} />;
}


// ==========================================
// FILE: app/layout.tsx
// ==========================================

import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Factor.es | Datos oficiales de España sin filtro político",
  description:
    "Plataforma minimalista y neutral para consultar series históricas oficiales del INE, CIS, Banco de España y Ministerios en 2 clics.",
  keywords: [
    "datos oficiales españa",
    "INE",
    "estadisticas españa",
    "paro juvenil",
    "precio alquiler",
    "sanidad publica",
    "pensiones",
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#020617",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen flex flex-col bg-slate-950 text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
        <Header />
        <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}


// ==========================================
// FILE: app/not-found.tsx
// ==========================================

import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-4 px-4">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center">
        <AlertCircle className="w-6 h-6 text-blue-600" />
      </div>
      <h1 className="text-xl font-bold text-slate-900">Página no encontrada</h1>
      <p className="text-xs text-slate-500 max-w-sm">
        El dato o página que buscas no existe o ha sido movido.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 px-4 py-2.5 rounded-xl transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver al explorador</span>
      </Link>
    </div>
  );
}


// ==========================================
// FILE: app/page.tsx
// ==========================================

"use client";

import { useEffect, useState } from "react";
import { ItemIndexItem, DatoItem, Category } from "@/types";
import { fetchMetadata, fetchItems, fetchItemDetail } from "@/lib/data-utils";
import DirectorySection from "@/components/directory/DirectorySection";
import SearchBar from "@/components/home/SearchBar";
import { Loader2, Database, BarChart3, ShieldCheck } from "lucide-react";

const CATEGORIES: Category[] = [
  "Pensiones y Demografía",
  "Economía y Empleo",
  "Vivienda",
  "Sanidad",
];

export default function HomePage() {
  const [items, setItems] = useState<ItemIndexItem[]>([]);
  const [detailsMap, setDetailsMap] = useState<Record<string, DatoItem>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const indexItems = await fetchItems();
        setItems(indexItems);

        // Fetch details for all items to power sparklines and precise metadata
        const details: Record<string, DatoItem> = {};
        await Promise.all(
          indexItems.map(async (i) => {
            const detail = await fetchItemDetail(i.id);
            if (detail) {
              details[i.id] = detail;
            }
          })
        );
        setDetailsMap(details);
      } catch (err) {
        console.error("Error cargando directorio:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredCategories = CATEGORIES.map((category) => {
    const categoryItems = items.filter((item) => {
      if (item.category !== category) return false;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      const detail = detailsMap[item.id];
      const desc = detail?.contextNotes?.[0] || "";
      return (
        item.question.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        desc.toLowerCase().includes(q)
      );
    });
    return { category, items: categoryItems };
  }).filter((sec) => sec.items.length > 0);

  const scrollToSection = (cat: string) => {
    const el = document.getElementById(`section-${cat}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="max-w-[900px] w-full mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Top Editorial Header */}
      <header className="space-y-4 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-md">
            <BarChart3 className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Factor<span className="text-blue-400">.es</span>
          </h1>
        </div>
        <p className="text-sm text-slate-400 max-w-xl">
          Directorio unificado de indicadores oficiales de España. Cifras abreviadas, trazabilidad directa y cero ruido político.
        </p>
      </header>

      {/* Navigation Anchor Bar */}
      <nav className="sticky top-16 z-30 bg-[#070B14]/90 backdrop-blur-md py-3 border-b border-white/[0.06] overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 min-w-max">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => scrollToSection(cat)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.06] transition-colors"
            >
              {cat}
            </button>
          ))}
        </div>
      </nav>

      {/* Integrated Search Bar */}
      <section>
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      </section>

      {/* Main Unified Container */}
      <main className="space-y-8">
        {loading ? (
          <div className="bg-[#0B101D] rounded-2xl border border-slate-800 p-12 text-center space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">Cargando directorio unificado...</p>
          </div>
        ) : filteredCategories.length > 0 ? (
          <div className="space-y-8">
            {filteredCategories.map(({ category, items }) => (
              <DirectorySection
                key={category}
                category={category}
                items={items}
                detailsMap={detailsMap}
              />
            ))}
          </div>
        ) : (
          <div className="bg-[#0B101D] rounded-2xl border border-slate-800 p-12 text-center space-y-3">
            <Database className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-sm font-semibold text-white">
              No se encontraron indicadores que coincidan con &quot;{searchQuery}&quot;.
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors mt-2"
            >
              Limpiar búsqueda
            </button>
          </div>
        )}
      </main>
    </div>
  );
}


// ==========================================
// FILE: components/detail/InteractiveChart.tsx
// ==========================================

"use client";

import { useState, useMemo } from "react";
import { MetricSeriesPoint } from "@/types";
import ImmigrationView from "./immigration/ImmigrationView";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

interface RawDataPoint {
  year: string;
  value: number | Array<Record<string, number>>;
}

interface InteractiveChartProps {
  series: MetricSeriesPoint[];
  rawPoints?: RawDataPoint[];
  continentsPoints?: RawDataPoint[];
  chartType?: "line" | "bar" | "fiscal";
  unit: string;
  title?: string;
  item?: any;
}

const ITEM_LABELS: Record<string, string> = {
  // Países
  colombia: "Colombia",
  marruecos: "Marruecos",
  venezuela: "Venezuela",
  peru: "Perú",
  argentina: "Argentina",
  ecuador: "Ecuador",
  rumania: "Rumanía",
  "resto-de-sudamerica": "Resto de Sudamérica",
  "resto-de-centro-america-y-caribe": "Resto de Centro América y Caribe",
  "resto-de-europa": "Resto de Europa",
  "resto-de-africa": "Resto de África",
  "resto-de-asia": "Resto de Asia",
  "resto-de-america-del-norte": "Resto de América del Norte",
  "resto-de-oceania": "Resto de Oceanía",

  // Continentes / Macro-regiones
  "america-latina": "América Latina",
  europa: "Europa",
  africa: "África",
  asia: "Asia",
  "america-del-norte": "América del Norte",
  oceania: "Oceanía",

  // Saldo Fiscal y Nacionalidad
  "ratio-extranjeros": "Población Extranjera",
  "ratio-espanoles": "Población Española",
  "saldo-capita-extranjeros": "Extranjeros (€/hab)",
  "saldo-capita-espanoles": "Españoles (€/hab)",

  // Contabilidad Fine-Grained Estado (IGAE S.13 SEC-2010)
  "contribucion-extranjeros": "Ingresos: Extranjeros",
  "contribucion-espanoles": "Ingresos: Españoles",
  "ingresos-impuesto-sociedades": "Ingresos: Impuesto Sociedades",
  "ingresos-impuestos-especiales": "Ingresos: Impuestos Especiales",
  "ingresos-tasas-precios-publicos": "Ingresos: Tasas y Precios Públicos",
  "ingresos-fondos-ue": "Ingresos: Fondos UE",
  "ingresos-rentas-patrimoniales": "Ingresos: Rentas Patrimoniales",

  "gasto-extranjeros": "Gastos: Extranjeros",
  "gasto-espanoles": "Gastos: Españoles",
  "gastos-intereses-deuda": "Gastos: Intereses Deuda",
  "gastos-defensa-fuerzas-armadas": "Gastos: Defensa y FFAA",
  "gastos-seguridad-ciudadana-justicia": "Gastos: Seguridad y Justicia",
  "gastos-infraestructuras-transportes": "Gastos: Infraestructuras",
  "gastos-medio-ambiente-investigacion": "Gastos: Medio Ambiente e I+D",
  "gastos-servicios-generales-admon": "Gastos: Admon. General",

  "igae-deficit-total": "Déficit / Superávit Real Consolidado",
};

const ITEM_COLORS: Record<string, string> = {
  // Países
  colombia: "#1E40AF",
  marruecos: "#047857",
  venezuela: "#B91C1C",
  peru: "#D97706",
  argentina: "#7C3AED",
  ecuador: "#16A34A",
  rumania: "#0891B2",
  "resto-de-sudamerica": "#3B82F6",
  "resto-de-centro-america-y-caribe": "#F59E0B",
  "resto-de-europa": "#06B6D4",
  "resto-de-africa": "#10B981",
  "resto-de-asia": "#EAB308",
  "resto-de-america-del-norte": "#A855F7",
  "resto-de-oceania": "#94A3B8",

  // Continentes
  "america-latina": "#1E40AF",
  europa: "#0891B2",
  africa: "#047857",
  asia: "#EAB308",
  "america-del-norte": "#7C3AED",
  oceania: "#94A3B8",

  // Saldo Fiscal
  "ratio-extranjeros": "#059669",             // Verde Esmeralda (Superávit)
  "ratio-espanoles": "#64748B",               // Gris Pizarra
  "saldo-capita-extranjeros": "#059669",      // Verde Esmeralda
  "saldo-capita-espanoles": "#64748B",        // Gris Pizarra

  // Ingresos Fine-Grained
  "contribucion-extranjeros": "#059669",      // Verde Esmeralda (Base)
  "contribucion-espanoles": "#1E40AF",        // Azul Marino (Centro)
  "ingresos-impuesto-sociedades": "#7C3AED",  // Violeta
  "ingresos-impuestos-especiales": "#D97706", // Ámbar
  "ingresos-tasas-precios-publicos": "#0891B2",// Turquesa
  "ingresos-fondos-ue": "#475569",            // Gris Pizarra
  "ingresos-rentas-patrimoniales": "#64748B",  // Gris Medio

  // Gastos Fine-Grained
  "gasto-extranjeros": "#34D399",             // Verde Menta (Base)
  "gasto-espanoles": "#60A5FA",              // Azul Cielo (Centro)
  "gastos-intereses-deuda": "#B91C1C",        // Borgoña
  "gastos-defensa-fuerzas-armadas": "#475569",// Gris Pizarra
  "gastos-seguridad-ciudadana-justicia": "#64748B",
  "gastos-infraestructuras-transportes": "#16A34A",
  "gastos-medio-ambiente-investigacion": "#06B6D4",
  "gastos-servicios-generales-admon": "#94A3B8", // Gris Claro

  "igae-deficit-total": "#EAB308",            // Amarillo
};

function formatLabel(slug: string): string {
  if (ITEM_LABELS[slug]) return ITEM_LABELS[slug];
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatSpanishNumber(val: number): string {
  if (Math.abs(val) >= 1_000_000) {
    return `${(val / 1_000_000).toLocaleString("es-ES", { maximumFractionDigits: 2 })}M`;
  }
  return val.toLocaleString("es-ES");
}

function CustomFiscalTooltip({ active, payload, label, fiscalTab }: any) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs max-w-xs space-y-2">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 font-bold">
        <span>Año {label}</span>
        <span className="text-blue-400 font-semibold">
          {fiscalTab === "ratio"
            ? "Ratio Contribución/Gasto"
            : fiscalTab === "capita"
            ? "Saldo Neto (€/hab)"
            : "Balance Total Estado (IGAE S.13)"}
        </span>
      </div>
      <div className="space-y-1.5 text-[11px]">
        {payload.map((entry: any, i: number) => {
          const labelText = formatLabel(entry.dataKey || entry.name);
          const val = Number(entry.value) || 0;
          let displayVal = "";
          if (fiscalTab === "ratio") {
            displayVal = `${val.toFixed(1)}% (${val >= 100 ? "Superávit" : "Déficit"})`;
          } else if (fiscalTab === "capita") {
            displayVal = `${val >= 0 ? "+" : ""}${val.toLocaleString("es-ES")} €/hab`;
          } else {
            displayVal = `${val.toLocaleString("es-ES")} MM€`;
          }

          return (
            <div key={i} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="truncate text-slate-300">{labelText}</span>
              </div>
              <span className="font-semibold text-white tabular-nums">
                {displayVal}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CustomTooltipContent({ active, payload, label, unit }: any) {
  if (!active || !payload || !payload.length) return null;

  const total = payload.reduce(
    (sum: number, entry: any) => sum + (Number(entry.value) || 0),
    0
  );

  return (
    <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs max-w-xs space-y-2">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 font-bold">
        <span>Año {label}</span>
        <span className="text-blue-400 font-extrabold">
          {total.toLocaleString("es-ES")} {unit}
        </span>
      </div>
      <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1 text-[11px]">
        {payload
          .slice()
          .reverse()
          .map((entry: any, i: number) => {
            const labelText = formatLabel(entry.dataKey || entry.name);
            const val = Number(entry.value) || 0;

            return (
              <div key={i} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="truncate text-slate-300">{labelText}</span>
                </div>
                <span className="font-semibold text-white tabular-nums">
                  {val.toLocaleString("es-ES")} {unit}
                </span>
              </div>
            );
          })}
      </div>
    </div>
  );
}

export default function InteractiveChart({
  series,
  rawPoints = [],
  chartType = "line",
  unit,
  title,
  item,
}: InteractiveChartProps) {
  if (item && (item.id === "inmigracion-procedencia" || item.annualBlocks)) {
    return <ImmigrationView item={item} />;
  }
  const isFiscalCard = rawPoints.some((p) =>
    Array.isArray(p.value) && p.value.some((v) => "ratio-extranjeros" in v)
  );

  const [fiscalTab, setFiscalTab] = useState<"ratio" | "capita" | "total">("ratio");
  const [scaleMode, setScaleMode] = useState<"abs" | "percent">("abs");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  // Transformar datos para Recharts
  const { chartData, itemKeys, fiscalAbsData, fiscalPctData } = useMemo(() => {
    if (!rawPoints || rawPoints.length === 0) {
      return { chartData: series, itemKeys: [], fiscalAbsData: [], fiscalPctData: [] };
    }

    const keysSet = new Set<string>();
    const fAbsData: any[] = [];
    const fPctData: any[] = [];
    const cData: any[] = [];

    rawPoints.forEach((p) => {
      const yearStr = String(p.year);
      const row: Record<string, any> = { year: yearStr, date: yearStr };

      if (Array.isArray(p.value)) {
        p.value.forEach((item) => {
          if (item && typeof item === "object") {
            const [k, v] = Object.entries(item)[0] || [];
            if (k && k !== "total" && typeof v === "number") {
              row[k] = v;
              keysSet.add(k);
            }
          }
        });
      }
      cData.push(row);

      const tot_ing = row["igae-ingresos-total"] || 1;
      const tot_gas = row["igae-gastos-total"] || 1;

      const pctRow: Record<string, any> = { year: yearStr, date: yearStr };
      Object.entries(row).forEach(([k, v]) => {
        if (typeof v === "number") {
          if (k.startsWith("contribucion") || k.startsWith("ingresos")) {
            pctRow[k] = (v / tot_ing) * 100;
          } else if (k.startsWith("gasto")) {
            pctRow[k] = (v / tot_gas) * 100;
          } else {
            pctRow[k] = v;
          }
        }
      });

      fAbsData.push(row);
      fPctData.push(pctRow);
    });

    const sortedKeys = Array.from(keysSet);
    return { chartData: cData, itemKeys: sortedKeys, fiscalAbsData: fAbsData, fiscalPctData: fPctData };
  }, [rawPoints, series]);

  if (!series || series.length === 0) {
    return (
      <div className="w-full bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
        Sin datos disponibles.
      </div>
    );
  }

  const firstDate = series[0]?.date || series[0]?.year || "2015";
  const lastDate =
    series[series.length - 1]?.date ||
    series[series.length - 1]?.year ||
    "2024";

  // RENDERIZADO PARA TARJETA DE SALDO FISCAL
  if (isFiscalCard) {
    const activeFiscalData = scaleMode === "percent" ? fiscalPctData : fiscalAbsData;

    return (
      <div className="w-full bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-5">
        {/* Header y Control de Pestañas alineado en UNA SOLA FILA HORIZONTAL */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            {title && <h3 className="text-sm font-bold text-slate-900">{title}</h3>}
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
              {fiscalTab === "ratio"
                ? `1. Comparativa Ratio Contribución / Gasto (%)`
                : fiscalTab === "capita"
                ? `2. Saldo Neto Anual (€ Per Cápita)`
                : `3. Balance Total Estado IGAE S.13 (${scaleMode === "percent" ? "% 100%" : "MM€"} — Categorías Fine-Grained)`}
            </div>
          </div>

          {/* Alineación Horizontal Única de Pestañas */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold gap-0.5">
              <button
                onClick={() => setFiscalTab("ratio")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  fiscalTab === "ratio"
                    ? "bg-white text-blue-700 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                1. Ratio (%)
              </button>
              <button
                onClick={() => setFiscalTab("capita")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  fiscalTab === "capita"
                    ? "bg-white text-blue-700 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                2. Saldo (€/hab)
              </button>
              <button
                onClick={() => setFiscalTab("total")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  fiscalTab === "total"
                    ? "bg-white text-blue-700 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🏛️ 3. Total Estado
              </button>
            </div>

            {/* Conmutador de Escala (MM€ | %) para Pestaña 3 */}
            {fiscalTab === "total" && (
              <div className="inline-flex rounded-xl bg-slate-200/80 p-1 text-xs font-semibold">
                <button
                  onClick={() => setScaleMode("abs")}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    scaleMode === "abs"
                      ? "bg-white text-slate-900 shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  MM€
                </button>
                <button
                  onClick={() => setScaleMode("percent")}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    scaleMode === "percent"
                      ? "bg-white text-slate-900 shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  % 100%
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Gráficos según la Pestaña Seleccionada */}
        <div className="h-80 sm:h-96 w-full touch-pan-y">
          <ResponsiveContainer width="100%" height="100%">
            {fiscalTab === "ratio" ? (
              // PESTAÑA 1: RATIO FISCAL CONTRIBUCIÓN / GASTO (%)
              <LineChart
                data={fiscalAbsData}
                margin={{ top: 10, right: 15, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="year"
                  tickLine={false}
                  axisLine={{ stroke: "#cbd5e1" }}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  dy={6}
                />
                <YAxis
                  width={55}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  domain={[0, 220]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip content={<CustomFiscalTooltip fiscalTab="ratio" unit="%" />} />
                <ReferenceLine
                  y={100}
                  stroke="#94a3b8"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: "100% (Equilibrio Fiscal)",
                    fill: "#64748b",
                    fontSize: 10,
                    position: "insideTopRight",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="ratio-extranjeros"
                  name="Población Extranjera"
                  stroke={ITEM_COLORS["ratio-extranjeros"]}
                  strokeWidth={3}
                  dot={{ r: 5, fill: ITEM_COLORS["ratio-extranjeros"] }}
                  activeDot={{ r: 7 }}
                />
                <Line
                  type="monotone"
                  dataKey="ratio-espanoles"
                  name="Población Española"
                  stroke={ITEM_COLORS["ratio-espanoles"]}
                  strokeWidth={3}
                  dot={{ r: 5, fill: ITEM_COLORS["ratio-espanoles"] }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            ) : fiscalTab === "capita" ? (
              // PESTAÑA 2: SALDO NETO ANUAL (€ PER CÁPITA)
              <LineChart
                data={fiscalAbsData}
                margin={{ top: 10, right: 15, left: 15, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="year"
                  tickLine={false}
                  axisLine={{ stroke: "#cbd5e1" }}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  dy={6}
                />
                <YAxis
                  width={75}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  domain={[-4000, 3000]}
                  tickFormatter={(v) => `${v > 0 ? "+" : ""}${v.toLocaleString("es-ES")} €`}
                />
                <Tooltip content={<CustomFiscalTooltip fiscalTab="capita" unit="€/hab" />} />
                <ReferenceLine
                  y={0}
                  stroke="#94a3b8"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: "0 €/hab (Saldo Neutro)",
                    fill: "#64748b",
                    fontSize: 10,
                    position: "insideTopRight",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="saldo-capita-extranjeros"
                  name="Extranjeros (€/hab)"
                  stroke={ITEM_COLORS["saldo-capita-extranjeros"]}
                  strokeWidth={3}
                  dot={{ r: 5, fill: ITEM_COLORS["saldo-capita-extranjeros"] }}
                  activeDot={{ r: 7 }}
                />
                <Line
                  type="monotone"
                  dataKey="saldo-capita-espanoles"
                  name="Españoles (€/hab)"
                  stroke={ITEM_COLORS["saldo-capita-espanoles"]}
                  strokeWidth={3}
                  dot={{ r: 5, fill: ITEM_COLORS["saldo-capita-espanoles"] }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            ) : (
              // PESTAÑA 3: BALANCE TOTAL ESTADO (FINE-GRAINED EN APILADO SIMÉTRICO)
              <BarChart
                data={activeFiscalData}
                margin={{ top: 10, right: 15, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="year"
                  tickLine={false}
                  axisLine={{ stroke: "#cbd5e1" }}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  dy={6}
                />
                <YAxis
                  width={75}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  domain={scaleMode === "percent" ? [0, 100] : [0, 800]}
                  tickFormatter={scaleMode === "percent" ? (v) => `${v}%` : formatSpanishNumber}
                />
                <Tooltip content={<CustomFiscalTooltip fiscalTab="total" unit={scaleMode === "percent" ? "%" : "MM€"} />} />
                
                {/* BARRA 1: INGRESOS AAPP (Stack ID ing) FINE-GRAINED */}
                <Bar
                  dataKey="contribucion-extranjeros"
                  name="Ingresos: Extranjeros"
                  stackId="ing"
                  fill={ITEM_COLORS["contribucion-extranjeros"]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="contribucion-espanoles"
                  name="Ingresos: Españoles"
                  stackId="ing"
                  fill={ITEM_COLORS["contribucion-espanoles"]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="ingresos-impuesto-sociedades"
                  name="Ingresos: Impuesto Sociedades"
                  stackId="ing"
                  fill={ITEM_COLORS["ingresos-impuesto-sociedades"]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="ingresos-impuestos-especiales"
                  name="Ingresos: Impuestos Especiales"
                  stackId="ing"
                  fill={ITEM_COLORS["ingresos-impuestos-especiales"]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="ingresos-tasas-precios-publicos"
                  name="Ingresos: Tasas y Precios Públicos"
                  stackId="ing"
                  fill={ITEM_COLORS["ingresos-tasas-precios-publicos"]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="ingresos-fondos-ue"
                  name="Ingresos: Fondos UE"
                  stackId="ing"
                  fill={ITEM_COLORS["ingresos-fondos-ue"]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="ingresos-rentas-patrimoniales"
                  name="Ingresos: Rentas Patrimoniales"
                  stackId="ing"
                  fill={ITEM_COLORS["ingresos-rentas-patrimoniales"]}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={28}
                />

                {/* BARRA 2: GASTOS AAPP (Stack ID gas) FINE-GRAINED */}
                <Bar
                  dataKey="gasto-extranjeros"
                  name="Gastos: Extranjeros"
                  stackId="gas"
                  fill={ITEM_COLORS["gasto-extranjeros"]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="gasto-espanoles"
                  name="Gastos: Españoles"
                  stackId="gas"
                  fill={ITEM_COLORS["gasto-espanoles"]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="gastos-intereses-deuda"
                  name="Gastos: Intereses Deuda"
                  stackId="gas"
                  fill={ITEM_COLORS["gastos-intereses-deuda"]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="gastos-defensa-fuerzas-armadas"
                  name="Gastos: Defensa y FFAA"
                  stackId="gas"
                  fill={ITEM_COLORS["gastos-defensa-fuerzas-armadas"]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="gastos-seguridad-ciudadana-justicia"
                  name="Gastos: Seguridad y Justicia"
                  stackId="gas"
                  fill={ITEM_COLORS["gastos-seguridad-ciudadana-justicia"]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="gastos-infraestructuras-transportes"
                  name="Gastos: Infraestructuras"
                  stackId="gas"
                  fill={ITEM_COLORS["gastos-infraestructuras-transportes"]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="gastos-medio-ambiente-investigacion"
                  name="Gastos: Medio Ambiente e I+D"
                  stackId="gas"
                  fill={ITEM_COLORS["gastos-medio-ambiente-investigacion"]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="gastos-servicios-generales-admon"
                  name="Gastos: Admon. General"
                  stackId="gas"
                  fill={ITEM_COLORS["gastos-servicios-generales-admon"]}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Leyenda Explicativa de la Pestaña */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {fiscalTab === "ratio" || fiscalTab === "capita" ? (
              <>
                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                  <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
                  <span>Población Extranjera</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                  <span className="w-3 h-3 rounded-full bg-slate-500 inline-block" />
                  <span>Población Española</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                  <span className="w-3 h-3 rounded-md bg-emerald-600 inline-block" />
                  <span>Extranjeros</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                  <span className="w-3 h-3 rounded-md bg-blue-800 inline-block" />
                  <span>Españoles</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                  <span className="w-3 h-3 rounded-md bg-purple-700 inline-block" />
                  <span>Imp. Sociedades</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                  <span className="w-3 h-3 rounded-md bg-amber-600 inline-block" />
                  <span>Imp. Especiales/Tasas</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                  <span className="w-3 h-3 rounded-md bg-red-700 inline-block" />
                  <span>Intereses Deuda</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                  <span className="w-3 h-3 rounded-md bg-slate-600 inline-block" />
                  <span>Defensa/Seguridad</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                  <span className="w-3 h-3 rounded-md bg-green-600 inline-block" />
                  <span>Infraestructuras/I+D</span>
                </div>
              </>
            )}
          </div>
          <span className="text-[11px] text-slate-400">
            {fiscalTab === "ratio"
              ? "Línea horizontal punteada en 100% = Equilibrio fiscal."
              : fiscalTab === "capita"
              ? "Valores por encima de 0 = Aportación neta positiva al sistema."
              : `Ingresos vs Gastos IGAE AAPP desglosados en categorías fine-grained específicas. Escala actual: ${scaleMode === "percent" ? "Porcentual 100%" : "Absoluta MM€"}.`}
          </span>
        </div>
      </div>
    );
  }

  // RENDERIZADO LIMPIO ESTÁNDAR PARA OTRAS TARJETAS
  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          {title && <h3 className="text-sm font-bold text-slate-900">{title}</h3>}
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
            Serie Histórica ({firstDate} — {lastDate})
          </div>
        </div>

        <div className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1.5 rounded-lg">
          {unit}
        </div>
      </div>

      <div className="h-80 sm:h-96 w-full touch-pan-y">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "bar" && itemKeys.length > 0 ? (
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 15, left: 10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="year"
                tickLine={false}
                axisLine={{ stroke: "#cbd5e1" }}
                tick={{ fill: "#64748b", fontSize: 11 }}
                dy={6}
              />
              <YAxis
                width={70}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#64748b", fontSize: 11 }}
                domain={[0, "auto"]}
                tickFormatter={formatSpanishNumber}
              />
              <Tooltip content={<CustomTooltipContent unit={unit} />} />
              {itemKeys.map((k, idx) => {
                const color =
                  ITEM_COLORS[k] || `hsl(${(idx * 43) % 360}, 65%, 45%)`;
                const isSelected = selectedKey === k;
                const isDimmed = selectedKey !== null && !isSelected;

                return (
                  <Bar
                    key={k}
                    dataKey={k}
                    stackId="a"
                    fill={color}
                    fillOpacity={isDimmed ? 0.2 : 1}
                    maxBarSize={42}
                    radius={
                      idx === itemKeys.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]
                    }
                  />
                );
              })}
            </BarChart>
          ) : (
            <LineChart
              data={chartData.length ? chartData : series}
              margin={{ top: 10, right: 15, left: 10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey={chartData.length ? "year" : "date"}
                tickLine={false}
                axisLine={{ stroke: "#cbd5e1" }}
                tick={{ fill: "#64748b", fontSize: 11 }}
                dy={6}
              />
              <YAxis
                width={70}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#64748b", fontSize: 11 }}
                domain={[0, "auto"]}
                tickFormatter={formatSpanishNumber}
              />
              <Tooltip content={<CustomTooltipContent unit={unit} />} />
              {itemKeys.length > 0 ? (
                itemKeys.map((k, idx) => {
                  const color =
                    ITEM_COLORS[k] || `hsl(${(idx * 43) % 360}, 65%, 45%)`;
                  const isSelected = selectedKey === k;
                  const isDimmed = selectedKey !== null && !isSelected;

                  return (
                    <Line
                      key={k}
                      type="monotone"
                      dataKey={k}
                      name={formatLabel(k)}
                      stroke={color}
                      strokeWidth={isSelected ? 4 : isDimmed ? 1 : 2.5}
                      strokeOpacity={isDimmed ? 0.2 : 1}
                      dot={isSelected ? { r: 5, fill: color } : false}
                      activeDot={{ r: 6, strokeWidth: 2 }}
                    />
                  );
                })
              ) : (
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#2563eb", stroke: "#ffffff", strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: "#1d4ed8", stroke: "#ffffff", strokeWidth: 2 }}
                />
              )}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {itemKeys.length > 0 && (
        <div className="space-y-2 border-t border-slate-100 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Leyenda (Haz clic para destacar):
            </span>
            {selectedKey && (
              <button
                onClick={() => setSelectedKey(null)}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Restablecer
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {itemKeys.map((k, idx) => {
              const color =
                ITEM_COLORS[k] || `hsl(${(idx * 43) % 360}, 65%, 45%)`;
              const isSelected = selectedKey === k;
              return (
                <button
                  key={k}
                  onClick={() => setSelectedKey(isSelected ? null : k)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                    isSelected
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs scale-105 font-bold"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span>{formatLabel(k)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-[11px] text-slate-400 text-center">
        Pasa el cursor o toca sobre cualquier punto para consultar el desglose exacto.
      </p>
    </div>
  );
}

// ==========================================
// FILE: components/detail/SourceCard.tsx
// ==========================================

import { ExternalLink, ShieldCheck, Calendar } from "lucide-react";
import { SourceInfo, TraceableSource } from "@/types";

interface SourceCardProps extends TraceableSource {
  lastUpdated?: string;
  defaultInstitution?: string;
}

const DEFAULT_INSTITUTION = "Instituto Nacional de Estadística (INE)";

function normalizeSources(source?: SourceInfo, sources?: SourceInfo[]): SourceInfo[] {
  if (sources && sources.length > 0) return sources;
  if (source) return [source];
  return [];
}

function resolveShortName(source: SourceInfo): string {
  if (source.shortName) return source.shortName;
  const isEmcr = source.title?.includes("EMCR") || source.tableId === "69690";
  return isEmcr ? "EMCR" : "Estadística de Migraciones";
}

function buildSourceKey(source: SourceInfo, fallbackIdx: number): string {
  return `${source.tableId ?? "src"}-${source.period ?? fallbackIdx}-${source.url}`;
}

export default function SourceCard({
  source,
  sources,
  lastUpdated,
  defaultInstitution = DEFAULT_INSTITUTION,
}: SourceCardProps) {
  const sourceList = normalizeSources(source, sources);
  if (sourceList.length === 0) return null;

  const institutionName = sourceList[0]?.institution || defaultInstitution;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Título único de la sección */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          Fuente Oficial de Datos y Trazabilidad
        </span>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-semibold text-white">
          {institutionName}
        </p>
        <p className="text-xs text-slate-400">
          Serie enlazada para auditar y contrastar directamente los dos tramos oficiales de la serie histórica:
        </p>
      </div>

      {/* Lista unificada de fuentes que componen la serie */}
      <div className="space-y-3">
        {sourceList.map((s, idx) => {
          const shortName = resolveShortName(s);
          const effectiveLastUpdated = s.lastUpdated ?? lastUpdated;

          return (
            <div
              key={buildSourceKey(s, idx)}
              className="p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-950/50 border-slate-800 hover:border-slate-700"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-white">
                    {s.title || s.institution}
                  </span>
                  {s.period && (
                    <span className="text-[11px] font-semibold text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-800/80">
                      {s.period}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                  {s.tableId && (
                    <span className="font-mono text-slate-300 font-semibold">
                      Tabla {s.tableId}
                    </span>
                  )}
                  {effectiveLastUpdated && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      Última actualización: {effectiveLastUpdated}
                    </span>
                  )}
                </div>
              </div>

              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-semibold text-blue-300 hover:text-white bg-blue-950 hover:bg-blue-900 px-4 py-2.5 rounded-xl transition-colors border border-blue-800/80 shrink-0 w-full sm:w-auto justify-center"
              >
                <span>
                  {shortName}
                  {s.period ? ` (${s.period})` : ""}
                  {s.tableId ? ` · Tabla ${s.tableId}` : ""} ↗
                </span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ==========================================
// FILE: components/detail/immigration/ConcentricSunburstRanking.tsx
// ==========================================

"use client";

import { useState, useMemo } from "react";
import {
  ImmigrationItem,
  formatSpanishNumber,
  formatCompactSpanish,
  describeArc,
} from "./utils";
import { PieChart, Filter, Sparkles } from "lucide-react";

interface ConcentricSunburstRankingProps {
  item: ImmigrationItem;
  activeDataMap: Record<string, number>;
  totalArrivals: number;
  pinnedCountryId: string | null;
  setPinnedCountryId: (cId: string | null) => void;
  hoveredCountryId: string | null;
  setHoveredCountryId: (cId: string | null) => void;
  selectedTimeframeLabel: string;
}

const BLOCK_COLORS: Record<string, string> = {
  "america-hispanohablante": "#2563EB", // Blue
  "america-no-hispanohablante": "#7C3AED", // Purple
  europa: "#0891B2", // Cyan
  africa: "#059669", // Emerald
  asia: "#D97706", // Amber
  oceania: "#64748B", // Slate
};

export default function ConcentricSunburstRanking({
  item,
  activeDataMap,
  totalArrivals,
  pinnedCountryId,
  setPinnedCountryId,
  hoveredCountryId,
  setHoveredCountryId,
  selectedTimeframeLabel,
}: ConcentricSunburstRankingProps) {
  const [activeDrillBlockId, setActiveDrillBlockId] = useState<string | null>(null);
  const [hoveredSector, setHoveredSector] = useState<{
    type: "block" | "country";
    name: string;
    value: number;
    globalPct: number;
    parentPct?: number;
    color: string;
    id: string;
  } | null>(null);

  // Compute hierarchical sectors for Sunburst / Concentric Rings
  const { blockSectors, countrySectors, blockRankings } = useMemo(() => {
    const totalGlobal = totalArrivals || 1;
    const cx = 240;
    const cy = 240;
    const rInBlock = 80;
    const rOutBlock = 145;
    const rInCountry = 152;
    const rOutCountry = 220;

    let currentAngle = -Math.PI / 2;

    const blocksToRender = activeDrillBlockId
      ? item.blocks.filter((b) => b.id === activeDrillBlockId)
      : item.blocks;

    const blockTotals: Array<{
      id: string;
      name: string;
      color: string;
      total: number;
      countries: Array<{ id: string; name: string; value: number }>;
    }> = [];

    let filteredTotal = 0;
    blocksToRender.forEach((block) => {
      let bSum = 0;
      const cList: Array<{ id: string; name: string; value: number }> = [];

      block.countries.forEach((c) => {
        const val = activeDataMap[c.id] || 0;
        if (val > 0) {
          bSum += val;
          cList.push({ id: c.id, name: c.name, value: val });
        }
      });

      cList.sort((a, b) => b.value - a.value);
      if (bSum > 0) {
        filteredTotal += bSum;
        blockTotals.push({
          id: block.id,
          name: block.name,
          color: BLOCK_COLORS[block.id] || "#64748B",
          total: bSum,
          countries: cList,
        });
      }
    });

    blockTotals.sort((a, b) => b.total - a.total);

    const bSectors: any[] = [];
    const cSectors: any[] = [];

    blockTotals.forEach((block) => {
      const angleSpan = (block.total / (filteredTotal || 1)) * (2 * Math.PI);
      const startAngle = currentAngle;
      const endAngle = currentAngle + angleSpan;

      const pathD = describeArc(cx, cy, rInBlock, rOutBlock, startAngle, endAngle);
      const globalPct = (block.total / totalGlobal) * 100;

      bSectors.push({
        id: block.id,
        name: block.name,
        color: block.color,
        value: block.total,
        globalPct,
        startAngle,
        endAngle,
        pathD,
      });

      let cCurrentAngle = startAngle;
      block.countries.forEach((country) => {
        const cAngleSpan = (country.value / (block.total || 1)) * angleSpan;
        const cStartAngle = cCurrentAngle;
        const cEndAngle = cCurrentAngle + cAngleSpan;

        const cPathD = describeArc(cx, cy, rInCountry, rOutCountry, cStartAngle, cEndAngle);
        const cGlobalPct = (country.value / totalGlobal) * 100;
        const cParentPct = (country.value / block.total) * 100;

        cSectors.push({
          id: country.id,
          name: country.name,
          blockId: block.id,
          blockName: block.name,
          color: block.color,
          value: country.value,
          globalPct: cGlobalPct,
          parentPct: cParentPct,
          startAngle: cStartAngle,
          endAngle: cEndAngle,
          pathD: cPathD,
        });

        cCurrentAngle = cEndAngle;
      });

      currentAngle = endAngle;
    });

    return { blockSectors: bSectors, countrySectors: cSectors, blockRankings: blockTotals };
  }, [item, activeDataMap, totalArrivals, activeDrillBlockId]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl space-y-6">
      {/* Header & Drilldown Reset */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <PieChart className="w-4 h-4 text-purple-400" />
            Distribución Concéntrica (Anillo 1: Continentes → Anillo 2: Países)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {selectedTimeframeLabel} • Visualización jerárquica de 360° del flujo migratorio hacia España.
          </p>
        </div>

        {activeDrillBlockId && (
          <button
            onClick={() => setActiveDrillBlockId(null)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Filter className="w-3.5 h-3.5" />
            Mostrar todos los continentes
          </button>
        )}
      </div>

      {/* Continents Legend Bar */}
      <div className="flex flex-wrap items-center justify-center gap-2 bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 text-xs">
        <span className="font-semibold text-slate-400 flex items-center gap-1 mr-2">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          Continentes (Anillo 1):
        </span>
        {blockRankings.map((block) => (
          <button
            key={block.id}
            onClick={() => setActiveDrillBlockId(activeDrillBlockId === block.id ? null : block.id)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border transition-all ${
              activeDrillBlockId === block.id
                ? "bg-slate-900 border-blue-500 ring-1 ring-blue-500 font-bold"
                : "bg-slate-900/60 border-slate-700 hover:bg-slate-900"
            }`}
          >
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: block.color }} />
            <span className="text-white">{block.name}</span>
            <span className="text-slate-400 font-mono text-[10px]">
              ({((block.total / (totalArrivals || 1)) * 100).toFixed(1)}%)
            </span>
          </button>
        ))}
      </div>

      {/* Sunburst Centered Canvas */}
      <div className="flex flex-col items-center justify-center relative">
        <div className="relative w-full max-w-[460px] aspect-square">
          <svg viewBox="0 0 480 480" className="w-full h-full overflow-visible">
            {/* Inner Ring (Continents) */}
            {blockSectors.map((sector) => {
              const isHovered = hoveredSector?.id === sector.id;
              const isDrilled = activeDrillBlockId === sector.id;

              return (
                <path
                  key={sector.id}
                  d={sector.pathD}
                  fill={sector.color}
                  fillOpacity={isHovered || isDrilled ? 1 : 0.88}
                  stroke="#060913"
                  strokeWidth="2.5"
                  className="cursor-pointer transition-all duration-200 hover:scale-[1.015] origin-center"
                  onMouseEnter={() =>
                    setHoveredSector({
                      type: "block",
                      name: sector.name,
                      value: sector.value,
                      globalPct: sector.globalPct,
                      color: sector.color,
                      id: sector.id,
                    })
                  }
                  onMouseLeave={() => setHoveredSector(null)}
                  onClick={() =>
                    setActiveDrillBlockId(activeDrillBlockId === sector.id ? null : sector.id)
                  }
                >
                  <title>
                    {sector.name}: {formatSpanishNumber(sector.value)} ({sector.globalPct.toFixed(1)}%)
                  </title>
                </path>
              );
            })}

            {/* Outer Ring (Countries) */}
            {countrySectors.map((sector) => {
              const isHovered = hoveredSector?.id === sector.id;
              const isPinned = pinnedCountryId === sector.id;

              return (
                <path
                  key={sector.id}
                  d={sector.pathD}
                  fill={sector.color}
                  fillOpacity={isHovered || isPinned ? 1 : 0.8}
                  stroke="#060913"
                  strokeWidth="1.5"
                  className="cursor-pointer transition-all duration-200 hover:scale-[1.02] origin-center"
                  onMouseEnter={() =>
                    setHoveredSector({
                      type: "country",
                      name: sector.name,
                      value: sector.value,
                      globalPct: sector.globalPct,
                      parentPct: sector.parentPct,
                      color: sector.color,
                      id: sector.id,
                    })
                  }
                  onMouseLeave={() => setHoveredSector(null)}
                  onClick={() =>
                    setPinnedCountryId(pinnedCountryId === sector.id ? null : sector.id)
                  }
                >
                  <title>
                    {sector.name}: {formatSpanishNumber(sector.value)} ({sector.globalPct.toFixed(1)}% del total, {sector.parentPct.toFixed(1)}% de {sector.blockName})
                  </title>
                </path>
              );
            })}

            {/* Center Circle */}
            <circle cx="240" cy="240" r="70" fill="#060913" className="drop-shadow-lg" />
            <g className="text-center pointer-events-none">
              <text
                x="240"
                y="220"
                textAnchor="middle"
                className="text-[11px] font-bold fill-slate-400 uppercase tracking-widest"
              >
                Total Global
              </text>
              <text
                x="240"
                y="248"
                textAnchor="middle"
                className="text-lg font-black fill-white font-mono"
              >
                {formatCompactSpanish(totalArrivals)}
              </text>
              <text
                x="240"
                y="266"
                textAnchor="middle"
                className="text-[11px] font-semibold fill-slate-400"
              >
                personas
              </text>
            </g>
          </svg>
        </div>

        {/* Hover Tooltip Card */}
        <div className="h-14 mt-4 flex items-center justify-center">
          {hoveredSector ? (
            <div className="bg-slate-800 text-white rounded-xl px-4 py-2 text-center text-xs shadow-lg flex items-center gap-2 border border-slate-700">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: hoveredSector.color }} />
              <div>
                <span className="font-bold">{hoveredSector.name}: </span>
                <span className="font-mono text-yellow-300 font-semibold">
                  {formatSpanishNumber(hoveredSector.value)} personas
                </span>
                <span className="text-slate-400 ml-1.5 font-mono">
                  ({hoveredSector.globalPct.toFixed(1)}% del total
                  {hoveredSector.parentPct !== undefined ? `, ${hoveredSector.parentPct.toFixed(1)}% del bloque` : ""})
                </span>
              </div>
            </div>
          ) : (
            <span className="text-xs text-slate-500 italic">
              Pasa el cursor sobre los anillos concéntricos o haz clic en un continente para filtrar.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}


// ==========================================
// FILE: components/detail/immigration/HorizontalBarRanking.tsx
// ==========================================

"use client";

import { useState, useMemo } from "react";
import {
  ImmigrationItem,
  COUNTRY_GEO_MAP,
  formatSpanishNumber,
  formatCompactSpanish,
} from "./utils";
import { BarChart3, Globe2 } from "lucide-react";

interface HorizontalBarRankingProps {
  activeDataMap: Record<string, number>;
  totalArrivals: number;
  pinnedCountryId: string | null;
  setPinnedCountryId: (cId: string | null) => void;
  hoveredCountryId: string | null;
  setHoveredCountryId: (cId: string | null) => void;
}

const BLOCK_COLORS: Record<string, { name: string; bar: string; badge: string }> = {
  "america-hispanohablante": {
    name: "América Hispanohablante",
    bar: "#2563EB",
    badge: "bg-blue-950 text-blue-300 border-blue-800",
  },
  "america-no-hispanohablante": {
    name: "América No Hispanohablante",
    bar: "#7C3AED",
    badge: "bg-purple-950 text-purple-300 border-purple-800",
  },
  europa: {
    name: "Europa",
    bar: "#0891B2",
    badge: "bg-cyan-950 text-cyan-300 border-cyan-800",
  },
  africa: {
    name: "África",
    bar: "#059669",
    badge: "bg-emerald-950 text-emerald-300 border-emerald-800",
  },
  asia: {
    name: "Asia",
    bar: "#D97706",
    badge: "bg-amber-950 text-amber-300 border-amber-800",
  },
  oceania: {
    name: "Oceanía",
    bar: "#64748B",
    badge: "bg-slate-800 text-slate-300 border-slate-700",
  },
};

export default function HorizontalBarRanking({
  activeDataMap,
  totalArrivals,
  pinnedCountryId,
  setPinnedCountryId,
  hoveredCountryId,
  setHoveredCountryId,
}: HorizontalBarRankingProps) {
  const rankedItems = useMemo(() => {
    return Object.entries(activeDataMap)
      .map(([cId, val]) => {
        const geo = COUNTRY_GEO_MAP[cId];
        const pct = totalArrivals > 0 ? (val / totalArrivals) * 100 : 0;
        const bId = geo?.blockId || "oceania";
        return {
          id: cId,
          name: geo?.name || cId,
          blockId: bId,
          blockName: geo?.blockName || "Otros",
          value: val,
          pct,
          style: BLOCK_COLORS[bId] || BLOCK_COLORS.oceania,
        };
      })
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [activeDataMap, totalArrivals]);

  const maxVal = rankedItems[0]?.value || 1;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl space-y-5">
      {/* Header & Legend */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            Ranking de Países de Origen por Volumen e Intensidad Geográfica
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Distribución proporcional de la inmigración por procedencia y región continental/lingüística.
          </p>
        </div>

        {/* Compact Legend */}
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          {Object.entries(BLOCK_COLORS).map(([bId, cfg]) => (
            <div key={bId} className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.bar }} />
              <span className="text-slate-300 font-medium">{cfg.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Horizontal Bars Container */}
      <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-2">
        {rankedItems.map((item, idx) => {
          const isPinned = pinnedCountryId === item.id;
          const isHovered = hoveredCountryId === item.id;
          const widthPct = (item.value / maxVal) * 100;

          return (
            <div
              key={item.id}
              onMouseEnter={() => setHoveredCountryId(item.id)}
              onMouseLeave={() => setHoveredCountryId(null)}
              onClick={() => setPinnedCountryId(isPinned ? null : item.id)}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                isPinned
                  ? "bg-blue-950/80 border-blue-500 ring-1 ring-blue-500 shadow-md"
                  : isHovered
                  ? "bg-slate-800/90 border-slate-700"
                  : "bg-slate-800/40 border-slate-800/80 hover:bg-slate-800/70"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs mb-1.5">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-slate-500 text-[11px] font-bold w-5">
                    #{idx + 1}
                  </span>
                  <span className="font-bold text-white text-sm">
                    {item.name}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${item.style.badge}`}>
                    {item.blockName}
                  </span>
                </div>

                <div className="flex items-center gap-3 font-mono font-bold">
                  <span className="text-yellow-300 text-sm">
                    {formatSpanishNumber(item.value)} pers.
                  </span>
                  <span className="text-sky-300 text-xs min-w-[45px] text-right">
                    {item.pct.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Horizontal Proportion Bar */}
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300 shadow-xs"
                  style={{
                    width: `${Math.max(2, widthPct)}%`,
                    backgroundColor: item.style.bar,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ==========================================
// FILE: components/detail/immigration/ImmigrationView.tsx
// ==========================================

"use client";

import { useState, useMemo, useEffect } from "react";
import { ImmigrationItem, AnnualBlock } from "@/types";
import WebGisChronoArcs from "./WebGisChronoArcs";
import TimelineScrubber from "./TimelineScrubber";
import ConcentricSunburstRanking from "./ConcentricSunburstRanking";
import SourceCard from "@/components/detail/SourceCard";

type TimeframeMode = "single" | "range";
type YearRange = [string, string];

const PLAYBACK_INTERVAL_MS = 900;
const DEFAULT_FALLBACK_END_YEAR = "2024";
const DEFAULT_FALLBACK_START_YEAR = "2019";
const DEFAULT_RANGE_SPAN = 5;

interface ImmigrationViewProps {
  item: ImmigrationItem;
}

interface AggregatedMetrics {
  activeDataMap: Record<string, number>;
  totalArrivals: number;
  timeframeLabel: string;
}

function aggregateAnnualBlocks(blocks: AnnualBlock[]): {
  dataMap: Record<string, number>;
  total: number;
} {
  const dataMap: Record<string, number> = {};
  let total = 0;

  for (const annualBlock of blocks) {
    total += annualBlock.total;
    for (const regionalBlock of Object.values(annualBlock.blocks)) {
      for (const [countryId, volume] of Object.entries(regionalBlock.countries)) {
        dataMap[countryId] = (dataMap[countryId] ?? 0) + volume;
      }
    }
  }

  return { dataMap, total };
}

export default function ImmigrationView({ item }: ImmigrationViewProps) {
  const years = useMemo(
    () => item.annualBlocks.map((block) => block.year),
    [item.annualBlocks]
  );

  const latestYear = years.at(-1) ?? DEFAULT_FALLBACK_END_YEAR;
  const defaultRangeStart =
    years[Math.max(0, years.length - DEFAULT_RANGE_SPAN)] ?? DEFAULT_FALLBACK_START_YEAR;

  const [selectedYear, setSelectedYear] = useState<string>(latestYear);
  const [yearRange, setYearRange] = useState<YearRange>([defaultRangeStart, latestYear]);
  const [mode, setMode] = useState<TimeframeMode>("single");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const [hoveredCountryId, setHoveredCountryId] = useState<string | null>(null);
  const [pinnedCountryId, setPinnedCountryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedBlockFilter, setSelectedBlockFilter] = useState<string>("");
  const [minVolumeThreshold, setMinVolumeThreshold] = useState<number>(0);

  // Stop playback when reaching the end of the timeline without triggering impure state updates inside setSelectedYear
  useEffect(() => {
    if (!isPlaying || mode !== "single") return;

    const currentIdx = years.indexOf(selectedYear);
    if (currentIdx === -1 || currentIdx >= years.length - 1) {
      setIsPlaying(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setSelectedYear(years[currentIdx + 1]);
    }, PLAYBACK_INTERVAL_MS);

    return () => window.clearTimeout(timer);
  }, [isPlaying, mode, selectedYear, years]);

  const { activeDataMap, totalArrivals, timeframeLabel } = useMemo<AggregatedMetrics>(() => {
    if (mode === "single") {
      const targetBlock = item.annualBlocks.find((d) => d.year === selectedYear);
      const { dataMap, total } = aggregateAnnualBlocks(targetBlock ? [targetBlock] : []);
      return {
        activeDataMap: dataMap,
        totalArrivals: total,
        timeframeLabel: `Año ${selectedYear}`,
      };
    }

    const startIdx = years.indexOf(yearRange[0]);
    const endIdx = years.indexOf(yearRange[1]);

    const matchingBlocks =
      startIdx !== -1 && endIdx !== -1
        ? item.annualBlocks.filter((ab) => {
            const yIdx = years.indexOf(ab.year);
            return yIdx >= Math.min(startIdx, endIdx) && yIdx <= Math.max(startIdx, endIdx);
          })
        : [];

    const { dataMap, total } = aggregateAnnualBlocks(matchingBlocks);

    return {
      activeDataMap: dataMap,
      totalArrivals: total,
      timeframeLabel: `Rango ${yearRange[0]}–${yearRange[1]}`,
    };
  }, [item.annualBlocks, mode, selectedYear, yearRange, years]);

  const hasSources = Boolean(item.sources?.length || item.source);

  return (
    <div className="space-y-6">
      {/* Top Timeline Scrubber (Placed right at the top) */}
      <TimelineScrubber
        years={years}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        yearRange={yearRange}
        setYearRange={setYearRange}
        mode={mode}
        setMode={setMode}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
      />

      {/* 1. Map Canvas */}
      <div className="w-full">
        <WebGisChronoArcs
          timeframeLabel={timeframeLabel}
          activeDataMap={activeDataMap}
          totalArrivals={totalArrivals}
          hoveredCountryId={hoveredCountryId}
          setHoveredCountryId={setHoveredCountryId}
          pinnedCountryId={pinnedCountryId}
          setPinnedCountryId={setPinnedCountryId}
          searchQuery={searchQuery}
          selectedBlockFilter={selectedBlockFilter}
          minVolumeThreshold={minVolumeThreshold}
        />
      </div>

      {/* 2. Concentric Sunburst Ranking Component */}
      <ConcentricSunburstRanking
        item={item}
        activeDataMap={activeDataMap}
        totalArrivals={totalArrivals}
        pinnedCountryId={pinnedCountryId}
        setPinnedCountryId={setPinnedCountryId}
        hoveredCountryId={hoveredCountryId}
        setHoveredCountryId={setHoveredCountryId}
        selectedTimeframeLabel={timeframeLabel}
      />

      {/* 3. Trazabilidad y Fuentes por tramos */}
      {hasSources && (
        <section>
          <SourceCard
            sources={item.sources}
            source={item.source}
          />
        </section>
      )}
    </div>
  );
}


// ==========================================
// FILE: components/detail/immigration/SideDataDrawer.tsx
// ==========================================

"use client";

import { useState, useMemo } from "react";
import {
  ImmigrationItem,
  COUNTRY_GEO_MAP,
  formatSpanishNumber,
  formatCompactSpanish,
} from "./utils";
import {
  Search,
  Filter,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  X,
  Globe,
  Sliders,
} from "lucide-react";

interface SideDataDrawerProps {
  item: ImmigrationItem;
  selectedTimeframeLabel: string;
  activeDataMap: Record<string, number>;
  totalArrivals: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedBlockFilter: string;
  setSelectedBlockFilter: (b: string) => void;
  minVolumeThreshold: number;
  setMinVolumeThreshold: (v: number) => void;
  pinnedCountryId: string | null;
  setPinnedCountryId: (cId: string | null) => void;
  hoveredCountryId: string | null;
  setHoveredCountryId: (cId: string | null) => void;
  onResetView: () => void;
}

// Continent/Block color mapping with distinction between Hispanic & Non-Hispanic Americas
const BLOCK_COLORS: Record<string, { name: string; bg: string; text: string; bar: string }> = {
  "america-hispanohablante": {
    name: "América (Hispanohablante)",
    bg: "bg-blue-950/80",
    text: "text-blue-400",
    bar: "#2563EB",
  },
  "america-no-hispanohablante": {
    name: "América (No Hispana)",
    bg: "bg-purple-950/80",
    text: "text-purple-400",
    bar: "#7C3AED",
  },
  europa: {
    name: "Europa",
    bg: "bg-cyan-950/80",
    text: "text-cyan-400",
    bar: "#0891B2",
  },
  africa: {
    name: "África",
    bg: "bg-emerald-950/80",
    text: "text-emerald-400",
    bar: "#059669",
  },
  asia: {
    name: "Asia",
    bg: "bg-amber-950/80",
    text: "text-amber-400",
    bar: "#D97706",
  },
  oceania: {
    name: "Oceanía",
    bg: "bg-slate-800",
    text: "text-slate-400",
    bar: "#64748B",
  },
};

export default function SideDataDrawer({
  item,
  selectedTimeframeLabel,
  activeDataMap,
  totalArrivals,
  searchQuery,
  setSearchQuery,
  selectedBlockFilter,
  setSelectedBlockFilter,
  minVolumeThreshold,
  setMinVolumeThreshold,
  pinnedCountryId,
  setPinnedCountryId,
  hoveredCountryId,
  setHoveredCountryId,
  onResetView,
}: SideDataDrawerProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Filter and rank origin countries
  const rankedCountries = useMemo(() => {
    return Object.entries(activeDataMap)
      .map(([cId, vol]) => {
        const geo = COUNTRY_GEO_MAP[cId];
        const pct = totalArrivals > 0 ? (vol / totalArrivals) * 100 : 0;
        const bId = geo?.blockId || "oceania";
        return {
          id: cId,
          name: geo?.name || cId,
          blockId: bId,
          blockName: geo?.blockName || "Otros",
          value: vol,
          pct,
          colorInfo: BLOCK_COLORS[bId] || BLOCK_COLORS.oceania,
        };
      })
      .filter((c) => {
        if (c.value <= 0) return false;
        if (c.value < minVolumeThreshold) return false;
        if (selectedBlockFilter && c.blockId !== selectedBlockFilter) return false;
        if (
          searchQuery &&
          !c.name.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.value - a.value);
  }, [activeDataMap, totalArrivals, searchQuery, selectedBlockFilter, minVolumeThreshold]);

  const maxRankedVal = rankedCountries[0]?.value || 1;

  return (
    <div
      className={`bg-slate-900 border border-slate-800 rounded-2xl text-white shadow-2xl flex flex-col transition-all duration-300 relative ${
        isOpen ? "w-full lg:w-96" : "w-full lg:w-12"
      }`}
    >
      {/* Toggle Button for Desktop */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hidden lg:flex absolute -left-3 top-6 w-6 h-6 rounded-full bg-blue-600 hover:bg-blue-500 text-white items-center justify-center shadow-lg z-20 transition-transform"
        title={isOpen ? "Colapsar panel" : "Expandir panel"}
      >
        {isOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Collapsed State Icon */}
      {!isOpen && (
        <div className="hidden lg:flex flex-col items-center py-6 gap-4">
          <Globe className="w-5 h-5 text-blue-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 [writing-mode:vertical-lr]">
            Datos de Origen
          </span>
        </div>
      )}

      {/* Expanded Content Drawer */}
      {isOpen && (
        <div className="p-4 sm:p-5 flex flex-col gap-4 h-full">
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400" />
                Orígenes de Inmigración
              </h3>
              <span className="text-xs font-semibold text-slate-400">
                {selectedTimeframeLabel} • Total: {formatSpanishNumber(totalArrivals)}
              </span>
            </div>

            <button
              onClick={onResetView}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors"
              title="Restablecer filtros y vista"
            >
              <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
              Reset
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar país de origen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/90 text-xs text-white pl-9 pr-8 py-2 rounded-xl border border-slate-700/80 focus:outline-none focus:border-blue-500 placeholder-slate-500 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Region Block Filter */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <Filter className="w-3 h-3 text-blue-400" />
              Filtrar por Región:
            </span>
            <select
              value={selectedBlockFilter}
              onChange={(e) => setSelectedBlockFilter(e.target.value)}
              className="w-full bg-slate-800 text-xs font-semibold text-white border border-slate-700 rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-500"
            >
              <option value="">Todas las regiones globales</option>
              {item.blocks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Volume Threshold Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-semibold text-slate-400">
              <span className="flex items-center gap-1">
                <Sliders className="w-3 h-3 text-blue-400" />
                Volumen mín.:
              </span>
              <span className="font-mono text-white">
                {minVolumeThreshold > 0
                  ? `>= ${formatCompactSpanish(minVolumeThreshold)}`
                  : "Todos"}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="50000"
              step="1000"
              value={minVolumeThreshold}
              onChange={(e) => setMinVolumeThreshold(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Ranked Country List */}
          <div className="flex-1 space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {rankedCountries.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No hay países de origen para el filtro seleccionado.
              </div>
            ) : (
              rankedCountries.map((c, idx) => {
                const isPinned = pinnedCountryId === c.id;
                const isHovered = hoveredCountryId === c.id;

                return (
                  <div
                    key={c.id}
                    onMouseEnter={() => setHoveredCountryId(c.id)}
                    onMouseLeave={() => setHoveredCountryId(null)}
                    onClick={() =>
                      setPinnedCountryId(isPinned ? null : c.id)
                    }
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isPinned
                        ? "bg-blue-950/80 border-blue-500 ring-1 ring-blue-500 shadow-md"
                        : isHovered
                        ? "bg-slate-800/90 border-slate-700"
                        : "bg-slate-800/40 border-slate-800 hover:bg-slate-800/70"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-[10px] font-mono font-bold text-slate-500 w-4 text-right">
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-white truncate">
                          {c.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono font-semibold">
                        <span className="text-blue-300">
                          {formatSpanishNumber(c.value)}
                        </span>
                        <span className="text-[10px] text-slate-400 min-w-[36px] text-right">
                          {c.pct.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Block Badge & Progress Bar */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span className={`px-1.5 py-0.5 rounded font-medium ${c.colorInfo.bg} ${c.colorInfo.text}`}>
                        {c.blockName}
                      </span>
                    </div>

                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${(c.value / maxRankedVal) * 100}%`,
                          backgroundColor: c.colorInfo.bar,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}


// ==========================================
// FILE: components/detail/immigration/SmallMultiplesView.tsx
// ==========================================

"use client";

import { useState, useMemo } from "react";
import {
  ImmigrationItem,
  BlockDef,
  getCountryColor,
  formatSpanishNumber,
  formatCompactSpanish,
} from "./utils";
import { Maximize2, Minimize2, Sliders, Layers } from "lucide-react";

interface SmallMultiplesViewProps {
  item: ImmigrationItem;
}

export default function SmallMultiplesView({ item }: SmallMultiplesViewProps) {
  const [scaleMode, setScaleMode] = useState<"shared" | "independent">("shared");
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [hoveredYear, setHoveredYear] = useState<string | null>(null);
  const [isolatedCountryMap, setIsolatedCountryMap] = useState<Record<string, string | null>>({});

  const years = useMemo(() => {
    return item.annualBlocks.map((d) => d.year);
  }, [item]);

  // Compute maximums for Y axis scales
  const { globalMax, blockMaxMap } = useMemo(() => {
    let gMax = 0;
    const bMax: Record<string, number> = {};

    item.blocks.forEach((b) => {
      bMax[b.id] = 0;
    });

    item.annualBlocks.forEach((ab) => {
      Object.entries(ab.blocks).forEach(([bId, bData]) => {
        if (bData.total > gMax) gMax = bData.total;
        if (bData.total > (bMax[bId] || 0)) bMax[bId] = bData.total;
      });
    });

    return { globalMax: Math.ceil(gMax * 1.05), blockMaxMap: bMax };
  }, [item]);

  const visibleBlocks = useMemo(() => {
    if (!selectedBlockId) return item.blocks;
    return item.blocks.filter((b) => b.id === selectedBlockId);
  }, [item, selectedBlockId]);

  const toggleCountryIsolation = (blockId: string, countryId: string) => {
    setIsolatedCountryMap((prev) => {
      const current = prev[blockId];
      return {
        ...prev,
        [blockId]: current === countryId ? null : countryId,
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
        {/* Continent Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setSelectedBlockId(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedBlockId === null
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            Todos los continentes
          </button>
          {item.blocks.map((block) => (
            <button
              key={block.id}
              onClick={() => setSelectedBlockId(selectedBlockId === block.id ? null : block.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                selectedBlockId === block.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: block.color }}
              />
              {block.name}
            </button>
          ))}
        </div>

        {/* Y-Axis Scale Switcher */}
        <div className="flex items-center gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200">
          <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5" />
            Eje Y:
          </span>
          <div className="bg-white border border-slate-200 rounded-lg p-0.5 flex">
            <button
              onClick={() => setScaleMode("shared")}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                scaleMode === "shared"
                  ? "bg-blue-50 text-blue-700 font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Compartida
            </button>
            <button
              onClick={() => setScaleMode("independent")}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                scaleMode === "independent"
                  ? "bg-blue-50 text-blue-700 font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Independiente
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Continent Cards */}
      <div
        className={`grid gap-6 ${
          visibleBlocks.length === 1
            ? "grid-cols-1"
            : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        }`}
      >
        {visibleBlocks.map((block) => (
          <ContinentCard
            key={block.id}
            item={item}
            block={block}
            years={years}
            scaleMode={scaleMode}
            yMax={scaleMode === "shared" ? globalMax : blockMaxMap[block.id] * 1.08}
            isZoomed={selectedBlockId === block.id}
            onToggleZoom={() =>
              setSelectedBlockId(selectedBlockId === block.id ? null : block.id)
            }
            hoveredYear={hoveredYear}
            setHoveredYear={setHoveredYear}
            isolatedCountryId={isolatedCountryMap[block.id] || null}
            onToggleCountryIsolation={(cId) => toggleCountryIsolation(block.id, cId)}
          />
        ))}
      </div>
    </div>
  );
}

interface ContinentCardProps {
  item: ImmigrationItem;
  block: BlockDef;
  years: string[];
  scaleMode: "shared" | "independent";
  yMax: number;
  isZoomed: boolean;
  onToggleZoom: () => void;
  hoveredYear: string | null;
  setHoveredYear: (y: string | null) => void;
  isolatedCountryId: string | null;
  onToggleCountryIsolation: (countryId: string) => void;
}

function ContinentCard({
  item,
  block,
  years,
  scaleMode,
  yMax,
  isZoomed,
  onToggleZoom,
  hoveredYear,
  setHoveredYear,
  isolatedCountryId,
  onToggleCountryIsolation,
}: ContinentCardProps) {
  const width = 500;
  const height = 240;
  const margin = { top: 20, right: 15, bottom: 30, left: 45 };

  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  // Extract country data points over years
  const countrySeriesList = useMemo(() => {
    return block.countries.map((c) => {
      const points = item.annualBlocks.map((ab) => {
        const bData = ab.blocks[block.id];
        const val = bData?.countries[c.id] || 0;
        return { year: ab.year, value: val };
      });
      return {
        id: c.id,
        name: c.name,
        color: getCountryColor(c.id, block.color),
        points,
      };
    });
  }, [item, block]);

  // Compute stacked polygon paths
  const stackedData = useMemo(() => {
    // For each year i, calculate stacked Y positions
    const numYears = years.length;
    const numCountries = countrySeriesList.length;

    // stackedPoints[countryIdx][yearIdx] = { y0, y1 }
    const stackedPoints: Array<Array<{ y0: number; y1: number }>> = countrySeriesList.map(
      () => []
    );

    for (let yi = 0; yi < numYears; yi++) {
      let currentY = 0;
      for (let ci = 0; ci < numCountries; ci++) {
        const val = countrySeriesList[ci].points[yi].value;
        const y0 = currentY;
        const y1 = currentY + val;
        stackedPoints[ci].push({ y0, y1 });
        currentY = y1;
      }
    }

    // Convert to SVG paths
    const getX = (yearIdx: number) =>
      margin.left + (yearIdx / (numYears - 1)) * innerW;
    const getY = (val: number) =>
      margin.top + innerH - (val / (yMax || 1)) * innerH;

    return countrySeriesList.map((c, ci) => {
      const topCoords: string[] = [];
      const bottomCoords: string[] = [];

      for (let yi = 0; yi < numYears; yi++) {
        const x = getX(yi);
        const { y0, y1 } = stackedPoints[ci][yi];
        topCoords.push(`${x},${getY(y1)}`);
        bottomCoords.unshift(`${x},${getY(y0)}`);
      }

      const pathD = `M ${topCoords.join(" L ")} L ${bottomCoords.join(" L ")} Z`;
      return {
        ...c,
        pathD,
      };
    });
  }, [countrySeriesList, years, innerW, innerH, margin, yMax]);

  // Determine year under hover
  const activeYearData = useMemo(() => {
    const activeY = hoveredYear || years[years.length - 1];
    const ab = item.annualBlocks.find((d) => d.year === activeY);
    if (!ab) return null;

    const bData = ab.blocks[block.id];
    if (!bData) return null;

    const countryList = block.countries
      .map((c) => {
        const val = bData.countries[c.id] || 0;
        const pct = bData.total > 0 ? (val / bData.total) * 100 : 0;
        return {
          id: c.id,
          name: c.name,
          color: getCountryColor(c.id, block.color),
          value: val,
          pct,
        };
      })
      .sort((a, b) => b.value - a.value);

    return {
      year: activeY,
      total: bData.total,
      countries: countryList,
    };
  }, [item, block, years, hoveredYear]);

  // Calculate guide line X position
  const hoveredYearX = useMemo(() => {
    if (!hoveredYear) return null;
    const idx = years.indexOf(hoveredYear);
    if (idx === -1) return null;
    return margin.left + (idx / (years.length - 1)) * innerW;
  }, [hoveredYear, years, innerW, margin]);

  // Y-axis tick marks
  const yTicks = useMemo(() => {
    const count = 4;
    const ticks = [];
    for (let i = 0; i <= count; i++) {
      const val = (yMax / count) * i;
      ticks.push(val);
    }
    return ticks;
  }, [yMax]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
      {/* Card Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full shadow-xs"
            style={{ backgroundColor: block.color }}
          />
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            {block.name}
          </h3>
        </div>

        <button
          onClick={onToggleZoom}
          title={isZoomed ? "Restaurar cuadrícula" : "Expandir continente"}
          className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
        >
          {isZoomed ? (
            <Minimize2 className="w-3.5 h-3.5" />
          ) : (
            <Maximize2 className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Main SVG Area Chart */}
      <div className="relative my-3" style={{ height: "220px" }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          onMouseLeave={() => setHoveredYear(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const svgX = (mouseX / rect.width) * width;

            // Find closest year
            let closestYear = years[0];
            let minDiff = Infinity;
            years.forEach((y, idx) => {
              const yearX = margin.left + (idx / (years.length - 1)) * innerW;
              const diff = Math.abs(svgX - yearX);
              if (diff < minDiff) {
                minDiff = diff;
                closestYear = y;
              }
            });
            setHoveredYear(closestYear);
          }}
        >
          {/* Y Axis Grid Lines */}
          {yTicks.map((tick, i) => {
            const yPos = margin.top + innerH - (tick / yMax) * innerH;
            return (
              <g key={i}>
                <line
                  x1={margin.left}
                  y1={yPos}
                  x2={width - margin.right}
                  y2={yPos}
                  stroke="#F1F5F9"
                  strokeWidth="1"
                  strokeDasharray={i === 0 ? "none" : "3,3"}
                />
                <text
                  x={margin.left - 6}
                  y={yPos + 3}
                  textAnchor="end"
                  className="text-[10px] fill-slate-500 font-medium"
                >
                  {formatCompactSpanish(tick)}
                </text>
              </g>
            );
          })}

          {/* Stacked Area Layers */}
          {stackedData.map((layer) => {
            const isIsolated = isolatedCountryId === layer.id;
            const isDimmed = isolatedCountryId !== null && !isIsolated;

            return (
              <path
                key={layer.id}
                d={layer.pathD}
                fill={layer.color}
                fillOpacity={isIsolated ? 0.95 : isDimmed ? 0.15 : 0.75}
                stroke={layer.color}
                strokeWidth={isIsolated ? 2 : 1}
                className="transition-all duration-200 cursor-pointer"
                onClick={() => onToggleCountryIsolation(layer.id)}
              >
                <title>{layer.name}</title>
              </path>
            );
          })}

          {/* X Axis Labels */}
          {years.map((y, idx) => {
            if (idx % 3 !== 0 && idx !== years.length - 1) return null;
            const xPos = margin.left + (idx / (years.length - 1)) * innerW;
            return (
              <text
                key={y}
                x={xPos}
                y={height - 8}
                textAnchor="middle"
                className="text-[10px] fill-slate-500 font-medium"
              >
                {y}
              </text>
            );
          })}

          {/* Hover Line */}
          {hoveredYearX !== null && (
            <line
              x1={hoveredYearX}
              y1={margin.top}
              x2={hoveredYearX}
              y2={margin.top + innerH}
              stroke="#0F172A"
              strokeWidth="1.5"
              strokeDasharray="4,4"
              className="pointer-events-none"
            />
          )}
        </svg>

        {/* Floating Tooltip when Hovered */}
        {activeYearData && hoveredYear && (
          <div className="absolute top-2 right-2 bg-slate-900/95 text-white text-[11px] rounded-lg p-2.5 shadow-lg backdrop-blur-xs max-w-[210px] pointer-events-none z-10 space-y-1.5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between font-bold border-b border-slate-700/80 pb-1">
              <span>Año {activeYearData.year}</span>
              <span className="text-blue-300">
                {formatSpanishNumber(activeYearData.total)}
              </span>
            </div>
            <div className="space-y-1 max-h-36 overflow-y-auto">
              {activeYearData.countries.map((c) => (
                <div
                  key={c.id}
                  className={`flex items-center justify-between gap-2 text-[10px] ${
                    isolatedCountryId === c.id
                      ? "font-bold text-yellow-300"
                      : "text-slate-300"
                  }`}
                >
                  <span className="truncate flex items-center gap-1">
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: c.color }}
                    />
                    {c.name}
                  </span>
                  <span className="flex-shrink-0 font-mono">
                    {formatSpanishNumber(c.value)} ({c.pct.toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Interactive Legend for Country Isolation */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-1.5 text-[11px]">
        {block.countries.map((c) => {
          const color = getCountryColor(c.id, block.color);
          const isIsolated = isolatedCountryId === c.id;
          const isDimmed = isolatedCountryId !== null && !isIsolated;

          return (
            <button
              key={c.id}
              onClick={() => onToggleCountryIsolation(c.id)}
              className={`px-2 py-0.5 rounded-md font-medium transition-all flex items-center gap-1 text-left ${
                isIsolated
                  ? "bg-slate-900 text-white shadow-xs font-bold ring-2 ring-offset-1 ring-slate-900"
                  : isDimmed
                  ? "bg-slate-50 text-slate-500 opacity-40 hover:opacity-100 border border-slate-200"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="truncate max-w-[120px]">{c.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}


// ==========================================
// FILE: components/detail/immigration/SunburstView.tsx
// ==========================================

"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  ImmigrationItem,
  BlockDef,
  getCountryColor,
  formatSpanishNumber,
  formatCompactSpanish,
  describeArc,
} from "./utils";
import {
  Play,
  Pause,
  Sparkles,
  XCircle,
} from "lucide-react";

interface SunburstViewProps {
  item: ImmigrationItem;
}

export default function SunburstView({ item }: SunburstViewProps) {
  const years = useMemo(() => item.annualBlocks.map((d) => d.year), [item]);
  const [selectedYear, setSelectedYear] = useState<string>(
    years[years.length - 1] || "2024"
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [hoveredSector, setHoveredSector] = useState<{
    type: "block" | "country";
    name: string;
    value: number;
    globalPct: number;
    parentPct?: number;
    color: string;
  } | null>(null);

  const [activeDrillDownBlockId, setActiveDrillDownBlockId] = useState<
    string | null
  >(null);

  // Playback timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isPlaying) {
      timer = setInterval(() => {
        setSelectedYear((prev) => {
          const currentIdx = years.indexOf(prev);
          if (currentIdx >= years.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return years[currentIdx + 1];
        });
      }, 800);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, years]);

  // Active annual data
  const activeAnnualData = useMemo(() => {
    return (
      item.annualBlocks.find((d) => d.year === selectedYear) ||
      item.annualBlocks[item.annualBlocks.length - 1]
    );
  }, [item, selectedYear]);

  // Previous year data for YoY % calculation
  const prevYearData = useMemo(() => {
    const idx = years.indexOf(selectedYear);
    if (idx <= 0) return null;
    const prevY = years[idx - 1];
    return item.annualBlocks.find((d) => d.year === prevY) || null;
  }, [item, selectedYear, years]);

  // Calculate YoY % change
  const yoyPct = useMemo(() => {
    if (!prevYearData || prevYearData.total === 0) return null;
    const change = activeAnnualData.total - prevYearData.total;
    return (change / prevYearData.total) * 100;
  }, [activeAnnualData, prevYearData]);

  // Sunburst geometry calculations
  const { blockSectors, countrySectors } = useMemo(() => {
    const totalGlobal = activeAnnualData.total || 1;
    const cx = 250;
    const cy = 250;
    const rInBlock = 80;
    const rOutBlock = 145;
    const rInCountry = 152;
    const rOutCountry = 215;

    let currentAngle = -Math.PI / 2; // Start at 12 o'clock

    // If drilled down to a single continent
    const blocksToRender = activeDrillDownBlockId
      ? item.blocks.filter((b) => b.id === activeDrillDownBlockId)
      : item.blocks;

    const totalToDistribute = blocksToRender.reduce(
      (acc, b) => acc + (activeAnnualData.blocks[b.id]?.total || 0),
      0
    );

    const bSectors: any[] = [];
    const cSectors: any[] = [];

    blocksToRender.forEach((block) => {
      const bData = activeAnnualData.blocks[block.id];
      const bTotal = bData?.total || 0;
      if (bTotal === 0) return;

      const angleSpan = (bTotal / (totalToDistribute || 1)) * (2 * Math.PI);
      const startAngle = currentAngle;
      const endAngle = currentAngle + angleSpan;

      const pathD = describeArc(
        cx,
        cy,
        rInBlock,
        rOutBlock,
        startAngle,
        endAngle
      );
      const globalPct = (bTotal / totalGlobal) * 100;

      bSectors.push({
        id: block.id,
        name: block.name,
        color: block.color,
        value: bTotal,
        globalPct,
        startAngle,
        endAngle,
        pathD,
      });

      // Calculate country sub-arcs aligned with block arc
      let cCurrentAngle = startAngle;
      block.countries.forEach((country) => {
        const cVal = bData?.countries[country.id] || 0;
        if (cVal === 0) return;

        const cAngleSpan = (cVal / (bTotal || 1)) * angleSpan;
        const cStartAngle = cCurrentAngle;
        const cEndAngle = cCurrentAngle + cAngleSpan;

        const cPathD = describeArc(
          cx,
          cy,
          rInCountry,
          rOutCountry,
          cStartAngle,
          cEndAngle
        );

        const cGlobalPct = (cVal / totalGlobal) * 100;
        const cParentPct = (cVal / bTotal) * 100;
        const cColor = getCountryColor(country.id, block.color);

        cSectors.push({
          id: country.id,
          name: country.name,
          blockId: block.id,
          blockName: block.name,
          color: cColor,
          value: cVal,
          globalPct: cGlobalPct,
          parentPct: cParentPct,
          startAngle: cStartAngle,
          endAngle: cEndAngle,
          pathD: cPathD,
        });

        cCurrentAngle = cEndAngle;
      });

      currentAngle = endAngle;
    });

    return { blockSectors: bSectors, countrySectors: cSectors };
  }, [item, activeAnnualData, activeDrillDownBlockId]);

  // Global sparkline points
  const sparklineData = useMemo(() => {
    const maxVal = Math.max(...item.annualBlocks.map((d) => d.total));
    const width = 200;
    const height = 36;
    const pts = item.annualBlocks.map((ab, idx) => {
      const x = (idx / (item.annualBlocks.length - 1)) * width;
      const y = height - (ab.total / (maxVal || 1)) * (height - 6) - 3;
      return { x, y, year: ab.year, total: ab.total };
    });

    const activePt = pts.find((p) => p.year === selectedYear);
    const pathD = `M ${pts.map((p) => `${p.x},${p.y}`).join(" L ")}`;

    return { pts, pathD, activePt, width, height };
  }, [item, selectedYear]);

  // Milestone quick access years
  const keyMilestones = [
    { year: "2008", label: "2008 (Inicio)" },
    { year: "2013", label: "2013 (Valle)" },
    { year: "2019", label: "2019 (Pre-COVID)" },
    { year: "2020", label: "2020 (COVID-19)" },
    { year: "2022", label: "2022 (Pico UE)" },
    { year: "2024", label: "2024 (Último)" },
  ];

  return (
    <div className="space-y-6">
      {/* Top Bar: Playback Controls & Sparkline */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6">
        {/* Play/Pause & Slider */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md transition-all active:scale-95"
                title={isPlaying ? "Pausar animación" : "Reproducir serie"}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Año Seleccionado
                </span>
                <span className="text-xl font-extrabold text-slate-900 font-mono">
                  {selectedYear}
                </span>
              </div>
            </div>

            {/* Drilldown Reset Button */}
            {activeDrillDownBlockId && (
              <button
                onClick={() => setActiveDrillDownBlockId(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-800 transition-colors flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                Ver todos los continentes
              </button>
            )}
          </div>

          {/* Slider */}
          <input
            type="range"
            min="2008"
            max="2024"
            step="1"
            value={selectedYear}
            onChange={(e) => {
              setIsPlaying(false);
              setSelectedYear(e.target.value);
            }}
            className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />

          {/* All Years Quick Access Buttons */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {years.map((y) => (
              <button
                key={y}
                onClick={() => {
                  setIsPlaying(false);
                  setSelectedYear(y);
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  selectedYear === y
                    ? "bg-slate-900 text-white shadow-xs font-bold"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        {/* Mini Sparkline Context Graph */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col justify-between min-w-[220px]">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Tendencia Global (2008–2024)
            </span>
            <span className="font-bold font-mono text-slate-900">
              {formatCompactSpanish(activeAnnualData.total)}
            </span>
          </div>
          <svg
            viewBox={`0 0 ${sparklineData.width} ${sparklineData.height}`}
            className="w-full h-9 overflow-visible"
          >
            <path
              d={sparklineData.pathD}
              fill="none"
              stroke="#94A3B8"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {sparklineData.activePt && (
              <circle
                cx={sparklineData.activePt.x}
                cy={sparklineData.activePt.y}
                r="4"
                className="fill-blue-600 stroke-white stroke-2 animate-pulse"
              />
            )}
          </svg>
        </div>
      </div>

      {/* Main Container: Sunburst Graphic Centered */}
      <div className="flex flex-col items-center justify-center bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        {/* Sunburst SVG */}
        <div className="w-full max-w-[500px] flex flex-col items-center justify-center relative">
          <div className="relative w-full aspect-square">
            <svg
              viewBox="0 0 500 500"
              className="w-full h-full overflow-visible drop-shadow-xs"
            >
              {/* Inner Ring (Continents) */}
              {blockSectors.map((sector) => {
                const isHovered =
                  hoveredSector?.name === sector.name &&
                  hoveredSector?.type === "block";
                return (
                  <path
                    key={sector.id}
                    d={sector.pathD}
                    fill={sector.color}
                    fillOpacity={isHovered ? 1 : 0.88}
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    className="cursor-pointer transition-all duration-200 hover:scale-[1.015] origin-center"
                    onMouseEnter={() =>
                      setHoveredSector({
                        type: "block",
                        name: sector.name,
                        value: sector.value,
                        globalPct: sector.globalPct,
                        color: sector.color,
                      })
                    }
                    onMouseLeave={() => setHoveredSector(null)}
                    onClick={() =>
                      setActiveDrillDownBlockId(
                        activeDrillDownBlockId === sector.id ? null : sector.id
                      )
                    }
                  >
                    <title>
                      {sector.name}: {formatSpanishNumber(sector.value)} (
                      {sector.globalPct.toFixed(1)}%)
                    </title>
                  </path>
                );
              })}

              {/* Outer Ring (Countries) */}
              {countrySectors.map((sector) => {
                const isHovered =
                  hoveredSector?.name === sector.name &&
                  hoveredSector?.type === "country";
                return (
                  <path
                    key={sector.id}
                    d={sector.pathD}
                    fill={sector.color}
                    fillOpacity={isHovered ? 1 : 0.82}
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                    className="cursor-pointer transition-all duration-200 hover:scale-[1.02] origin-center"
                    onMouseEnter={() =>
                      setHoveredSector({
                        type: "country",
                        name: sector.name,
                        value: sector.value,
                        globalPct: sector.globalPct,
                        parentPct: sector.parentPct,
                        color: sector.color,
                      })
                    }
                    onMouseLeave={() => setHoveredSector(null)}
                  >
                    <title>
                      {sector.name}: {formatSpanishNumber(sector.value)} (
                      {sector.globalPct.toFixed(1)}% del total,{" "}
                      {sector.parentPct.toFixed(1)}% de {sector.blockName})
                    </title>
                  </path>
                );
              })}

              {/* Center Circle Content */}
              <circle
                cx="250"
                cy="250"
                r="76"
                fill="#FFFFFF"
                className="drop-shadow-md"
              />
              <g className="text-center pointer-events-none">
                <text
                  x="250"
                  y="225"
                  textAnchor="middle"
                  className="text-xs font-bold fill-slate-500 uppercase tracking-widest"
                >
                  Año {selectedYear}
                </text>
                <text
                  x="250"
                  y="252"
                  textAnchor="middle"
                  className="text-xl font-black fill-slate-900 font-mono tracking-tight"
                >
                  {formatCompactSpanish(activeAnnualData.total)}
                </text>
                <text
                  x="250"
                  y="272"
                  textAnchor="middle"
                  className="text-[11px] font-semibold fill-slate-500"
                >
                  personas
                </text>
                {yoyPct !== null && (
                  <text
                    x="250"
                    y="294"
                    textAnchor="middle"
                    className={`text-[11px] font-bold ${
                      yoyPct >= 0 ? "fill-emerald-600" : "fill-rose-600"
                    }`}
                  >
                    {yoyPct >= 0 ? `▲ +${yoyPct.toFixed(1)}%` : `▼ ${yoyPct.toFixed(1)}%`}{" "}
                    vs año ant.
                  </text>
                )}
              </g>
            </svg>
          </div>

          {/* Interactive Sector Tooltip Display */}
          <div className="h-16 mt-4 flex items-center justify-center">
            {hoveredSector ? (
              <div className="bg-slate-900 text-white rounded-xl px-4 py-2 text-center text-xs shadow-lg animate-in fade-in duration-150 flex items-center gap-3">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: hoveredSector.color }}
                />
                <div>
                  <span className="font-bold">{hoveredSector.name}: </span>
                  <span className="font-mono font-semibold text-blue-300">
                    {formatSpanishNumber(hoveredSector.value)} personas
                  </span>
                  <span className="text-slate-400 ml-2">
                    ({hoveredSector.globalPct.toFixed(1)}% del total global
                    {hoveredSector.parentPct !== undefined
                      ? `, ${hoveredSector.parentPct.toFixed(1)}% de su bloque`
                      : ""}
                    )
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-xs text-slate-500 italic">
                Pasa el cursor sobre un sector del anillo para ver detalles.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


// ==========================================
// FILE: components/detail/immigration/TimelineScrubber.tsx
// ==========================================

"use client";

import { useState } from "react";
import { Play, Pause, ChevronLeft, ChevronRight, Calendar, Layers } from "lucide-react";

interface TimelineScrubberProps {
  years: string[];
  selectedYear: string;
  setSelectedYear: (y: string) => void;
  yearRange: [string, string];
  setYearRange: (r: [string, string]) => void;
  mode: "single" | "range";
  setMode: (m: "single" | "range") => void;
  isPlaying: boolean;
  setIsPlaying: (p: boolean) => void;
}

export default function TimelineScrubber({
  years,
  selectedYear,
  setSelectedYear,
  yearRange,
  setYearRange,
  mode,
  setMode,
  isPlaying,
  setIsPlaying,
}: TimelineScrubberProps) {
  const currentIdx = years.indexOf(selectedYear);

  const handleStepPrev = () => {
    setIsPlaying(false);
    if (currentIdx > 0) {
      setSelectedYear(years[currentIdx - 1]);
    }
  };

  const handleStepNext = () => {
    setIsPlaying(false);
    if (currentIdx < years.length - 1) {
      setSelectedYear(years[currentIdx + 1]);
    }
  };

  const handleRangeStartChange = (val: string) => {
    setIsPlaying(false);
    const startIdx = years.indexOf(val);
    const endIdx = years.indexOf(yearRange[1]);
    if (startIdx <= endIdx) {
      setYearRange([val, yearRange[1]]);
    } else {
      setYearRange([val, val]);
    }
  };

  const handleRangeEndChange = (val: string) => {
    setIsPlaying(false);
    const startIdx = years.indexOf(yearRange[0]);
    const endIdx = years.indexOf(val);
    if (endIdx >= startIdx) {
      setYearRange([yearRange[0], val]);
    } else {
      setYearRange([val, val]);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 text-white shadow-2xl space-y-4">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Playback Controls & Mode Switcher */}
        <div className="flex items-center gap-3">
          {/* Step Prev */}
          <button
            onClick={handleStepPrev}
            disabled={currentIdx <= 0}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-40 flex items-center justify-center transition-colors"
            title="Año anterior (<)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Play / Pause */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg transition-all active:scale-95"
            title={isPlaying ? "Pausar animación" : "Reproducir cronología"}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          {/* Step Next */}
          <button
            onClick={handleStepNext}
            disabled={currentIdx >= years.length - 1}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-40 flex items-center justify-center transition-colors"
            title="Año siguiente (>)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Year Display Badge */}
          <div className="pl-2 border-l border-slate-800">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              {mode === "single" ? "Año Activo" : "Rango Acumulado"}
            </span>
            <span className="text-lg font-black font-mono text-blue-400">
              {mode === "single"
                ? selectedYear
                : `${yearRange[0]} – ${yearRange[1]}`}
            </span>
          </div>
        </div>

        {/* Mode Selector Toggle */}
        <div className="flex items-center gap-2 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 self-start md:self-auto">
          <button
            onClick={() => {
              setIsPlaying(false);
              setMode("single");
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              mode === "single"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Año Único
          </button>
          <button
            onClick={() => {
              setIsPlaying(false);
              setMode("range");
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              mode === "range"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Rango de Años
          </button>
        </div>
      </div>

      {/* Scrubber Sliders */}
      {mode === "single" ? (
        <div className="space-y-2">
          <input
            type="range"
            min="2008"
            max="2024"
            step="1"
            value={selectedYear}
            onChange={(e) => {
              setIsPlaying(false);
              setSelectedYear(e.target.value);
            }}
            className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-[11px] font-mono text-slate-400 px-1">
            {years.map((y, idx) => (
              <button
                key={y}
                onClick={() => {
                  setIsPlaying(false);
                  setSelectedYear(y);
                }}
                className={`hover:text-blue-400 transition-colors ${
                  selectedYear === y ? "text-blue-400 font-bold" : ""
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">
                Desde: <span className="font-bold text-white font-mono">{yearRange[0]}</span>
              </label>
              <select
                value={yearRange[0]}
                onChange={(e) => handleRangeStartChange(e.target.value)}
                className="w-full bg-slate-800 text-xs font-mono font-bold text-white border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">
                Hasta: <span className="font-bold text-white font-mono">{yearRange[1]}</span>
              </label>
              <select
                value={yearRange[1]}
                onChange={(e) => handleRangeEndChange(e.target.value)}
                className="w-full bg-slate-800 text-xs font-mono font-bold text-white border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ==========================================
// FILE: components/detail/immigration/WebGisChronoArcs.tsx
// ==========================================

"use client";

import { useState, useMemo } from "react";
import {
  font_dest,
  projectCoordinates,
  formatSpanishNumber,
} from "./utils";
import { getChoroplethCountryPolygons } from "./worldMapRenderer";
import { getJenksBreaks } from "./jenks";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  MapPin,
  Globe,
  Sparkles,
} from "lucide-react";

interface WebGisChronoArcsProps {
  timeframeLabel: string;
  activeDataMap: Record<string, number>;
  totalArrivals: number;
  hoveredCountryId: string | null;
  setHoveredCountryId: (cId: string | null) => void;
  pinnedCountryId: string | null;
  setPinnedCountryId: (cId: string | null) => void;
  searchQuery: string;
  selectedBlockFilter: string;
  minVolumeThreshold: number;
}

const PALETTE = ["#0284c7", "#2563eb", "#7c3aed", "#c026d3", "#db2777"];

export default function WebGisChronoArcs({
  timeframeLabel,
  activeDataMap,
  hoveredCountryId,
  setHoveredCountryId,
  pinnedCountryId,
  setPinnedCountryId,
}: WebGisChronoArcsProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredLegendSegment, setHoveredLegendSegment] = useState<number | null>(null);

  const svgWidth = 1000;
  const svgHeight = 580;

  // Real Natural Earth country polygons
  const countryPolygons = useMemo(() => {
    return getChoroplethCountryPolygons(svgWidth, svgHeight, zoom, pan.x, pan.y);
  }, [svgWidth, svgHeight, zoom, pan]);

  // Compute Jenks Natural Breaks (k = 5) excluding zero/null/spain
  const { breaks, minVal, maxVal } = useMemo(() => {
    const vals = Object.entries(activeDataMap)
      .filter(([cId, v]) => cId !== "spain" && v > 0)
      .map(([_, v]) => v)
      .sort((a, b) => a - b);

    if (vals.length === 0) {
      return { breaks: [0, 0, 0, 0], minVal: 0, maxVal: 0 };
    }

    const min = vals[0];
    const max = vals[vals.length - 1];
    const rawBreaks = getJenksBreaks(vals, 5);

    // Ensure we have up to 4 cut points for 5 classes
    const cuts = rawBreaks.slice(0, 4);
    while (cuts.length < 4 && vals.length > 1) {
      const last = cuts[cuts.length - 1] || min;
      cuts.push(Math.round((last + max) / 2));
    }

    return { breaks: cuts, minVal: min, maxVal: max };
  }, [activeDataMap]);

  // Assign Jenks class index (0 to 4)
  const getJenksClassIndex = (val: number) => {
    if (!val || val <= 0) return -1;
    const [c1, c2, c3, c4] = breaks;
    if (val <= (c1 || val)) return 0;
    if (val <= (c2 || val)) return 1;
    if (val <= (c3 || val)) return 2;
    if (val <= (c4 || val)) return 3;
    return 4;
  };

  const getChoroplethColorAndLabel = (val: number, isSpain = false) => {
    if (isSpain || !val || val <= 0) {
      return { color: "#1e293b", label: "Sin registro", classIdx: -1 };
    }
    const idx = getJenksClassIndex(val);
    return {
      color: PALETTE[idx] || PALETTE[0],
      label: `${formatSpanishNumber(val)} personas`,
      classIdx: idx,
    };
  };

  function formatCompact(num: number): string {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
    return num.toLocaleString("es-ES");
  }

  const activeHighlightId = pinnedCountryId || hoveredCountryId;

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Continuous Legend Segments data
  const legendSegments = useMemo(() => {
    if (breaks.length < 4) return [];
    const [c1, c2, c3, c4] = breaks;
    return [
      { color: PALETTE[0], range: `${formatCompact(minVal)} – ${formatCompact(c1)}` },
      { color: PALETTE[1], range: `${formatCompact(c1)} – ${formatCompact(c2)}` },
      { color: PALETTE[2], range: `${formatCompact(c2)} – ${formatCompact(c3)}` },
      { color: PALETTE[3], range: `${formatCompact(c3)} – ${formatCompact(c4)}` },
      { color: PALETTE[4], range: `> ${formatCompact(c4)}` },
    ];
  }, [breaks, minVal]);

  return (
    <div className="relative bg-[#060913] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between select-none">
      {/* Map Control Bar Overlay */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2 bg-slate-900/95 backdrop-blur-md p-2 rounded-xl border border-slate-700/80 shadow-xl">
        <button
          onClick={() => setZoom((z) => Math.min(3, z + 0.3))}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          title="Acercar mapa (+)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.7, z - 0.3))}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          title="Alejar mapa (-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          title="Restablecer encuadre"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-slate-700 my-auto mx-1" />

        <div className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-600 text-white shadow-xs flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5" />
          <span>Mapa Coroplético por Cortes Naturales</span>
        </div>
      </div>

      {/* Main SVG Choropleth Canvas */}
      <div
        className="w-full h-[500px] sm:h-[580px] cursor-grab active:cursor-grabbing relative z-0"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full overflow-visible bg-[#060913]"
        >
          {/* Oceans Background Fill */}
          <rect width={svgWidth} height={svgHeight} fill="#060913" />

          {/* Map Grid Lat/Lon Lines */}
          {[-40, -20, 0, 20, 40, 60].map((lat) => {
            const p1 = projectCoordinates(-180, lat, svgWidth, svgHeight, zoom, pan.x, pan.y);
            const p2 = projectCoordinates(180, lat, svgWidth, svgHeight, zoom, pan.x, pan.y);
            return (
              <line
                key={lat}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="#1e293b"
                strokeWidth="0.6"
                strokeDasharray="4,6"
              />
            );
          })}

          {/* Choropleth Country Polygons */}
          <g className="relative z-20">
            {countryPolygons.map((poly) => {
              const cId = poly.countryId;
              const isSpain = cId === "spain";
              const val = cId && !isSpain ? activeDataMap[cId] || 0 : 0;
              const { color: fillColor, classIdx } = getChoroplethColorAndLabel(val, isSpain);
              const isHighlighted = cId && activeHighlightId === cId;
              const isLegendHovered = hoveredLegendSegment !== null && classIdx === hoveredLegendSegment;
              const isDimmed =
                (activeHighlightId !== null && cId !== activeHighlightId && !isSpain) ||
                (hoveredLegendSegment !== null && !isLegendHovered && !isSpain);

              return (
                <path
                  key={poly.featureId}
                  d={poly.pathD}
                  fill={fillColor}
                  fillOpacity={isDimmed ? 0.2 : isHighlighted || isLegendHovered ? 1 : 0.9}
                  stroke={isHighlighted || isLegendHovered ? "#ffffff" : "#334155"}
                  strokeWidth={isHighlighted || isLegendHovered ? 1.5 : 0.6}
                  className="cursor-pointer transition-all duration-150 hover:stroke-blue-400"
                  onMouseEnter={() => {
                    if (cId && !isSpain) setHoveredCountryId(cId);
                  }}
                  onMouseLeave={() => {
                    if (cId && !isSpain) setHoveredCountryId(null);
                  }}
                  onClick={() => {
                    if (cId && !isSpain) setPinnedCountryId(pinnedCountryId === cId ? null : cId);
                  }}
                >
                  {cId && !isSpain && (
                    <title>
                      {poly.name}: {formatSpanishNumber(val)} personas
                    </title>
                  )}
                </path>
              );
            })}
          </g>
        </svg>

        {/* Hover / Pin Tooltip Overlay */}
        {activeHighlightId && (
          <div className="absolute bottom-4 left-4 bg-slate-900/95 border border-slate-700 text-white rounded-xl p-3.5 shadow-2xl backdrop-blur-md max-w-xs z-40 animate-in fade-in duration-150 space-y-1.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="font-extrabold text-sm flex items-center gap-1.5 text-blue-400">
                <MapPin className="w-4 h-4 text-pink-500" />
                {activeHighlightId}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {timeframeLabel}
              </span>
            </div>
            <div className="text-xs space-y-1 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Inmigrantes:</span>
                <span className="font-bold text-yellow-300">
                  {formatSpanishNumber(activeDataMap[activeHighlightId] || 0)} personas
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Continuous Legend Bar Component (Jenks Natural Breaks k=5) */}
      <div className="bg-slate-900 border-t border-slate-800 p-3.5 px-5 flex flex-col gap-2 text-xs text-slate-300 z-20">
        <div className="flex items-center justify-between font-semibold">
          <span className="flex items-center gap-1.5 text-white">
            <Sparkles className="w-4 h-4 text-blue-400" />
            Categorías por Volumen (personas):
          </span>
        </div>

        {/* Continuous Bar divided into 5 segments */}
        <div className="grid grid-cols-5 gap-1 w-full">
          {legendSegments.map((seg, idx) => (
            <div
              key={idx}
              onMouseEnter={() => setHoveredLegendSegment(idx)}
              onMouseLeave={() => setHoveredLegendSegment(null)}
              className={`flex flex-col gap-1 cursor-pointer transition-all p-1.5 rounded-lg ${
                hoveredLegendSegment === idx ? "bg-slate-800 ring-1 ring-blue-400" : "hover:bg-slate-800/60"
              }`}
            >
              <div
                className="h-3 w-full rounded-md shadow-xs transition-transform hover:scale-[1.02]"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-[10px] font-mono text-center text-slate-300 font-medium truncate">
                {seg.range}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


// ==========================================
// FILE: components/detail/immigration/jenks.ts
// ==========================================

// Jenks Natural Breaks Algorithm Implementation in TypeScript
export function getJenksBreaks(data: number[], numClasses: number): number[] {
  if (!data || data.length === 0) return [];
  const sorted = [...data].sort((a, b) => a - b);
  const n = sorted.length;
  if (numClasses >= n) {
    return [...new Set(sorted)];
  }

  const mat1 = Array(n + 1).fill(0).map(() => Array(numClasses + 1).fill(0));
  const mat2 = Array(n + 1).fill(0).map(() => Array(numClasses + 1).fill(0));

  for (let i = 1; i <= numClasses; i++) {
    mat1[1][i] = 1;
    mat2[1][i] = 0;
    for (let j = 2; j <= n; j++) {
      mat2[j][i] = Infinity;
    }
  }

  let variance = 0;
  for (let l = 2; l <= n; l++) {
    let sum = 0;
    let sumSquares = 0;
    let w = 0;
    for (let m = 1; m <= l; m++) {
      const val = sorted[l - m];
      w++;
      sum += val;
      sumSquares += val * val;
      variance = sumSquares - (sum * sum) / w;
      const i4 = l - m;
      if (i4 !== 0) {
        for (let j = 2; j <= numClasses; j++) {
          if (mat2[l][j] >= (variance + mat2[i4][j - 1])) {
            mat1[l][j] = i4;
            mat2[l][j] = variance + mat2[i4][j - 1];
          }
        }
      }
    }
    mat1[l][1] = 1;
    mat2[l][1] = variance;
  }

  let k = n;
  const kclass = Array(numClasses + 1).fill(0);
  kclass[numClasses] = sorted[n - 1];
  kclass[0] = sorted[0];

  let countNum = numClasses;
  while (countNum >= 2) {
    const idx = Math.round(mat1[k][countNum]);
    kclass[countNum - 1] = sorted[idx - 1];
    k = idx;
    countNum--;
  }

  // Extract unique threshold cut points
  const breaks = [];
  for (let i = 1; i < kclass.length; i++) {
    breaks.push(kclass[i]);
  }
  return Array.from(new Set(breaks)).sort((a, b) => a - b);
}


// ==========================================
// FILE: components/detail/immigration/utils.ts
// ==========================================

// Geographic Coordinates, Regions, Waypoints & Math for Web-GIS Chrono-Arcs

export interface CountryGeo {
  id: string;
  name: string;
  blockId: string;
  blockName: string;
  lng: number;
  lat: number;
  waypoint?: [number, number]; // Waypoint for edge bundling
}

export interface BlockDef {
  id: string;
  name: string;
  color: string;
  countries: Array<{ id: string; name: string }>;
}

// Map of colors for each country within its block
export const COUNTRY_COLORS: Record<string, string> = {
  colombia: "#1D4ED8",
  venezuela: "#1E40AF",
  peru: "#2563EB",
  argentina: "#3B82F6",
  honduras: "#60A5FA",
  ecuador: "#93C5FD",
  cuba: "#1E3A8A",
  paraguay: "#0284C7",
  "rep-dominicana": "#0369A1",
  "resto-de-america-hispanohablante": "#94A3B8",
  brasil: "#6D28D9",
  "estados-unidos": "#8B5CF6",
  canada: "#A78BFA",
  "resto-de-america-no-hispanohablante": "#CBD5E1",
  rumania: "#0E7490",
  "reino-unido": "#155E75",
  italia: "#06B6D4",
  ucrania: "#22D3EE",
  francia: "#67E8F9",
  alemania: "#0284C7",
  rusia: "#0369A1",
  portugal: "#0D9488",
  bulgaria: "#14B8A6",
  "resto-de-europa": "#94A3B8",
  marruecos: "#047857",
  argelia: "#065F46",
  senegal: "#10B981",
  mali: "#34D399",
  nigeria: "#6EE7B7",
  gambia: "#15803D",
  "guinea-ecuatorial": "#16A34A",
  ghana: "#22C55E",
  guinea: "#4ADE80",
  "resto-de-africa": "#94A3B8",
  china: "#B45309",
  pakistan: "#92400E",
  india: "#F59E0B",
  filipinas: "#FBBF24",
  bangladesh: "#FCD34D",
  "resto-de-asia": "#94A3B8",
  "resto-de-oceania": "#64748B",
};

export function getCountryColor(countryId: string, fallbackBlockColor: string): string {
  return COUNTRY_COLORS[countryId] || fallbackBlockColor;
}

// Convert angle to SVG arc path
export function describeArc(
  cx: number,
  cy: number,
  rIn: number,
  rOut: number,
  startAngleRad: number,
  endAngleRad: number
): string {
  let delta = endAngleRad - startAngleRad;
  if (delta < 0.0001) return "";
  if (delta >= 2 * Math.PI) {
    delta = 2 * Math.PI - 0.0001;
    endAngleRad = startAngleRad + delta;
  }

  const x1Outer = cx + rOut * Math.cos(startAngleRad);
  const y1Outer = cy + rOut * Math.sin(startAngleRad);
  const x2Outer = cx + rOut * Math.cos(endAngleRad);
  const y2Outer = cy + rOut * Math.sin(endAngleRad);

  const x1Inner = cx + rIn * Math.cos(startAngleRad);
  const y1Inner = cy + rIn * Math.sin(startAngleRad);
  const x2Inner = cx + rIn * Math.cos(endAngleRad);
  const y2Inner = cy + rIn * Math.sin(endAngleRad);

  const largeArcFlag = delta > Math.PI ? 1 : 0;

  return [
    `M ${x1Outer} ${y1Outer}`,
    `A ${rOut} ${rOut} 0 ${largeArcFlag} 1 ${x2Outer} ${y2Outer}`,
    `L ${x2Inner} ${y2Inner}`,
    `A ${rIn} ${rIn} 0 ${largeArcFlag} 0 ${x1Inner} ${y1Inner}`,
    "Z",
  ].join(" ");
}

// Destination node: Madrid, Spain
export const font_dest = {
  id: "spain",
  name: "España (Madrid)",
  lng: -3.7038,
  lat: 40.4168,
};

// Regional highway waypoints for Force-Directed Edge Bundling
export const BUNDLE_WAYPOINTS: Record<string, [number, number]> = {
  "america-hispanohablante": [-28.0, 22.0],
  "america-no-hispanohablante": [-32.0, 38.0],
  europa: [8.0, 46.0],
  africa: [-5.5, 33.5],
  asia: [30.0, 35.0],
  oceania: [40.0, 25.0],
};

// Map of all country centroids (Longitude, Latitude)
export const COUNTRY_GEO_MAP: Record<string, CountryGeo> = {
  // América Hispanohablante
  colombia: { id: "colombia", name: "Colombia", blockId: "america-hispanohablante", blockName: "América (Hispanohablante)", lng: -74.0721, lat: 4.7110 },
  venezuela: { id: "venezuela", name: "Venezuela", blockId: "america-hispanohablante", blockName: "América (Hispanohablante)", lng: -66.9036, lat: 10.4806 },
  peru: { id: "peru", name: "Perú", blockId: "america-hispanohablante", blockName: "América (Hispanohablante)", lng: -77.0428, lat: -12.0464 },
  argentina: { id: "argentina", name: "Argentina", blockId: "america-hispanohablante", blockName: "América (Hispanohablante)", lng: -58.3816, lat: -34.6037 },
  honduras: { id: "honduras", name: "Honduras", blockId: "america-hispanohablante", blockName: "América (Hispanohablante)", lng: -87.2068, lat: 14.0723 },
  ecuador: { id: "ecuador", name: "Ecuador", blockId: "america-hispanohablante", blockName: "América (Hispanohablante)", lng: -78.4678, lat: -0.1807 },
  cuba: { id: "cuba", name: "Cuba", blockId: "america-hispanohablante", blockName: "América (Hispanohablante)", lng: -82.3666, lat: 23.1136 },
  paraguay: { id: "paraguay", name: "Paraguay", blockId: "america-hispanohablante", blockName: "América (Hispanohablante)", lng: -57.5759, lat: -25.2637 },
  "rep-dominicana": { id: "rep-dominicana", name: "República Dominicana", blockId: "america-hispanohablante", blockName: "América (Hispanohablante)", lng: -69.9312, lat: 18.4861 },
  "resto-de-america-hispanohablante": { id: "resto-de-america-hispanohablante", name: "Resto de América (Hisp.)", blockId: "america-hispanohablante", blockName: "América (Hispanohablante)", lng: -75.0000, lat: 10.0000 },

  // América No Hispanohablante
  brasil: { id: "brasil", name: "Brasil", blockId: "america-no-hispanohablante", blockName: "América (No Hispanohablante)", lng: -47.9292, lat: -15.7801 },
  "estados-unidos": { id: "estados-unidos", name: "Estados Unidos", blockId: "america-no-hispanohablante", blockName: "América (No Hispanohablante)", lng: -77.0369, lat: 38.9072 },
  canada: { id: "canada", name: "Canadá", blockId: "america-no-hispanohablante", blockName: "América (No Hispanohablante)", lng: -75.6972, lat: 45.4215 },
  "resto-de-america-no-hispanohablante": { id: "resto-de-america-no-hispanohablante", name: "Resto América (No Hisp.)", blockId: "america-no-hispanohablante", blockName: "América (No Hispanohablante)", lng: -70.0000, lat: 35.0000 },

  // Europa
  rumania: { id: "rumania", name: "Rumanía", blockId: "europa", blockName: "Europa", lng: 26.1025, lat: 44.4323 },
  "reino-unido": { id: "reino-unido", name: "Reino Unido", blockId: "europa", blockName: "Europa", lng: -0.1276, lat: 51.5074 },
  italia: { id: "italia", name: "Italia", blockId: "europa", blockName: "Europa", lng: 12.4964, lat: 41.9028 },
  ucrania: { id: "ucrania", name: "Ucrania", blockId: "europa", blockName: "Europa", lng: 30.5234, lat: 50.4501 },
  francia: { id: "francia", name: "Francia", blockId: "europa", blockName: "Europa", lng: 2.3522, lat: 48.8566 },
  alemania: { id: "alemania", name: "Alemania", blockId: "europa", blockName: "Europa", lng: 13.4050, lat: 52.5200 },
  rusia: { id: "rusia", name: "Rusia", blockId: "europa", blockName: "Europa", lng: 37.6173, lat: 55.7558 },
  portugal: { id: "portugal", name: "Portugal", blockId: "europa", blockName: "Europa", lng: -9.1393, lat: 38.7223 },
  bulgaria: { id: "bulgaria", name: "Bulgaria", blockId: "europa", blockName: "Europa", lng: 23.3219, lat: 42.6977 },
  "resto-de-europa": { id: "resto-de-europa", name: "Resto de Europa", blockId: "europa", blockName: "Europa", lng: 20.0000, lat: 50.0000 },

  // África
  marruecos: { id: "marruecos", name: "Marruecos", blockId: "africa", blockName: "África", lng: -6.8498, lat: 33.9716 },
  argelia: { id: "argelia", name: "Argelia", blockId: "africa", blockName: "África", lng: 3.0588, lat: 36.7538 },
  senegal: { id: "senegal", name: "Senegal", blockId: "africa", blockName: "África", lng: -17.4677, lat: 14.7167 },
  mali: { id: "mali", name: "Mali", blockId: "africa", blockName: "África", lng: -8.0029, lat: 12.6392 },
  nigeria: { id: "nigeria", name: "Nigeria", blockId: "africa", blockName: "África", lng: 7.4951, lat: 9.0579 },
  gambia: { id: "gambia", name: "Gambia", blockId: "africa", blockName: "África", lng: -16.5790, lat: 13.4549 },
  "guinea-ecuatorial": { id: "guinea-ecuatorial", name: "Guinea Ecuatorial", blockId: "africa", blockName: "África", lng: 8.7832, lat: 3.7504 },
  ghana: { id: "ghana", name: "Ghana", blockId: "africa", blockName: "África", lng: -0.1870, lat: 5.6037 },
  guinea: { id: "guinea", name: "Guinea", blockId: "africa", blockName: "África", lng: -13.6785, lat: 9.6412 },
  "resto-de-africa": { id: "resto-de-africa", name: "Resto de África", blockId: "africa", blockName: "África", lng: 18.0000, lat: -2.0000 },

  // Asia
  china: { id: "china", name: "China", blockId: "asia", blockName: "Asia", lng: 116.4074, lat: 39.9042 },
  pakistan: { id: "pakistan", name: "Pakistán", blockId: "asia", blockName: "Asia", lng: 73.0479, lat: 33.6844 },
  india: { id: "india", name: "India", blockId: "asia", blockName: "Asia", lng: 77.2090, lat: 28.6139 },
  filipinas: { id: "filipinas", name: "Filipinas", blockId: "asia", blockName: "Asia", lng: 120.9842, lat: 14.5995 },
  bangladesh: { id: "bangladesh", name: "Bangladesh", blockId: "asia", blockName: "Asia", lng: 90.4125, lat: 23.8103 },
  "resto-de-asia": { id: "resto-de-asia", name: "Resto de Asia", blockId: "asia", blockName: "Asia", lng: 80.0000, lat: 30.0000 },

  // Oceanía
  "resto-de-oceania": { id: "resto-de-oceania", name: "Oceanía", blockId: "oceania", blockName: "Oceanía", lng: 135.0000, lat: -25.0000 },
};

// Robust Web-GIS Equirectangular / Miller Projection mapping [lng, lat] to SVG [x, y]
export function projectCoordinates(
  lng: number,
  lat: number,
  width: number,
  height: number,
  zoom = 1,
  panX = 0,
  panY = 0
): { x: number; y: number } {
  // Bounding box for Atlantic / Mediterranean Basin (Span: W -95 to E 45, S -45 to N 65)
  const minLng = -95;
  const maxLng = 45;
  const minLat = -45;
  const maxLat = 65;

  const mapSpanLng = maxLng - minLng;
  const mapSpanLat = maxLat - minLat;

  const xNorm = (lng - minLng) / mapSpanLng;
  const yNorm = (maxLat - lat) / mapSpanLat; // Inverted Y for SVG

  const baseScale = Math.max(width, height) * 1.25 * zoom;
  const offsetX = (width - baseScale) / 2 + panX;
  const offsetY = (height - (baseScale * (mapSpanLat / mapSpanLng))) / 2 + panY;

  const x = xNorm * baseScale * 0.95 + offsetX;
  const y = yNorm * (baseScale * 0.7) + offsetY;

  return { x, y };
}

// Generate smooth bundled Bézier path
export function generateBundledArcPath(
  x0: number,
  y0: number,
  xw: number,
  yw: number,
  x1: number,
  y1: number,
  bundleEnabled = true
): string {
  if (!bundleEnabled) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const cx = (x0 + x1) / 2 - dy * 0.2;
    const cy = (y0 + y1) / 2 + dx * 0.2;
    return `M ${x0} ${y0} Q ${cx} ${cy} ${x1} ${y1}`;
  }

  const ctrl1X = (x0 + xw) / 2;
  const ctrl1Y = (y0 + yw) / 2;
  const ctrl2X = (xw + x1) / 2;
  const ctrl2Y = (yw + y1) / 2;

  return `M ${x0} ${y0} Q ${ctrl1X} ${ctrl1Y} ${xw} ${yw} Q ${ctrl2X} ${ctrl2Y} ${x1} ${y1}`;
}

// Color scale mapping volume to vibrant neon palette
export function getArcColor(volume: number, maxVolume: number): string {
  if (!volume || volume <= 0) return "#64748b";
  const ratio = Math.min(1, volume / (maxVolume || 1));

  if (ratio < 0.08) return "#f97316"; // Bajo (Orange)
  if (ratio < 0.25) return "#eab308"; // Medio (Yellow)
  if (ratio < 0.55) return "#ec4899"; // Alto (Magenta)
  return "#38bdf8"; // Pico (Cyan)
}

// Spanish number formatting
export function formatSpanishNumber(val: number): string {
  if (val === undefined || val === null) return "0";
  return Math.round(val).toLocaleString("es-ES");
}

export function formatCompactSpanish(val: number): string {
  if (Math.abs(val) >= 1_000_000) {
    return `${(val / 1_000_000).toLocaleString("es-ES", { maximumFractionDigits: 2 })}M`;
  }
  if (Math.abs(val) >= 1_000) {
    return `${(val / 1_000).toLocaleString("es-ES", { maximumFractionDigits: 0 })}k`;
  }
  return val.toLocaleString("es-ES");
}

export type { ImmigrationItem } from "@/types";


// ==========================================
// FILE: components/detail/immigration/worldMapRenderer.ts
// ==========================================

import countriesData from "./countriesGeo.json";

export function projectCoordinates(
  lng: number,
  lat: number,
  width: number,
  height: number,
  zoom = 1,
  panX = 0,
  panY = 0
): { x: number; y: number } {
  const minLng = -180;
  const maxLng = 180;
  const minLat = -60;
  const maxLat = 80;

  const mapSpanLng = maxLng - minLng;
  const mapSpanLat = maxLat - minLat;

  const xNorm = (lng - minLng) / mapSpanLng;
  const yNorm = (maxLat - lat) / mapSpanLat;

  const baseScale = Math.min(width, height) * 1.55 * zoom;
  const offsetX = (width - baseScale) / 2 + panX;
  const offsetY = (height - baseScale * 0.55) / 2 + panY;

  const x = xNorm * baseScale + offsetX;
  const y = yNorm * (baseScale * 0.55) + offsetY;

  return { x, y };
}

const COUNTRY_NAME_MAPPING: Record<string, string[]> = {
  colombia: ["Colombia"],
  venezuela: ["Venezuela"],
  peru: ["Peru", "Perú"],
  argentina: ["Argentina"],
  honduras: ["Honduras"],
  ecuador: ["Ecuador"],
  cuba: ["Cuba"],
  paraguay: ["Paraguay"],
  "rep-dominicana": ["Dominican Rep.", "Dominican Republic"],
  brasil: ["Brazil", "Brasil"],
  "estados-unidos": ["United States of America", "United States"],
  canada: ["Canada"],
  rumania: ["Romania", "Rumanía"],
  "reino-unido": ["United Kingdom"],
  italia: ["Italy", "Italia"],
  ucrania: ["Ukraine", "Ucrania"],
  francia: ["France", "Francia"],
  alemania: ["Germany", "Alemania"],
  rusia: ["Russia", "Rusia"],
  portugal: ["Portugal"],
  bulgaria: ["Bulgaria"],
  marruecos: ["Morocco", "Marruecos"],
  argelia: ["Algeria", "Argelia"],
  senegal: ["Senegal"],
  mali: ["Mali"],
  nigeria: ["Nigeria"],
  gambia: ["Gambia"],
  "guinea-ecuatorial": ["Eq. Guinea", "Equatorial Guinea"],
  ghana: ["Ghana"],
  guinea: ["Guinea"],
  china: ["China"],
  pakistan: ["Pakistan"],
  india: ["India"],
  filipinas: ["Philippines"],
  bangladesh: ["Bangladesh"],
};

export function getChoroplethCountryPolygons(
  width: number,
  height: number,
  zoom: number,
  panX: number,
  panY: number
): Array<{ featureId: string; countryId: string | null; name: string; pathD: string }> {
  const result: Array<{ featureId: string; countryId: string | null; name: string; pathD: string }> = [];
  const features = (countriesData as any).features || [];

  features.forEach((feature: any, fIdx: number) => {
    const props = feature.properties || {};
    const name = props.NAME || props.ADMIN || `Country_${fIdx}`;

    let matchedCountryId: string | null = null;
    if (name === "Spain" || name === "España") {
      matchedCountryId = "spain";
    } else {
      for (const [cId, namesList] of Object.entries(COUNTRY_NAME_MAPPING)) {
        if (namesList.includes(name) || namesList.includes(props.NAME_LONG)) {
          matchedCountryId = cId;
          break;
        }
      }
    }

    const geom = feature.geometry;
    if (!geom) return;

    const polygons: Array<Array<[number, number]>> = [];
    if (geom.type === "Polygon") {
      if (geom.coordinates && geom.coordinates[0]) {
        polygons.push(geom.coordinates[0]);
      }
    } else if (geom.type === "MultiPolygon") {
      geom.coordinates.forEach((polyCoords: Array<Array<[number, number]>>) => {
        if (polyCoords && polyCoords[0]) {
          polygons.push(polyCoords[0]);
        }
      });
    }

    polygons.forEach((ring) => {
      const coords: string[] = [];
      ring.forEach(([lng, lat]: [number, number], index: number) => {
        const pt = projectCoordinates(lng, lat, width, height, zoom, panX, panY);
        const cmd = index === 0 ? "M" : "L";
        coords.push(`${cmd} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`);
      });

      if (coords.length > 2) {
        result.push({
          featureId: `${fIdx}_${Math.random()}`,
          countryId: matchedCountryId,
          name,
          pathD: `${coords.join(" ")} Z`,
        });
      }
    });
  });

  return result;
}


// ==========================================
// FILE: components/directory/DirectoryRow.tsx
// ==========================================

"use client";

import { ItemIndexItem, DatoItem } from "@/types";
import { formatSpanishCompact, formatSpanishExact } from "./utils";
import Sparkline from "./Sparkline";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface DirectoryRowProps {
  item: ItemIndexItem;
  detail?: DatoItem | null;
}

export default function DirectoryRow({ item, detail }: DirectoryRowProps) {
  let latestYear = item.latestYear || "";
  let latestValue = item.latestValue ?? 0;

  if (detail?.dataPoints && detail.dataPoints.length > 0) {
    const lastPt = detail.dataPoints[detail.dataPoints.length - 1];
    latestYear = lastPt.year || lastPt.date || latestYear;
    const rawVal = lastPt.value;
    if (typeof rawVal === "number") {
      latestValue = rawVal;
    } else if (Array.isArray(rawVal)) {
      const arr = rawVal as Array<any>;
      const totObj = arr.find((o: any) => o && typeof o === "object" && "total" in o) || arr[0];
      latestValue = totObj ? (Object.values(totObj)[0] as number) : latestValue;
    }
  }

  const compactVal = formatSpanishCompact(latestValue);
  const exactVal = formatSpanishExact(latestValue);
  const sourceName = detail?.source?.institution || "INE";
  const unit = item.unit || "personas";

  return (
    <Link
      href={`/dato/${item.id}`}
      className="group flex flex-col sm:flex-row sm:items-center justify-between py-3.5 px-3 rounded-xl hover:bg-white/[0.02] border-b border-white/[0.06] transition-all cursor-pointer gap-3 sm:gap-4 no-underline"
    >
      {/* Left Editorial Content */}
      <div className="space-y-1 flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-[#F1F5F9] group-hover:text-[#3B82F6] transition-colors leading-snug truncate">
            {item.question}
          </h4>
        </div>
        <div className="text-xs text-[#94A3B8] font-medium flex items-center gap-1.5">
          <span>{sourceName}</span>
          <span>·</span>
          <span>{latestYear}</span>
        </div>
      </div>

      {/* Right Numeric & Sparkline Content */}
      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
        {detail?.dataPoints && (
          <div className="hidden md:block">
            <Sparkline dataPoints={detail.dataPoints} width={90} height={28} color="#3B82F6" />
          </div>
        )}

        <div className="text-left sm:text-right">
          <div
            className="text-base font-bold text-white font-mono tabular-nums tracking-tight"
            title={`${exactVal} ${unit}`}
          >
            {compactVal}
          </div>
          <div className="text-[11px] text-[#64748B] font-medium">
            {unit}
          </div>
        </div>

        <div className="w-6 h-6 rounded-full bg-white/[0.04] group-hover:bg-blue-600/20 text-[#64748B] group-hover:text-[#3B82F6] flex items-center justify-center transition-all">
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </Link>
  );
}


// ==========================================
// FILE: components/directory/DirectorySection.tsx
// ==========================================

"use client";

import { useState } from "react";
import { ItemIndexItem, DatoItem, Category } from "@/types";
import DirectoryRow from "./DirectoryRow";
import { ChevronDown, ChevronUp, Layers } from "lucide-react";

interface DirectorySectionProps {
  category: Category;
  items: ItemIndexItem[];
  detailsMap: Record<string, DatoItem>;
}

const CATEGORY_ICONS: Record<Category, string> = {
  Todas: "📊",
  Vivienda: "🏠",
  "Economía y Empleo": "📈",
  Sanidad: "🏥",
  "Pensiones y Demografía": "👥",
};

export default function DirectorySection({
  category,
  items,
  detailsMap,
}: DirectorySectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (items.length === 0) return null;

  return (
    <section id={`section-${category}`} className="scroll-mt-24 space-y-3">
      {/* Section Header */}
      <div
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between py-3 px-3 rounded-xl bg-white/[0.03] border border-white/[0.06] cursor-pointer hover:bg-white/[0.05] transition-all"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-base">{CATEGORY_ICONS[category] || "📁"}</span>
          <h3 className="text-xs font-black uppercase tracking-wider text-[#F1F5F9]">
            {category}
          </h3>
          <span className="text-[10px] font-bold text-[#64748B] bg-white/[0.06] px-2 py-0.5 rounded-full">
            {items.length} {items.length === 1 ? "indicador" : "indicadores"}
          </span>
        </div>

        <button className="text-[#94A3B8] hover:text-white transition-colors">
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {/* Rows Container */}
      {!isCollapsed && (
        <div className="space-y-1 pl-1">
          {items.map((item) => (
            <DirectoryRow
              key={item.id}
              item={item}
              detail={detailsMap[item.id]}
            />
          ))}
        </div>
      )}
    </section>
  );
}


// ==========================================
// FILE: components/directory/Sparkline.tsx
// ==========================================

"use client";

import { useMemo } from "react";

interface SparklineProps {
  dataPoints: Array<{ year?: string; date?: string; value: any }>;
  width?: number;
  height?: number;
  color?: string;
}

export default function Sparkline({
  dataPoints,
  width = 110,
  height = 32,
  color = "#3B82F6",
}: SparklineProps) {
  const points = useMemo(() => {
    if (!Array.isArray(dataPoints) || dataPoints.length === 0) return [];

    const extracted = dataPoints.map((dp) => {
      let val = 0;
      const rawVal = dp.value;
      if (typeof rawVal === "number") {
        val = rawVal;
      } else if (Array.isArray(rawVal)) {
        const totalObj = rawVal.find((item: any) => item && typeof item === "object" && "total" in item) || rawVal[0];
        val = totalObj ? (Object.values(totalObj)[0] as number) : 0;
      }
      return val;
    });

    const min = Math.min(...extracted);
    const max = Math.max(...extracted);
    const range = max - min || 1;
    const padding = 4;
    const drawW = width - padding * 2;
    const drawH = height - padding * 2;

    return extracted.map((v, idx) => {
      const x = padding + (idx / (extracted.length - 1 || 1)) * drawW;
      const y = height - padding - ((v - min) / range) * drawH;
      return { x, y };
    });
  }, [dataPoints, width, height]);

  if (points.length < 2) return null;

  const pathD = `M ${points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" L ")}`;

  return (
    <svg width={width} height={height} className="overflow-visible shrink-0">
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r="3"
        fill={color}
      />
    </svg>
  );
}


// ==========================================
// FILE: components/directory/utils.ts
// ==========================================

// Spanish Number Formatter with automatic compact abbreviations (MM, M, mil)

export function formatSpanishCompact(val: number): string {
  if (val === undefined || val === null || isNaN(val)) return "0";
  const abs = Math.abs(val);

  if (abs >= 1_000_000_000) {
    return `${(val / 1_000_000_000).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MM`;
  }
  if (abs >= 1_000_000) {
    return `${(val / 1_000_000).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} M`;
  }
  if (abs >= 10_000) {
    return `${(val / 1_000).toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mil`;
  }
  if (abs >= 1_000) {
    return val.toLocaleString("es-ES");
  }
  return val.toLocaleString("es-ES");
}

export function formatSpanishExact(val: number): string {
  if (val === undefined || val === null || isNaN(val)) return "0";
  return Math.round(val).toLocaleString("es-ES");
}


// ==========================================
// FILE: components/home/CountyCard.tsx
// ==========================================

import Link from "next/link";
import { CountyIndexItem, MetricMeta } from "@/types";
import { ChevronRight, Calendar, MapPin } from "lucide-react";

interface CountyCardProps {
  county: CountyIndexItem;
  selectedMetric: string;
  metricMeta?: MetricMeta;
}

export default function CountyCard({ county, selectedMetric, metricMeta }: CountyCardProps) {
  const latestValue = county.latest_summary ? county.latest_summary[selectedMetric] : county.latestValue;
  const unit = metricMeta?.unit || "";
  const title = metricMeta?.title || selectedMetric;

  const formattedValue =
    typeof latestValue === "number"
      ? unit === "percent"
        ? `${latestValue}%`
        : latestValue.toLocaleString()
      : "N/A";

  return (
    <Link
      href={`/county/${county.id}`}
      className="group block bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 active:scale-[0.99] touch-manipulation"
    >
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-lg">
          <MapPin className="w-3 h-3 text-blue-600" />
          {county.state ? `${county.name}, ${county.state}` : county.name}
        </span>
        <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          County ID: {county.id}
        </span>
      </div>

      <h2 className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug mb-4">
        {county.name}
      </h2>

      <div className="flex items-end justify-between border-t border-slate-100 pt-3 mt-2">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
            {title}
          </div>
          <div className="text-xl font-bold text-slate-900 leading-none mt-1">
            {formattedValue}{" "}
            {unit && unit !== "percent" && (
              <span className="text-xs font-normal text-slate-500">
                {unit}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform">
          <span>View Dashboard</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  );
}


// ==========================================
// FILE: components/home/QuestionCard.tsx
// ==========================================

import Link from "next/link";
import { ItemIndexItem, DatoItem } from "@/types";
import { ChevronRight, Calendar } from "lucide-react";

interface QuestionCardProps {
  item: ItemIndexItem | DatoItem;
}

export default function QuestionCard({ item }: QuestionCardProps) {
  const category = item.category;
  const question = item.question;
  const unit = item.unit;

  let latestYear = "";
  let latestValue: number | string = "";

  if ("latestYear" in item) {
    latestYear = item.latestYear;
    latestValue = item.latestValue;
  } else if ("dataPoints" in item && item.dataPoints?.length) {
    const lastPoint = item.dataPoints[item.dataPoints.length - 1];
    latestYear = lastPoint.year || lastPoint.date || "";
    latestValue = lastPoint.value;
  }

  return (
    <Link
      href={`/dato/${item.id}`}
      className="group block bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-sm hover:shadow-md hover:border-slate-700 transition-all duration-200 active:scale-[0.99] touch-manipulation"
    >
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span className="inline-block px-2.5 py-1 text-[11px] font-semibold text-blue-300 bg-blue-950/80 border border-blue-800/80 rounded-lg">
          {category}
        </span>
        {latestYear && (
          <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-500" />
            {latestYear}
          </span>
        )}
      </div>

      <h2 className="text-base font-semibold text-white group-hover:text-blue-400 transition-colors leading-snug mb-4">
        {question}
      </h2>

      <div className="flex items-end justify-between border-t border-slate-800/80 pt-3 mt-2">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
            Último dato {latestYear ? `(${latestYear})` : ""}
          </div>
          <div className="text-xl font-bold text-white leading-none mt-1">
            {latestValue !== "" ? latestValue : "N/A"}{" "}
            {unit && (
              <span className="text-xs font-normal text-slate-400">
                {unit}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs font-semibold text-blue-400 group-hover:translate-x-0.5 transition-transform">
          <span>Ver gráfico</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  );
}


// ==========================================
// FILE: components/home/SearchBar.tsx
// ==========================================

"use client";

import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
        <Search className="w-4 h-4" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buscar un dato (ej. paro, alquiler, hipotecas, sanidad)..."
        className="w-full pl-10 pr-10 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
          aria-label="Limpiar búsqueda"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}


// ==========================================
// FILE: components/home/TopicFilter.tsx
// ==========================================

"use client";

import { Category } from "@/types";
import { Building2, TrendingUp, HeartPulse, Users, LayoutGrid } from "lucide-react";

interface TopicFilterProps {
  categories: Category[];
  selectedCategory: Category;
  onSelectCategory: (category: Category) => void;
}

const categoryIcons: Record<Category, React.ReactNode> = {
  Todas: <LayoutGrid className="w-4 h-4 shrink-0" />,
  Vivienda: <Building2 className="w-4 h-4 shrink-0" />,
  "Economía y Empleo": <TrendingUp className="w-4 h-4 shrink-0" />,
  Sanidad: <HeartPulse className="w-4 h-4 shrink-0" />,
  "Pensiones y Demografía": <Users className="w-4 h-4 shrink-0" />,
};

export default function TopicFilter({
  categories,
  selectedCategory,
  onSelectCategory,
}: TopicFilterProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full">
      {categories.map((category) => {
        const isSelected = selectedCategory === category;
        const isTodas = category === "Todas";
        return (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 active:scale-95 touch-manipulation text-center ${
              isTodas ? "col-span-2 sm:col-span-1" : "col-span-1"
            } ${
              isSelected
                ? "bg-blue-600 text-white shadow-md ring-1 ring-blue-500"
                : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
            }`}
          >
            <span className={isSelected ? "text-white" : "text-slate-400"}>
              {categoryIcons[category]}
            </span>
            <span className="truncate">{category}</span>
          </button>
        );
      })}
    </div>
  );
}


// ==========================================
// FILE: components/layout/Footer.tsx
// ==========================================

import Link from "next/link";
import { ShieldCheck, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-900/90 py-8 px-4 mt-16 text-slate-400 text-xs">
      <div className="max-w-3xl mx-auto flex flex-col gap-4 text-center sm:text-left sm:flex-row sm:justify-between sm:items-center">
        <div className="space-y-1">
          <p className="font-semibold text-slate-200 flex items-center justify-center sm:justify-start gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-400 inline" />
            Transparencia y Neutralidad Radical
          </p>
          <p className="text-slate-400">
            Proyecto independiente y sin ánimo de lucro. Fuentes oficiales: INE, CIS, Banco de España y Ministerios.
          </p>
        </div>
        <div className="flex flex-col sm:items-end gap-2 text-slate-400">
          <div className="flex justify-center gap-4">
            <Link href="/" className="hover:text-white underline">
              Inicio
            </Link>
          </div>
          <a
            href="mailto:factores-feedback@proton.me"
            className="inline-flex items-center justify-center sm:justify-end gap-1 text-slate-300 hover:text-blue-400 transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>factores-feedback@proton.me</span>
          </a>
        </div>
      </div>
    </footer>
  );
}


// ==========================================
// FILE: components/layout/Header.tsx
// ==========================================

import Link from "next/link";
import { BarChart3 } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-sm">
      <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link 
          href="/" 
          className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-md">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none text-white tracking-tight">
              Factor<span className="text-blue-400">.es</span>
            </h1>
          </div>
        </Link>
      </div>
    </header>
  );
}


// ==========================================
// FILE: lib/data-utils.ts
// ==========================================

import { GlobalMetadata, DatoItem, ItemIndexItem, Category } from "@/types";

export const DATA_BASE_URL =
  process.env.NEXT_PUBLIC_DATA_BASE_URL || "/data";

const cleanBaseUrl = DATA_BASE_URL.replace(/\/$/, "");

export async function fetchMetadata(): Promise<GlobalMetadata> {
  try {
    const res = await fetch(`${cleanBaseUrl}/metadata.json`);
    if (!res.ok) {
      return { last_updated: new Date().toISOString().split("T")[0], total_items: 0 };
    }
    return await res.json();
  } catch (err) {
    console.warn("Could not fetch metadata.json:", err);
    return { last_updated: new Date().toISOString().split("T")[0], total_items: 0 };
  }
}

export async function fetchItems(): Promise<ItemIndexItem[]> {
  try {
    const res = await fetch(`${cleanBaseUrl}/items.json`);
    if (!res.ok) {
      const fallbackRes = await fetch(`${cleanBaseUrl}/counties.json`);
      if (!fallbackRes.ok) return [];
      const counties = await fallbackRes.json();
      return counties.map((c: any) => ({
        id: c.id,
        category: "Economía y Empleo",
        question: c.name,
        unit: "",
        latestValue: c.latest_summary ? Object.values(c.latest_summary)[0] as number : 0,
        latestYear: "2026",
        lastUpdated: c.last_updated || "2026-11-01"
      }));
    }
    return await res.json();
  } catch (err) {
    console.warn("Could not fetch items index:", err);
    return [];
  }
}

export const fetchCounties = fetchItems;

export async function fetchItemDetail(id: string): Promise<DatoItem | null> {
  try {
    let res = await fetch(`${cleanBaseUrl}/items/${id}.json`);
    if (!res.ok) {
      res = await fetch(`${cleanBaseUrl}/counties/${id}.json`);
    }
    if (!res.ok) return null;
    const raw = await res.json();

    if (raw.metrics) {
      const metricKey = Object.keys(raw.metrics)[0];
      const metric = raw.metrics[metricKey];
      return {
        id: raw.county_id || raw.id,
        category: raw.category || "Economía y Empleo",
        question: raw.name || raw.question || metricKey,
        chartType: "line",
        unit: metric?.unit || raw.unit || "",
        dataPoints: (metric?.series || []).map((s: any) => ({
          year: s.date || s.year,
          value: s.value
        })),
        contextNotes: raw.contextNotes || [],
        source: raw.source || { institution: "Fuente Oficial", url: "#", lastUpdated: raw.last_updated }
      };
    }

    return raw as DatoItem;
  } catch (err) {
    console.warn(`Could not fetch item detail for ${id}:`, err);
    return null;
  }
}

export const fetchCountyDetail = fetchItemDetail;

export function getAllCategories(): Category[] {
  return [
    "Todas",
    "Vivienda",
    "Economía y Empleo",
    "Sanidad",
    "Pensiones y Demografía",
  ];
}


// ==========================================
// FILE: next-env.d.ts
// ==========================================

/// <reference types="next" />
/// <reference types="next/image-types/global" />
/// <reference path="./.next/types/routes.d.ts" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.


// ==========================================
// FILE: next.config.ts
// ==========================================

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;


// ==========================================
// FILE: types/index.ts
// ==========================================

export const CATEGORIES = [
  "Todas",
  "Vivienda",
  "Economía y Empleo",
  "Sanidad",
  "Pensiones y Demografía",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type ChartType = "line" | "bar";

export interface DataPoint {
  year: string;
  value: number;
  date?: string;
}

export type MetricSeriesPoint = DataPoint;

export interface MetricSource {
  institution: string;
  url: string;
  lastUpdated?: string;
}

export interface SourceInfo extends MetricSource {
  title?: string;
  shortName?: string;
  tableId?: string;
  period?: string;
}

export interface TraceableSource {
  source?: SourceInfo;
  sources?: SourceInfo[];
}

export interface BaseEntityItem {
  id: string;
  category: Category;
  question: string;
  unit: string;
  name?: string;
  state?: string;
}

export interface DatoItem extends BaseEntityItem, TraceableSource {
  chartType: ChartType;
  dataPoints: DataPoint[];
  contextNotes: string[];
  last_updated?: string;
  metrics?: Record<string, any>;
}

export type CountyDetail = DatoItem;

export interface ItemIndexItem extends BaseEntityItem {
  latestValue: number;
  latestYear: string;
  lastUpdated: string;
  latest_summary?: Record<string, number>;
}

export type CountyIndexItem = ItemIndexItem;

export interface MetricMeta {
  title: string;
  unit: string;
  description?: string;
  source?: MetricSource;
}

export interface GlobalMetadata {
  last_updated: string;
  metrics?: Record<string, MetricMeta>;
  categories?: Category[];
  total_items?: number;
}

// Specific domain types for Immigration series
export interface RegionalBlockData {
  total: number;
  countries: Record<string, number>;
}

export interface AnnualBlock {
  year: string;
  total: number;
  blocks: Record<string, RegionalBlockData>;
}

export interface ImmigrationItem extends TraceableSource {
  id: string;
  category?: Category | string;
  question?: string;
  unit?: string;
  blocks: Array<{
    id: string;
    name: string;
    color: string;
    countries: Array<{ id: string; name: string }>;
  }>;
  annualBlocks: AnnualBlock[];
}


