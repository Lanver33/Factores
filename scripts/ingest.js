import fs from "node:fs";
import path from "node:path";

const STAGING_DIR = path.join(process.cwd(), "staging");
const ITEMS_STAGING_DIR = path.join(STAGING_DIR, "items");

fs.mkdirSync(ITEMS_STAGING_DIR, { recursive: true });

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

fs.writeFileSync(
  path.join(STAGING_DIR, "items.json"),
  JSON.stringify([], null, 2)
);

console.log("[Ingestion] Prepared clean staging environment for Factores Spain items.");
