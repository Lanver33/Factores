export const REVENUE_COLOR = "#38BDF8";
export const EXPENDITURE_COLOR = "#818CF8";
export const SURPLUS_COLOR = "#10B981";
export const DEFICIT_COLOR = "#F43F5E";

export const DEFICIT_BRIDGE = "#F43F5E";
export const SURPLUS_BRIDGE = "#10B981";

export const TAXON_COLORS: Record<string, string> = {
  // Revenues (ESA 2010)
  D61: "#0EA5E9",
  D5: "#2563EB",
  D2: "#06B6D4",
  NON_TAX_RESIDUAL: "#64748B",
  D91: "#14B8A6",
  DEFICIT_BRIDGE: "#F43F5E",

  // Expenditures (COFOG 1999)
  GF10: "#6366F1",
  GF07: "#10B981",
  GF01: "#F59E0B",
  GF09: "#3B82F6",
  GF04: "#8B5CF6",
  GF03: "#EC4899",
  GF08: "#14B8A6",
  GF02: "#94A3B8",
  GF05: "#22C55E",
  GF06: "#FB923C",
  SURPLUS_BRIDGE: "#10B981",
};

export function getTaxonColor(code: string): string {
  if (TAXON_COLORS[code]) {
    return TAXON_COLORS[code];
  }
  // Deterministic fallback color based on code string
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = code.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 55%)`;
}
