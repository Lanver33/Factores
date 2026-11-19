import type { Metadata, Viewport } from "next";
import "@/app/globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Factor.es | Official Spanish Data Without Political Spin",
  description:
    "Unified and neutral directory to explore official historical series from INE, CIS, Bank of Spain, and Ministries in 2 clicks.",
  keywords: [
    "official data spain",
    "INE",
    "spanish statistics",
    "youth unemployment",
    "rent price",
    "public healthcare",
    "pensions",
    "immigration",
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#020617",
};

export default function EnglishRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-slate-950 text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
        <Header locale="en" />
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
          {children}
        </main>
        <Footer locale="en" />
      </body>
    </html>
  );
}
