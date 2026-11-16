import Link from "next/link";
import { ArrowLeft, ShieldCheck, Scale, RefreshCw, FileCode } from "lucide-react";

export const metadata = {
  title: "Metodología y Fuentes | DatoOficial.es",
  description:
    "Conoce nuestros principios de neutralidad radical, trazabilidad directa a organismos oficiales y ausencia de sesgo.",
};

export default function MetodologiaPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full transition-colors shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al inicio</span>
        </Link>
      </div>

      <header className="space-y-2 border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900">
          Metodología y Principios de Neutralidad
        </h1>
        <p className="text-sm text-slate-600">
          Transparencia técnica y compromiso cívico sin ánimo de lucro.
        </p>
      </header>

      <div className="space-y-6 text-slate-700 text-sm leading-relaxed">
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2 text-base">
            <Scale className="w-5 h-5 text-blue-600" />
            1. Neutralidad Radical
          </h2>
          <p className="text-xs text-slate-600">
            En <strong>DatoOficial.es</strong> no se utilizan adjetivos valorativos ni interpretaciones políticas. Todos los textos se limitan a describir la metodología empleada por el organismo oficial correspondiente.
          </p>
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2 text-base">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            2. Series Históricas Amplias
          </h2>
          <p className="text-xs text-slate-600">
            Para evitar el recorte de datos motivado por intereses partidistas, mostramos series históricas de 10 a 20 años siempre que estén disponibles en las fuentes primarias.
          </p>
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2 text-base">
            <RefreshCw className="w-5 h-5 text-blue-600" />
            3. Trazabilidad Directa
          </h2>
          <p className="text-xs text-slate-600">
            Cada tarjeta de dato incluye un enlace directo a la tabla, microdato o publicación oficial del organismo emisor (Instituto Nacional de Estadística, Centro de Investigaciones Sociológicas, Banco de España o Ministerios).
          </p>
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2 text-base">
            <FileCode className="w-5 h-5 text-blue-600" />
            4. Arquitectura Estática y Transparente
          </h2>
          <p className="text-xs text-slate-600">
            Esta web no utiliza bases de datos ni backends complejos. Se genera como una web 100% estática respaldada por un archivo JSON público y auditable.
          </p>
        </section>
      </div>
    </div>
  );
}
