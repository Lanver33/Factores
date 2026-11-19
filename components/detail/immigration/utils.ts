export type { ImmigrationItem } from "@/types";

export type BlockDef = {
  id: string;
  name: string;
  color: string;
  countries: Array<{ id: string; name: string }>;
};

export interface CountryGeo {
  id: string;
  name: string;
  blockId: string;
  blockName: string;
  lng: number;
  lat: number;
}

export interface BlockConfig {
  id: string;
  name: string;
  color: string;
  bg: string;
  text: string;
  border: string;
}

export const BLOCKS_CONFIG: Record<string, BlockConfig> = {
  "america-hispanohablante": {
    id: "america-hispanohablante",
    name: "América (Hispanohablante)",
    color: "#2563EB",
    bg: "bg-blue-600/10",
    text: "text-blue-400",
    border: "border-blue-500/30",
  },
  "america-no-hispanohablante": {
    id: "america-no-hispanohablante",
    name: "América (No Hispanohablante)",
    color: "#7C3AED",
    bg: "bg-purple-600/10",
    text: "text-purple-400",
    border: "border-purple-500/30",
  },
  europa: {
    id: "europa",
    name: "Europa",
    color: "#0891B2",
    bg: "bg-cyan-600/10",
    text: "text-cyan-400",
    border: "border-cyan-500/30",
  },
  africa: {
    id: "africa",
    name: "África",
    color: "#059669",
    bg: "bg-emerald-600/10",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
  },
  asia: {
    id: "asia",
    name: "Asia",
    color: "#D97706",
    bg: "bg-amber-600/10",
    text: "text-amber-400",
    border: "border-amber-500/30",
  },
  oceania: {
    id: "oceania",
    name: "Oceanía",
    color: "#64748B",
    bg: "bg-slate-600/10",
    text: "text-slate-400",
    border: "border-slate-500/30",
  },
};

// Destination country (Spain centroid)
export const SPAIN_GEO = {
  name: "España (Destino)",
  lng: -3.7038,
  lat: 40.4168,
};

export const font_dest = SPAIN_GEO;

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
  bolivia: { id: "bolivia", name: "Bolivia", blockId: "america-hispanohablante", blockName: "América (Hispanohablante)", lng: -63.5887, lat: -16.2902 },
  chile: { id: "chile", name: "Chile", blockId: "america-hispanohablante", blockName: "América (Hispanohablante)", lng: -71.5430, lat: -35.6751 },
  mexico: { id: "mexico", name: "México", blockId: "america-hispanohablante", blockName: "América (Hispanohablante)", lng: -102.5528, lat: 23.6345 },
  nicaragua: { id: "nicaragua", name: "Nicaragua", blockId: "america-hispanohablante", blockName: "América (Hispanohablante)", lng: -85.2072, lat: 12.8654 },
  uruguay: { id: "uruguay", name: "Uruguay", blockId: "america-hispanohablante", blockName: "América (Hispanohablante)", lng: -55.7658, lat: -32.5228 },

  // América No Hispanohablante
  brasil: { id: "brasil", name: "Brasil", blockId: "america-no-hispanohablante", blockName: "América (No Hispanohablante)", lng: -47.9292, lat: -15.7801 },
  "estados-unidos": { id: "estados-unidos", name: "Estados Unidos", blockId: "america-no-hispanohablante", blockName: "América (No Hispanohablante)", lng: -77.0369, lat: 38.9072 },
  canada: { id: "canada", name: "Canadá", blockId: "america-no-hispanohablante", blockName: "América (No Hispanohablante)", lng: -75.6972, lat: 45.4215 },

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
  belgica: { id: "belgica", name: "Bélgica", blockId: "europa", blockName: "Europa", lng: 4.4699, lat: 50.5039 },
  dinamarca: { id: "dinamarca", name: "Dinamarca", blockId: "europa", blockName: "Europa", lng: 9.5018, lat: 56.2639 },
  finlandia: { id: "finlandia", name: "Finlandia", blockId: "europa", blockName: "Europa", lng: 25.7482, lat: 61.9241 },
  irlanda: { id: "irlanda", name: "Irlanda", blockId: "europa", blockName: "Europa", lng: -8.2439, lat: 53.4129 },
  lituania: { id: "lituania", name: "Lituania", blockId: "europa", blockName: "Europa", lng: 23.8813, lat: 55.1694 },
  moldavia: { id: "moldavia", name: "Moldavia", blockId: "europa", blockName: "Europa", lng: 28.3699, lat: 47.4116 },
  noruega: { id: "noruega", name: "Noruega", blockId: "europa", blockName: "Europa", lng: 8.4689, lat: 60.4720 },
  "paises-bajos": { id: "paises-bajos", name: "Países Bajos", blockId: "europa", blockName: "Europa", lng: 5.2913, lat: 52.1326 },
  polonia: { id: "polonia", name: "Polonia", blockId: "europa", blockName: "Europa", lng: 19.1451, lat: 51.9194 },
  suecia: { id: "suecia", name: "Suecia", blockId: "europa", blockName: "Europa", lng: 18.6435, lat: 60.1282 },
  suiza: { id: "suiza", name: "Suiza", blockId: "europa", blockName: "Europa", lng: 8.2275, lat: 46.8182 },

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
  mauritania: { id: "mauritania", name: "Mauritania", blockId: "africa", blockName: "África", lng: -10.9408, lat: 21.0079 },

  // Asia
  china: { id: "china", name: "China", blockId: "asia", blockName: "Asia", lng: 116.4074, lat: 39.9042 },
  pakistan: { id: "pakistan", name: "Pakistán", blockId: "asia", blockName: "Asia", lng: 73.0479, lat: 33.6844 },
  india: { id: "india", name: "India", blockId: "asia", blockName: "Asia", lng: 77.2090, lat: 28.6139 },
  filipinas: { id: "filipinas", name: "Filipinas", blockId: "asia", blockName: "Asia", lng: 120.9842, lat: 14.5995 },
  bangladesh: { id: "bangladesh", name: "Bangladesh", blockId: "asia", blockName: "Asia", lng: 90.4125, lat: 23.8103 },
};

export function getCountryColor(countryId: string, fallbackBlockColor: string): string {
  return fallbackBlockColor;
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
  return Math.round(val).toLocaleString("es-ES");
}
