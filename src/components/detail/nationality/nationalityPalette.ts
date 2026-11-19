/**
 * Tokens de color neutrales para la visualización de indicadores por nacionalidad.
 * Regla de neutralidad radical: Nunca asignar colores semánticos (verde/rojo) como "bueno/malo"
 * a ninguno de los grupos poblacionales.
 */

export const NATIONALS_COLOR = "#38BDF8"; // Sky Blue (Españoles / Nacidos en España)
export const FOREIGNERS_COLOR = "#F59E0B"; // Amber (Extranjeros / Nacidos en el extranjero)
export const EU_FOREIGNERS_COLOR = "#34D399"; // Emerald (Extranjeros UE-27)
export const NON_EU_FOREIGNERS_COLOR = "#FB923C"; // Orange (Extranjeros No-UE)
export const NATURALIZATIONS_COLOR = "#A78BFA"; // Violet (Adquisiciones de nacionalidad)
export const TOTAL_COLOR = "#94A3B8"; // Slate (Total nacional)

export const AGE_BAND_COLORS = {
  under15: "#38BDF8", // Sky Blue (<15 años)
  workingAge15to64: "#818CF8", // Indigo (15–64 años)
  senior65plus: "#C084FC", // Purple (65+ años)
} as const;

export function getGroupColor(groupKey: string): string {
  switch (groupKey) {
    case "nationals":
      return NATIONALS_COLOR;
    case "foreigners":
      return FOREIGNERS_COLOR;
    case "euForeigners":
      return EU_FOREIGNERS_COLOR;
    case "nonEuForeigners":
      return NON_EU_FOREIGNERS_COLOR;
    case "total":
      return TOTAL_COLOR;
    case "naturalizations":
      return NATURALIZATIONS_COLOR;
    default:
      return "#94A3B8";
  }
}
