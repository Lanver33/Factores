import rawData from "@/data/data.json";
import { Category, DatoItem } from "@/types";

const datos: DatoItem[] = rawData as DatoItem[];

export function getAllDatos(): DatoItem[] {
  return datos;
}

export function getDatoById(id: string): DatoItem | undefined {
  return datos.find((item) => item.id === id);
}

export function getDatosByCategory(category: Category): DatoItem[] {
  if (category === "Todas") return datos;
  return datos.filter((item) => item.category === category);
}

export function getAllCategories(): Category[] {
  return [
    "Todas",
    "Vivienda",
    "Economía y Empleo",
    "Sanidad",
    "Pensiones y Demografía",
  ];
}

export function searchDatos(query: string, category: Category = "Todas"): DatoItem[] {
  const normalizedQuery = query.toLowerCase().trim();
  let result = datos;

  if (category !== "Todas") {
    result = result.filter((item) => item.category === category);
  }

  if (!normalizedQuery) return result;

  return result.filter(
    (item) =>
      item.question.toLowerCase().includes(normalizedQuery) ||
      item.category.toLowerCase().includes(normalizedQuery) ||
      item.contextNotes.some((note) => note.toLowerCase().includes(normalizedQuery)) ||
      item.source.institution.toLowerCase().includes(normalizedQuery)
  );
}
