# Template para Generar Secciones de Datos con IA (Gemini)

Este documento contiene la plantilla para generar objetos JSON válidos bajo el nuevo modelo canónico (`IndicatorSchema`) e importarlos en `content/indicators/`.

---

## 📋 Prompt para Gemini

Copia y pega el siguiente texto en Gemini, sustituyendo la línea del tema por la pregunta o tema que quieras investigar:

```text
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
```

---

## 🔍 Pasos para añadir la nueva tarjeta

1. **Crear archivo individual:** Guarda la respuesta JSON devuelta en un nuevo archivo dentro de `content/indicators/<id>.json` (por ejemplo, `content/indicators/deuda-publica-pib.json`).
2. **Ejecutar el compilador de datos:**
   ```bash
   npm run compile
   ```
   El compilador validará el esquema Zod, reconciliará las sumas matemáticas y reconstruirá `generated/directory-index.json` automáticamente.
