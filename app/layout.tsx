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
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
