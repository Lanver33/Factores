import fs from "node:fs";
import path from "node:path";

const STAGING_DIR = path.join(process.cwd(), "staging");
const ITEMS_STAGING_DIR = path.join(STAGING_DIR, "items");
const DATA_ITEMS_DIR = path.join(process.cwd(), "data", "items");

fs.mkdirSync(ITEMS_STAGING_DIR, { recursive: true });

if (fs.existsSync(DATA_ITEMS_DIR)) {
  const files = fs.readdirSync(DATA_ITEMS_DIR).filter((f) => f.endsWith(".json"));
  for (const file of files) {
    fs.copyFileSync(
      path.join(DATA_ITEMS_DIR, file),
      path.join(ITEMS_STAGING_DIR, file)
    );
  }
}

const metadata = {
  last_updated: new Date().toISOString().split("T")[0],
  total_items: 0,
  categories: [
    "Vivienda",
    "Economía y Empleo",
    "Sanidad",
    "Pensiones y Demografía"
  ]
};

fs.writeFileSync(
  path.join(STAGING_DIR, "metadata.json"),
  JSON.stringify(metadata, null, 2)
);

console.log("[Ingestion] Prepared staging environment and synced existing items from ./data/items.");
