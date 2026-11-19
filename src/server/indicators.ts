import fs from "node:fs";
import path from "node:path";
import {
  IndicatorSchema,
  type Indicator,
  type DirectoryIndexItem,
} from "@/domain/indicator.schema";

const CONTENT_DIR = path.join(process.cwd(), "content", "indicators");
const GENERATED_INDEX_PATH = path.join(process.cwd(), "generated", "directory-index.json");

/**
 * Server-only repository layer for indicators.
 */
export async function getDirectoryIndex(): Promise<DirectoryIndexItem[]> {
  try {
    if (fs.existsSync(GENERATED_INDEX_PATH)) {
      const content = fs.readFileSync(GENERATED_INDEX_PATH, "utf-8");
      return JSON.parse(content) as DirectoryIndexItem[];
    }
  } catch (err) {
    console.error("[getDirectoryIndex] Error reading directory index:", err);
  }

  return [];
}

export async function getIndicatorBySlug(slug: string): Promise<Indicator | null> {
  if (!slug || slug === "_none" || !/^[a-z0-9-]+$/.test(slug)) {
    return null;
  }

  try {
    const filePath = path.join(CONTENT_DIR, `${slug}.json`);
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const json = JSON.parse(content);
    const result = IndicatorSchema.safeParse(json);
    if (!result.success) {
      console.error(`[getIndicatorBySlug] Invalid schema for indicator ${slug}:`, result.error);
      return null;
    }

    return result.data;
  } catch (err) {
    console.error(`[getIndicatorBySlug] Failed to load indicator ${slug}:`, err);
    return null;
  }
}

export async function getAllIndicatorSlugs(): Promise<string[]> {
  try {
    if (fs.existsSync(CONTENT_DIR)) {
      const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".json"));
      return files.map((f) => f.replace(/\.json$/, ""));
    }
  } catch (err) {
    console.error("[getAllIndicatorSlugs] Error listing indicator files:", err);
  }
  return [];
}
