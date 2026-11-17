# Diseño del Sistema y Especificación Técnica: Datos España

> **Propósito de este documento:** Servir como fuente única de verdad (*Single Source of Truth*) para cualquier agente de código o desarrollador que trabaje en este repositorio. Define la visión del producto, la arquitectura de datos sin base de datos, el motor de gráficos comparativos estilo Google Trends y las reglas estrictas de implementación.

---

## 1. Visión del Producto
**Datos España** es una plataforma web interactiva, minimalista y radicalmente neutral que funciona como un **"Google Trends de datos oficiales de España"**. 

Su objetivo es reducir la asimetría de información en debates públicos, mediáticos y políticos permitiendo a cualquier ciudadano buscar, cruzar y comparar series temporales históricas de fuentes oficiales (INE, SEPE, BOE, Banco de España, CIS, Idealista, etc.) en un mismo gráfico, con total trazabilidad hacia la fuente original.

### Principios Innegociables
1. **Neutralidad Radical:** Cero adjetivos valorativos en la interfaz o en las notas metodológicas. Se muestran datos oficiales y definiciones técnicas; el usuario saca sus propias conclusiones.
2. **Alcance Puramente Nacional:** Todas las métricas corresponden al agregado nacional de España (sin desglose por provincias ni municipios) para garantizar simplicidad, velocidad y consistencia entre series.
3. **Cero Mantenimiento en Producción (Static-First):** No existe base de datos ni backend dinámico en producción. Todo el sistema se alimenta de archivos JSON estáticos alojados en `./data`.
4. **Trazabilidad Total:** Cada serie dibujada en pantalla debe mostrar explícitamente su organismo emisor, fecha de última actualización, enlace directo a la fuente oficial y notas metodológicas.

---

## 2. Arquitectura de Datos y Pipeline de Ingesta

El sistema divide completamente la **ingesta de datos** (ejecutada en local por el creador una vez al mes) de la **capa de visualización** (web estática ultrarrápida).

```text
[ Fuentes Oficiales (INE, SEPE, BOE, Banco de España, Idealista) ]
                              │
                              ▼ (Ejecución manual 1x / mes en local)
               [ Scraper Python + Validación ]
                              │
                              ▼ (Escribe en ./staging y valida integridad)
                [ Carpeta ./data (JSON Estáticos) ]
                              │
                              ▼ (HTTP fetch dinámico vía DATA_BASE_URL)
           [ Frontend Web + Motor de Gráficos Comparativos ]
```

### Reglas del Pipeline Local (`./staging` -> `./data`)
1. **Aislamiento en Staging:** El scraper nunca escribe directamente en `./data`. Genera los archivos en `./staging`.
2. **Validación Obligatoria:** Antes de mover a `./data`, un script verifica que:
   - Todos los JSON parsean sin errores.
   - No existen valores `NaN`, `Infinity` ni fechas mal formateadas (formato estricto `YYYY-MM`).
   - Ninguna serie está vacía.
3. **Carga Dinámica vía HTTP (No Bundling):** El frontend **NUNCA** debe importar los JSON de `./data` mediante `import` estático en tiempo de compilación. Siempre debe obtenerlos mediante `fetch()` usando una variable de entorno configurable `NEXT_PUBLIC_DATA_BASE_URL` (o `VITE_DATA_BASE_URL`, con valor por defecto `/data`). Esto permite actualizar `./data` sin recompilar la web y migrar `./data` a un bucket (Cloudflare R2 / AWS S3) en el futuro cambiando solo una URL.

---

## 3. Estructura de `./data` y Contratos JSON

La carpeta `./data` está organizada por **métricas individuales** para que el frontend descargue únicamente los archivos JSON de las series que el usuario decida cruzar en ese momento.

```text
./data/
├── catalog.json             # Índice ligero para el buscador y filtros por categoría
└── metrics/
    ├── smi.json             # Salario Mínimo Interprofesional (BOE)
    ├── ipc.json             # Índice de Precios de Consumo (INE)
    ├── alquiler-m2.json     # Precio medio del alquiler €/m² (Idealista)
    ├── paro-registrado.json # Paro registrado mensual (SEPE)
    └── ...                  # Cualquier nueva métrica mensual
```

### Contrato 1: `./data/catalog.json`
Archivo ligero que se carga al iniciar la app para alimentar el buscador estilo Google Trends.
```json
{
  "last_updated": "2026-11-01",
  "categories": ["Economía", "Empleo", "Vivienda", "Demografía", "Sanidad", "Pensiones"],
  "metrics": [
    {
      "id": "smi",
      "name": "Salario Mínimo Interprofesional (SMI)",
      "shortName": "SMI",
      "category": "Empleo",
      "unit": "€/mes",
      "minDate": "2010-01",
      "maxDate": "2026-10",
      "institution": "BOE"
    },
    {
      "id": "ipc",
      "name": "Índice de Precios de Consumo (IPC)",
      "shortName": "IPC",
      "category": "Economía",
      "unit": "Índice",
      "minDate": "2010-01",
      "maxDate": "2026-10",
      "institution": "INE"
    }
  ]
}
```

### Contrato 2: `./data/metrics/{metric_id}.json`
Archivo individual por cada indicador nacional. Contiene la serie mensual completa y su trazabilidad.
```json
{
  "id": "alquiler-m2",
  "name": "Precio medio del alquiler",
  "shortName": "Alquiler (€/m²)",
  "category": "Vivienda",
  "unit": "€/m²",
  "frequency": "monthly",
  "last_updated": "2026-11-01",
  "source": {
    "institution": "Idealista (Informe de precios)",
    "url": "https://www.idealista.com/sala-de-prensa/informes-precio-vivienda/alquiler/"
  },
  "notes": [
    "Precio medio de oferta en anuncios publicados en el portal, no refleja contratos vigentes.",
    "Datos agregados a nivel nacional (España)."
  ],
  "series": [
    { "date": "2018-06", "value": 10.6 },
    { "date": "2018-07", "value": 10.7 },
    { "date": "2026-10", "value": 13.4 }
  ]
}
```

---

## 4. Experiencia de Usuario (UX) y Funcionalidades Core

La interfaz sigue el modelo mental de **Google Trends** combinado con la estética editorial de **Our World in Data**.

### 4.1. Barra de Exploración y Cruce de Métricas (Header Interactivo)
- **Selector Multi-Métrica:** El usuario puede añadir entre **1 y 4 métricas simultáneas** en el lienzo.
- **Chips de Series Activas:** Cada métrica seleccionada se muestra como una tarjeta/chip superior con su nombre corto, unidad, organismo fuente, un punto de color identificativo (ej. `#1E40AF`, `#DC2626`, `#059669`, `#D97706`) y un botón `×` para quitarla.
- **Botón `+ Añadir métrica para comparar`:** Abre un buscador instantáneo con autocompletado y pestañas de filtro por categoría (`Economía`, `Empleo`, `Vivienda`, etc.) alimentado por `catalog.json`.
- **Presets / Comparativas Sugeridas (Estado Inicial):** Al entrar por primera vez sin parámetros en la URL, se carga por defecto una comparativa relevante (ej. `SMI` vs `IPC` vs `Alquiler`) para demostrar el funcionamiento inmediato de la herramienta.

### 4.2. Motor de Gráficos Comparativos (El Núcleo del Producto)
El componente de gráfico debe resolver matemáticamente la comparación de variables con distintas escalas y frecuencias:

1. **Alineación Temporal:**
   - Unificar el eje X (`YYYY-MM`) tomando la unión de fechas de las series activas dentro del rango seleccionado.
   - Si una serie tiene datos anuales o trimestrales puntualizados en meses (ej. el SMI que cambia en enero de cada año), debe soportar renderizado tipo escalón (`stepAfter`) o interpolación limpia sin romper la línea.
2. **Modos de Escala (Toggle Obligatorio):**
   - **Modo Índice Base 100 (Activado automáticamente cuando hay 2 o más métricas):**
     - Toma el primer punto de datos válido dentro del rango temporal visible para cada serie como valor base $V_0$, y transforma cada punto posterior $V_t$ mediante:
       $$\text{Índice}_t = \left(\frac{V_t}{V_0}\right) \times 100$$
     - Permite comparar visualmente variaciones relativas (ej. *+60,9% vs +22,6%*) sin distorsiones de escala.
     - El tooltip al pasar el cursor debe mostrar **tanto el índice Base 100 como el valor real original con su unidad** (ej. `160,9 pts (1.184 €/mes)`).
   - **Modo Valores Reales:**
     - Activado por defecto cuando solo hay 1 métrica seleccionada.
     - Si hay 2 métricas con unidades distintas (ej. `€/mes` y `%`), habilita un **Doble Eje Y** (izquierda y derecha). Si hay más de 2 unidades distintas, sugiere volver a Base 100.
3. **Controles Temporales:**
   - Botones rápidos de ventana temporal: `1A`, `3A`, `5A`, `10A`, `Todo`, además de selectores `Desde` / `Hasta` (`YYYY-MM`).
   - Al cambiar el rango temporal en **Modo Base 100**, el punto `100` se recalcula dinámicamente al inicio del nuevo rango seleccionado.
4. **Sincronización con URL (Deep Linking):**
   - El estado de la comparativa (métricas activas, rango de fechas y modo de escala) debe reflejarse en los query params de la URL (ej. `?m=smi,ipc,alquiler-m2&from=2018-01&mode=base100`) para que cualquier usuario pueda copiar la URL del navegador y compartir exactamente el mismo cruce de datos.

### 4.3. Panel de Trazabilidad y Fuentes (Debajo del Gráfico)
Por cada métrica activa en el gráfico, se renderiza una tarjeta informativa limpia con:
- Nombre completo de la métrica y código de color asociado en el gráfico.
- Variación acumulada en el periodo seleccionado (ej. `+45,2%` entre `2018-06` y `2026-10`).
- **Notas metodológicas** (`notes` del JSON) en formato lista neutra.
- **Enlace directo a la fuente oficial** (`institution` + botón externo hacia `source.url`) y fecha de última actualización (`last_updated`).

---

## 5. Stack Técnico y Estética Visual

### Stack Recomendado
- **Framework:** Next.js (App Router) o React + Vite (TypeScript estricto).
- **Estilos:** Tailwind CSS.
- **Gráficos:** **Apache ECharts** (`echarts` / `echarts-for-react`) o **Recharts**, priorizando precisión en tooltips multi-serie, doble eje Y y renderizado fluido en móvil y escritorio.
- **Estado en URL:** Gestión limpia de `URLSearchParams` sin recargar la página.

### Guía Visual
- **Paleta:**
  - Fondo principal: `#F8FAFC` (Slate 50)
  - Tarjetas y contenedores: `#FFFFFF` con borde sutil `#E2E8F0` (Slate 200)
  - Texto primario: `#0F172A` (Slate 900)
  - Texto secundario / metadatos: `#475569` (Slate 600)
  - Paleta de series (alto contraste y accesible para daltonismo):
    1. Azul institucional: `#1E40AF`
    2. Rojo terracota: `#DC2626`
    3. Verde esmeralda: `#047857`
    4. Ámbar oscuro: `#B45309`
- **Tipografía:** Sans-serif limpia (`Inter` o `Plus Jakarta Sans`) con números tabulares (`font-variant-numeric: tabular-nums`) obligatorios en ejes, tablas y tooltips para que las cifras no bailen al mover el cursor.

---

## 6. Reglas de Ejecución para el Agente de Código

1. **Planificación antes de codificar:** Ante cualquier tarea nueva, presenta primero un breve plan técnico (archivos a crear/modificar y decisiones clave) antes de escribir código.
2. **Prohibido hardcodear datos en componentes:** Ningún componente UI debe contener datos estadísticos fijos. Todo debe fluir desde `./data/catalog.json` y `./data/metrics/{id}.json` mediante `fetch()`.
3. **Incluye datos semilla realistas:** Al inicializar el proyecto, crea un `catalog.json` y al menos 3 archivos en `./data/metrics/` (`smi.json`, `ipc.json`, `alquiler-m2.json`) con series reales de España (2018–2026) para verificar inmediatamente el funcionamiento del modo Base 100.
4. **Resiliencia ante datos incompletos:** Si una métrica seleccionada empieza más tarde que otra en el rango elegido (ej. una empieza en `2018-06` y otra en `2018-01`), el cálculo de Base 100 y el gráfico deben manejar los valores `null` iniciales sin romper la ejecución ni mostrar `NaN`.