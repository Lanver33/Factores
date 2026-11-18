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
