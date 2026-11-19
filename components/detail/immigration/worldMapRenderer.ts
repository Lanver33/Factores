import countriesData from "./countriesGeo.json";

export function projectCoordinates(
  lng: number,
  lat: number,
  width: number,
  height: number,
  zoom = 1,
  panX = 0,
  panY = 0
): { x: number; y: number } {
  const minLng = -180;
  const maxLng = 180;
  const minLat = -60;
  const maxLat = 80;

  const mapSpanLng = maxLng - minLng;
  const mapSpanLat = maxLat - minLat;

  const xNorm = (lng - minLng) / mapSpanLng;
  const yNorm = (maxLat - lat) / mapSpanLat;

  const baseScale = Math.min(width, height) * 1.55 * zoom;
  const offsetX = (width - baseScale) / 2 + panX;
  const offsetY = (height - baseScale * 0.55) / 2 + panY;

  const x = xNorm * baseScale + offsetX;
  const y = yNorm * (baseScale * 0.55) + offsetY;

  return { x, y };
}

const COUNTRY_NAME_MAPPING: Record<string, string[]> = {
  colombia: ["Colombia"],
  venezuela: ["Venezuela"],
  peru: ["Peru", "Perú"],
  argentina: ["Argentina"],
  honduras: ["Honduras"],
  ecuador: ["Ecuador"],
  cuba: ["Cuba"],
  paraguay: ["Paraguay"],
  "republica-dominicana": ["Dominican Rep.", "Dominican Republic", "República Dominicana"],
  "rep-dominicana": ["Dominican Rep.", "Dominican Republic", "República Dominicana"],
  bolivia: ["Bolivia"],
  chile: ["Chile"],
  mexico: ["Mexico", "México"],
  nicaragua: ["Nicaragua"],
  uruguay: ["Uruguay"],
  brasil: ["Brazil", "Brasil"],
  "estados-unidos-de-america": ["United States of America", "United States", "US"],
  "estados-unidos": ["United States of America", "United States", "US"],
  canada: ["Canada", "Canadá"],
  alemania: ["Germany", "Alemania"],
  rumania: ["Romania", "Rumanía"],
  "reino-unido": ["United Kingdom"],
  italia: ["Italy", "Italia"],
  ucrania: ["Ukraine", "Ucrania"],
  francia: ["France", "Francia"],
  rusia: ["Russia", "Rusia"],
  portugal: ["Portugal"],
  bulgaria: ["Bulgaria"],
  belgica: ["Belgium", "Bélgica"],
  dinamarca: ["Denmark", "Dinamarca"],
  finlandia: ["Finland", "Finlandia"],
  irlanda: ["Ireland", "Irlanda"],
  lituania: ["Lithuania", "Lituania"],
  moldavia: ["Moldova", "Moldavia"],
  noruega: ["Norway", "Noruega"],
  "paises-bajos": ["Netherlands", "Países Bajos"],
  polonia: ["Poland", "Polonia"],
  suecia: ["Sweden", "Suecia"],
  suiza: ["Switzerland", "Suiza"],
  marruecos: ["Morocco", "Marruecos"],
  argelia: ["Algeria", "Argelia"],
  senegal: ["Senegal"],
  mali: ["Mali"],
  nigeria: ["Nigeria"],
  gambia: ["Gambia"],
  "guinea-ecuatorial": ["Eq. Guinea", "Equatorial Guinea", "Guinea Ecuatorial"],
  ghana: ["Ghana"],
  guinea: ["Guinea"],
  mauritania: ["Mauritania"],
  china: ["China"],
  pakistan: ["Pakistan", "Pakistán"],
  india: ["India"],
  filipinas: ["Philippines", "Filipinas"],
  bangladesh: ["Bangladesh"],
};

export function getChoroplethCountryPolygons(
  width: number,
  height: number,
  zoom: number,
  panX: number,
  panY: number
): Array<{ featureId: string; countryId: string | null; name: string; pathD: string }> {
  const result: Array<{ featureId: string; countryId: string | null; name: string; pathD: string }> = [];
  const features = (countriesData as any).features || [];

  features.forEach((feature: any, fIdx: number) => {
    const props = feature.properties || {};
    const name = props.NAME || props.ADMIN || `Country_${fIdx}`;

    let matchedCountryId: string | null = null;
    if (name === "Spain" || name === "España") {
      matchedCountryId = "spain";
    } else {
      for (const [cId, namesList] of Object.entries(COUNTRY_NAME_MAPPING)) {
        if (namesList.includes(name) || namesList.includes(props.NAME_LONG)) {
          matchedCountryId = cId;
          break;
        }
      }
    }

    const geom = feature.geometry;
    if (!geom) return;

    const polygons: Array<Array<[number, number]>> = [];
    if (geom.type === "Polygon") {
      if (geom.coordinates && geom.coordinates[0]) {
        polygons.push(geom.coordinates[0]);
      }
    } else if (geom.type === "MultiPolygon") {
      geom.coordinates.forEach((polyCoords: Array<Array<[number, number]>>) => {
        if (polyCoords && polyCoords[0]) {
          polygons.push(polyCoords[0]);
        }
      });
    }

    polygons.forEach((ring, ringIdx) => {
      const coords: string[] = [];
      ring.forEach(([lng, lat]: [number, number], index: number) => {
        const pt = projectCoordinates(lng, lat, width, height, zoom, panX, panY);
        const cmd = index === 0 ? "M" : "L";
        coords.push(`${cmd} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`);
      });

      if (coords.length > 2) {
        result.push({
          featureId: `${fIdx}_${ringIdx}`,
          countryId: matchedCountryId,
          name,
          pathD: `${coords.join(" ")} Z`,
        });
      }
    });
  });

  return result;
}
