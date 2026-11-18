// Spanish Number Formatter with automatic compact abbreviations (MM, M, mil)

export function formatSpanishCompact(val: number): string {
  if (val === undefined || val === null || isNaN(val)) return "0";
  const abs = Math.abs(val);

  if (abs >= 1_000_000_000) {
    return `${(val / 1_000_000_000).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MM`;
  }
  if (abs >= 1_000_000) {
    return `${(val / 1_000_000).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} M`;
  }
  if (abs >= 10_000) {
    return `${(val / 1_000).toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mil`;
  }
  if (abs >= 1_000) {
    return val.toLocaleString("es-ES");
  }
  return val.toLocaleString("es-ES");
}

export function formatSpanishExact(val: number): string {
  if (val === undefined || val === null || isNaN(val)) return "0";
  return Math.round(val).toLocaleString("es-ES");
}
