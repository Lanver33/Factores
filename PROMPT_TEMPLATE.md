# Template para Generar Secciones de Datos con IA (Gemini)

Este documento contiene la plantilla que puedes copiar y enviar a Gemini (o cualquier LLM) junto con el tema o pregunta deseada para generar objetos JSON individuales e importarlos en `data/items/`.

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

TEMA O PREGUNTA SOLICITADA:
"[Escribe aquí la pregunta o tema. Ejemplo: ¿Cómo ha evolucionado la deuda pública sobre el PIB en España?]"

CATEGORÍAS PERMITIDAS (Elige exactamente una):
- "Vivienda"
- "Economía y Empleo"
- "Sanidad"
- "Pensiones y Demografía"

TIPO DE GRÁFICO PERMITIDO:
- "line" (para series temporales continuas)
- "bar" (para datos comparativos o de frecuencia)

FORMATO DE SALIDA:
Responde ÚNICAMENTE con un bloque de código JSON válido con la siguiente estructura exacta:

{
  "id": "slug-en-kebab-case-sin-acentos",
  "category": "Economía y Empleo",
  "question": "¿Pregunta clara, neutra y directa?",
  "chartType": "line",
  "unit": "% del PIB",
  "dataPoints": [
    { "year": "2010", "value": 60.1 },
    { "year": "2011", "value": 69.5 },
    { "year": "2012", "value": 86.3 }
  ],
  "contextNotes": [
    "Nota metodológica técnica 1 (qué mide exactamente el indicador).",
    "Nota metodológica técnica 2 (aclaraciones de ámbito o cambios de metodología si los hay).",
    "Nota metodológica técnica 3 (aclaración sobre qué incluye o excluye)."
  ],
  "source": {
    "institution": "Nombre completo del organismo oficial emisor",
    "lastUpdated": "AAAA-MM-DD",
    "url": "URL directa a la tabla, boletín o portal de datos oficial"
  }
}
```

---

## 🔍 Pasos para añadir la nueva tarjeta

1. **Crear archivo individual:** Guarda la respuesta JSON devuelta en un nuevo archivo dentro de `data/items/<id>.json` (por ejemplo, `data/items/deuda-publica-pib.json`).
2. **Registrar en `data/items/index.ts`:** Importa y añade la nueva variable al array `items` en `data/items/index.ts`.
3. **Checklist de verificación:**
   - Comprobar que el `id` es único.
   - La categoría coincide con una de las 4 permitidas.
   - Contrastar 2-3 puntos de la serie temporal con la fuente oficial.
   - Verificar que la URL oficial responde correctamente.
   - Comprobar que `contextNotes` sea 100% neutro sin sesgo ideológico.

