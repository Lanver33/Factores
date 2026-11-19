import fs from "node:fs";
import path from "node:path";
import * as d3Geo from "d3-geo";
import { IndicatorSchema, type Indicator, type DirectoryIndexItem } from "../src/domain/indicator.schema";

const CONTENT_DIR = path.join(process.cwd(), "content");
const INDICATORS_DIR = path.join(CONTENT_DIR, "indicators");
const GEO_RAW_PATH = path.join(CONTENT_DIR, "geo", "world-natural-earth.raw.json");
const GENERATED_DIR = path.join(process.cwd(), "generated");
const DIRECTORY_INDEX_PATH = path.join(GENERATED_DIR, "directory-index.json");
const PROJECTED_WORLD_PATH = path.join(GENERATED_DIR, "projected-world.json");
const PROMPT_TEMPLATE_PATH = path.join(process.cwd(), "PROMPT_TEMPLATE.md");

function roundSvgPath(d: string, decimals = 1): string {
  const regex = new RegExp(`(\\d+\\.\\d{${decimals}})\\d+`, "g");
  return d.replace(regex, "$1");
}

export function compileIndicators(): {
  indicators: Indicator[];
  indexItems: DirectoryIndexItem[];
} {
  console.log("[Compiler] Loading indicators from content/indicators/*.json...");

  if (!fs.existsSync(INDICATORS_DIR)) {
    throw new Error(`Indicators directory not found at ${INDICATORS_DIR}`);
  }

  const files = fs.readdirSync(INDICATORS_DIR).filter((f) => f.endsWith(".json"));
  if (files.length === 0) {
    throw new Error("No indicator JSON files found in content/indicators/");
  }

  const indicators: Indicator[] = [];
  const indexItems: DirectoryIndexItem[] = [];

  for (const file of files) {
    const filePath = path.join(INDICATORS_DIR, file);
    const rawContent = fs.readFileSync(filePath, "utf-8");
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawContent);
    } catch (err) {
      throw new Error(`Invalid JSON syntax in ${filePath}: ${(err as Error).message}`);
    }

    // 1. Zod Validation
    const parseResult = IndicatorSchema.safeParse(parsedJson);
    if (!parseResult.success) {
      console.error(`Validation errors in ${file}:`, parseResult.error.format());
      throw new Error(`Indicator schema validation failed for ${file}`);
    }

    const indicator = parseResult.data;

    // 2. Mathematical Invariants Verification
    if (indicator.kind === "immigration-flow") {
      for (const y of indicator.years) {
        const countrySum = Object.values(y.byCountryIso2).reduce((a, b) => a + b, 0);
        const residualSum = Object.values(y.residualByRegion).reduce((a, b) => a + b, 0);
        const totalSum = countrySum + residualSum;
        const diff = Math.abs(totalSum - y.declaredTotal);
        if (diff > 2) {
          throw new Error(
            `Mathematical invariant violated in ${file} for year ${y.year}: ` +
              `countrySum (${countrySum}) + residualSum (${residualSum}) = ${totalSum} != declaredTotal (${y.declaredTotal}) [diff=${diff}]`
          );
        }
      }
    } else if (indicator.kind === "fiscal-balance") {
      for (const pt of indicator.points) {
        const revSum = Object.values(pt.stateRevenueMmEur).reduce((a, b) => a + b, 0);
        const spendSum = Object.values(pt.stateSpendingMmEur).reduce((a, b) => a + b, 0);

        if (Math.abs(revSum - pt.totalRevenueMmEur) > 0.1) {
          throw new Error(
            `Revenue invariant violated in ${file} for year ${pt.year}: sum=${revSum.toFixed(2)}, declared=${pt.totalRevenueMmEur}`
          );
        }
        if (Math.abs(spendSum - pt.totalSpendingMmEur) > 0.1) {
          throw new Error(
            `Spending invariant violated in ${file} for year ${pt.year}: sum=${spendSum.toFixed(2)}, declared=${pt.totalSpendingMmEur}`
          );
        }
        if (Math.abs(pt.totalRevenueMmEur - pt.totalSpendingMmEur - pt.deficitMmEur) > 0.1) {
          throw new Error(
            `Deficit invariant violated in ${file} for year ${pt.year}: ` +
              `rev (${pt.totalRevenueMmEur}) - spend (${pt.totalSpendingMmEur}) != deficit (${pt.deficitMmEur})`
          );
        }
      }
    }

    // 3. Build precomputed directory index item
    let latestValue = 0;
    let latestPeriod = "";
    let timeHorizon = "";
    let sparkline: number[] = [];

    if (indicator.kind === "time-series") {
      const first = indicator.points[0];
      const last = indicator.points[indicator.points.length - 1];
      latestPeriod = last.period;
      latestValue = last.value;
      timeHorizon = indicator.points.length > 1 ? `${first.period}–${last.period}` : last.period;
      sparkline = indicator.points.map((p) => p.value);
    } else if (indicator.kind === "fiscal-balance") {
      const first = indicator.points[0];
      const last = indicator.points[indicator.points.length - 1];
      latestPeriod = last.year;
      latestValue = last.ratio.foreign;
      timeHorizon = indicator.points.length > 1 ? `${first.year}–${last.year}` : last.year;
      sparkline = indicator.points.map((p) => p.ratio.foreign);
    } else if (indicator.kind === "immigration-flow") {
      const first = indicator.years[0];
      const last = indicator.years[indicator.years.length - 1];
      latestPeriod = last.year;
      latestValue = last.declaredTotal;
      timeHorizon = indicator.years.length > 1 ? `${first.year}–${last.year}` : last.year;
      sparkline = indicator.years.map((y) => y.declaredTotal);
    }

    const primarySource = {
      es: indicator.sources[0].institution.es,
      en: indicator.sources[0].institution.en,
    };

    const searchSummary = {
      es: indicator.contextNotes.es[0] ?? indicator.question.es,
      en: indicator.contextNotes.en[0] ?? indicator.question.en,
    };

    indexItems.push({
      id: indicator.id,
      kind: indicator.kind,
      category: indicator.category,
      question: indicator.question,
      unit: indicator.unit,
      valueFormat: indicator.valueFormat,
      latestValue,
      latestPeriod,
      timeHorizon,
      primarySource,
      searchSummary,
      sparkline,
    });

    indicators.push(indicator);
  }

  // Ensure generated directory exists
  fs.mkdirSync(GENERATED_DIR, { recursive: true });

  // Write directory index
  fs.writeFileSync(DIRECTORY_INDEX_PATH, JSON.stringify(indexItems, null, 2));
  console.log(`[Compiler] Generated ${DIRECTORY_INDEX_PATH} with ${indexItems.length} indicators.`);

  // Sync to public/data for external API consumers / static CDN access
  const publicDataDir = path.join(process.cwd(), "public", "data");
  const publicItemsDir = path.join(publicDataDir, "items");
  fs.mkdirSync(publicItemsDir, { recursive: true });
  fs.writeFileSync(path.join(publicDataDir, "items.json"), JSON.stringify(indexItems, null, 2));
  for (const ind of indicators) {
    fs.writeFileSync(path.join(publicItemsDir, `${ind.id}.json`), JSON.stringify(ind, null, 2));
  }

  return { indicators, indexItems };
}

export function compileGeoMap(): void {
  console.log("[Compiler] Pre-projecting world geography from raw GeoJSON...");

  if (!fs.existsSync(GEO_RAW_PATH)) {
    console.warn(`[Compiler] Raw GeoJSON not found at ${GEO_RAW_PATH}, skipping map compilation.`);
    return;
  }

  const rawGeo = JSON.parse(fs.readFileSync(GEO_RAW_PATH, "utf-8"));
  const width = 1000;
  const height = 520;

  // Visual honesty: Natural Earth projection
  const projection = d3Geo.geoNaturalEarth1().fitSize([width, height], rawGeo as d3Geo.ExtendedFeatureCollection);
  const pathGenerator = d3Geo.geoPath(projection);

  interface ProjectedCountry {
    iso2: string;
    name: string;
    path: string;
  }

  const countries: ProjectedCountry[] = [];
  const rawFeatures = (rawGeo as { features: Array<{ properties: Record<string, any>; geometry: any }> }).features;

  for (const f of rawFeatures) {
    const props = f.properties || {};
    const iso2 = (props.ISO_A2 !== "-99" ? props.ISO_A2 : props.ISO_A2_EH) || props.POSTAL;
    if (!iso2) continue;

    const pathD = pathGenerator(f as any);
    if (pathD) {
      countries.push({
        iso2: iso2.toUpperCase(),
        name: props.NAME || props.ADMIN || iso2,
        path: roundSvgPath(pathD, 1),
      });
    }
  }

  // Pre-project graticule lines
  const graticule = d3Geo.geoGraticule10();
  const graticulePath = pathGenerator(graticule);

  const projectedMapAsset = {
    viewBox: `0 0 ${width} ${height}`,
    width,
    height,
    graticulePath: graticulePath ? roundSvgPath(graticulePath, 1) : "",
    countries,
  };

  fs.mkdirSync(GENERATED_DIR, { recursive: true });
  fs.writeFileSync(PROJECTED_WORLD_PATH, JSON.stringify(projectedMapAsset));
  console.log(
    `[Compiler] Generated ${PROJECTED_WORLD_PATH} with ${countries.length} countries pre-projected.`
  );
}

export function updatePromptTemplate(): void {
  const templateContent = `# Template para Generar Secciones de Datos con IA (Gemini)

Este documento contiene la plantilla para generar objetos JSON válidos bajo el nuevo modelo canónico (\`IndicatorSchema\`) e importarlos en \`content/indicators/\`.

---

## 📋 Prompt para Gemini

Copia y pega el siguiente texto en Gemini, sustituyendo la línea del tema por la pregunta o tema que quieras investigar:

\`\`\`text
Actúa como un analista de datos especializado en datos públicos u oficiales de España (INE, Banco de España, Ministerios, Eurostat, CIS). 

Tu objetivo es generar una tarjeta de datos completa en formato JSON para nuestra plataforma de transparencia pública ("Factores").

REGLAS DE ORO DE LA PLATAFORMA:
1. NEUTRALIDAD RADICAL: Cero adjetivos valorativos, juicios de valor ni opiniones políticas. El texto debe ser 100% neutro, técnico, desapasionado y objetivo.
2. SERIE HISTÓRICA AMPLIA: Proporciona la serie temporal anual con el mayor recorrido posible (mínimo 10-15 años, idealmente desde 2010 o antes hasta el último dato publicado de 2024/2025). Evita recortes interesados de años.
3. DATOS PRECISOS Y FUENTE REAL: Utiliza datos reales de fuentes oficiales comprobables (INE, Banco de España, Ministerios, Eurostat, etc.).
4. MODELO CANÓNICO BILINGÜE: Todo texto visible debe incluir traducción "es" y "en".
5. FUENTES ESTANDARIZADAS: "sources" debe ser un array con al menos una fuente completa que incluya URL válida https://.

TEMA O PREGUNTA SOLICITADA:
"[Escribe aquí la pregunta o tema. Ejemplo: ¿Cómo ha evolucionado la deuda pública sobre el PIB en España?]"

CATEGORÍAS PERMITIDAS (Elige exactamente una):
- "housing"
- "economy-employment"
- "healthcare"
- "pensions-demography"

FORMATO DE VALOR:
- "number" | "percent" | "currency-eur" | "currency-mmeur"

FORMATO DE SALIDA:
Responde ÚNICAMENTE con un bloque de código JSON válido con la siguiente estructura exacta:

{
  "id": "slug-en-kebab-case-sin-acentos",
  "kind": "time-series",
  "category": "economy-employment",
  "chartStyle": "line",
  "question": {
    "es": "¿Pregunta clara, neutra y directa en español?",
    "en": "Clear, neutral and direct question in English?"
  },
  "unit": {
    "es": "% del PIB",
    "en": "% of GDP"
  },
  "valueFormat": "percent",
  "points": [
    { "period": "2010", "value": 60.1 },
    { "period": "2011", "value": 69.5 },
    { "period": "2012", "value": 86.3 }
  ],
  "contextNotes": {
    "es": [
      "Nota metodológica técnica 1 (qué mide exactamente el indicador).",
      "Nota metodológica técnica 2 (aclaraciones de ámbito o cambios de metodología si los hay)."
    ],
    "en": [
      "Technical methodological note 1 (exact measurement definition).",
      "Technical methodological note 2 (scope clarifications or methodological changes)."
    ]
  },
  "sources": [
    {
      "institution": {
        "es": "Nombre completo del organismo oficial emisor",
        "en": "Official issuing institution name"
      },
      "title": {
        "es": "Título de la publicación o tabla estadística",
        "en": "Publication or statistical table title"
      },
      "shortName": {
        "es": "Nombre abreviado",
        "en": "Short name"
      },
      "tableId": "ID-OPCIONAL",
      "period": "2010-2024",
      "lastUpdated": "2024-12-01",
      "url": "https://url-directa-a-la-fuente-oficial.gob.es/tabla"
    }
  ],
  "lastUpdated": "2024-12-01"
}
\`\`\`

---

## 🔍 Pasos para añadir la nueva tarjeta

1. **Crear archivo individual:** Guarda la respuesta JSON devuelta en un nuevo archivo dentro de \`content/indicators/<id>.json\` (por ejemplo, \`content/indicators/deuda-publica-pib.json\`).
2. **Ejecutar el compilador de datos:**
   \`\`\`bash
   npm run compile
   \`\`\`
   El compilador validará el esquema Zod, reconciliará las sumas matemáticas y reconstruirá \`generated/directory-index.json\` automáticamente.
`;

  fs.writeFileSync(PROMPT_TEMPLATE_PATH, templateContent);
  console.log(`[Compiler] Updated ${PROMPT_TEMPLATE_PATH} to match canonical runtime contract.`);
}

function run(): void {
  try {
    compileIndicators();
    compileGeoMap();
    updatePromptTemplate();
    console.log("[Compiler] All data compilation tasks finished successfully!");
  } catch (err) {
    console.error("[Compiler Error]", (err as Error).message);
    process.exit(1);
  }
}

if (process.argv[1] && process.argv[1].endsWith("compile-data.ts")) {
  run();
}
