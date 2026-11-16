# PRD: Plataforma de Datos Oficiales de España (MVP)

## 1. Visión y Objetivo del Producto
Construir una aplicación web minimalista, neutral y *mobile-first* que permita a cualquier ciudadano consultar datos oficiales de España (INE, CIS, Banco de España, Ministerios) de forma rápida durante debates televisivos o discusiones en redes sociales.
- **Propuesta de valor:** Eliminar la asimetría de información ofreciendo gráficos limpios con series históricas completas, contexto técnico sin sesgo ideológico y enlace directo a la fuente oficial, listos para compartir en dos clics.
- **Objetivo del proyecto:** Sin ánimo de lucro, enfocado en la transparencia política y cívica.

## 2. Principios de Diseño y Neutralidad
1. **Neutralidad radical:** Cero adjetivos valorativos en los textos. Todo dato debe mostrar una serie histórica amplia (ej. 10-20 años) para evitar recortes interesados.
2. **Mobile-First extremo:** Diseñado para usarse con una mano en el móvil. Carga instantánea y tipografía altamente legible.
3. **Mantenimiento cero / Estático:** Sin base de datos ni backend complejo. Todos los datos residen en un archivo local (`data.json`) que el creador actualizará manualmente.
4. **Orientado a compartir:** Cada tarjeta de dato debe incluir un botón prominente para compartir el enlace directo o descargar/copiar la vista para WhatsApp y X (Twitter).

## 3. Arquitectura de Información y Pantallas

### Pantalla 1: Home (Explorador por Temas)
- **Cabecera:** Nombre provisional (*DatoOficial* o *SinRelato*), subtítulo explicativo en una línea y un enlace discreto a "Metodología y Fuentes".
- **Navegación por Temas:** Tarjetas o botones grandes para filtrar por categorías principales:
  - Vivienda
  - Economía y Empleo
  - Sanidad
  - Pensiones y Demografía
- **Lista de Preguntas Frecuentes (FAQ):** Al seleccionar un tema (o en la vista general), se muestran las preguntas concretas (ej. *"¿Cómo ha evolucionado el precio del alquiler frente a los salarios?"*).

### Pantalla 2: Tarjeta de Dato (Vista de Detalle)
Al pulsar una pregunta, se abre una vista limpia (o ruta única `/dato/[slug]`) con estos 5 elementos en estricto orden vertical:
1. **La Pregunta (H1):** Clara y directa.
2. **El Gráfico Interactivo:** Serie histórica limpia (línea o barras según el dato), interactivo al pasar el dedo/ratón para ver el valor exacto por año.
3. **Contexto Técnico (2-3 viñetas):** Notas metodológicas neutras (ej. *"Datos ajustados a inflación"*, *"Incluye contratos indefinidos y fijos discontinuos"*).
4. **Acciones de Compartir:** Botón primario *"Compartir en WhatsApp / X"* (usando la Web Share API nativa en móvil y copiar enlace en escritorio).
5. **Trazabilidad (Caja de Fuente Oficial):**
   - Organismo emisor (ej. Instituto Nacional de Estadística - INE).
   - Fecha de última actualización.
   - Botón/enlace directo a la tabla o PDF original.

## 4. Estructura de Datos (`data.json`)
La aplicación debe alimentarse exclusivamente de un esquema JSON similar a este para facilitar su edición manual:

```json
[
  {
    "id": "evolucion-paro-juvenil",
    "category": "Economía y Empleo",
    "question": "¿Cuál es la tasa de paro juvenil en España?",
    "chartType": "line",
    "unit": "%",
    "dataPoints": [
      { "year": "2018", "value": 34.3 },
      { "year": "2019", "value": 32.5 },
      { "year": "2020", "value": 38.3 },
      { "year": "2021", "value": 34.8 },
      { "year": "2022", "value": 29.8 },
      { "year": "2023", "value": 28.4 }
    ],
    "contextNotes": [
      "Porcentaje de desempleados menores de 25 años respecto a la población activa de ese grupo.",
      "Media anual según la Encuesta de Población Activa (EPA)."
    ],
    "source": {
      "institution": "INE (Encuesta de Población Activa)",
      "lastUpdated": "2024-02-15",
      "url": "[https://www.ine.es/](https://www.ine.es/)"
    }
  }
]
