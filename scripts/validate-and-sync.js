import fs from "node:fs";
import path from "node:path";

const STAGING_DIR = path.join(process.cwd(), "staging");
const DATA_DIR = path.join(process.cwd(), "data");
const PUBLIC_DATA_DIR = path.join(process.cwd(), "public", "data");

function ensureDirs() {
  fs.mkdirSync(path.join(STAGING_DIR, "items"), { recursive: true });
  fs.mkdirSync(path.join(DATA_DIR, "items"), { recursive: true });
  fs.mkdirSync(path.join(PUBLIC_DATA_DIR, "items"), { recursive: true });
}

function validateAndBuildIndex() {
  console.log("[Validation] Scanning ./staging/items directory...");
  ensureDirs();

  const itemsDir = path.join(STAGING_DIR, "items");
  const files = fs.existsSync(itemsDir)
    ? fs.readdirSync(itemsDir).filter((f) => f.endsWith(".json"))
    : [];

  const indexItems = [];

  for (const file of files) {
    const filePath = path.join(itemsDir, file);
    let item;
    try {
      item = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    } catch (e) {
      throw new Error(`Invalid JSON syntax in ${filePath}: ${e.message}`);
    }

    if (!item.id || !item.question || !item.category) {
      throw new Error(`Item in ${file} is missing required fields (id, question, category).`);
    }

    const points = item.dataPoints || (item.metrics && Object.values(item.metrics)[0]?.series);
    if (!Array.isArray(points) || points.length === 0) {
      throw new Error(`Item ${file} must have a non-empty dataPoints or series array.`);
    }

    for (const p of points) {
      const val = p.value;
      if (typeof val !== "number" || Number.isNaN(val) || !Number.isFinite(val)) {
        throw new Error(`Invalid or corrupted numeric value '${val}' in ${file} (NaN/null/Infinity).`);
      }
      const dateVal = p.year || p.date;
      if (!dateVal) {
        throw new Error(`Data point in ${file} missing year/date field.`);
      }
    }

    const lastPoint = points[points.length - 1];
    indexItems.push({
      id: item.id,
      category: item.category,
      question: item.question,
      unit: item.unit || "",
      latestValue: lastPoint.value,
      latestYear: lastPoint.year || lastPoint.date,
      lastUpdated: item.source?.lastUpdated || item.last_updated || new Date().toISOString().split("T")[0]
    });
  }

  // Write items index and metadata
  const metadata = {
    last_updated: new Date().toISOString().split("T")[0],
    total_items: indexItems.length,
    categories: ["Vivienda", "Economía y Empleo", "Sanidad", "Pensiones y Demografía"]
  };

  fs.writeFileSync(path.join(STAGING_DIR, "items.json"), JSON.stringify(indexItems, null, 2));
  fs.writeFileSync(path.join(STAGING_DIR, "metadata.json"), JSON.stringify(metadata, null, 2));

  console.log(`[Validation] Validated ${indexItems.length} items successfully.`);
}

function copyRecursive(src, dest) {
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }
  fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function sync() {
  console.log("[Sync] Syncing ./staging to ./data...");
  copyRecursive(STAGING_DIR, DATA_DIR);

  console.log("[Sync] Syncing ./data to ./public/data...");
  copyRecursive(DATA_DIR, PUBLIC_DATA_DIR);

  console.log("[Sync] Data sync complete!");
}

try {
  validateAndBuildIndex();
  sync();
} catch (err) {
  console.error("[Pipeline Error]", err.message);
  process.exit(1);
}
