import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = process.cwd();
const OUTPUT_FILE = path.join(ROOT_DIR, "repo-bundle.txt");

const IGNORE_DIRS = ["node_modules", ".next", "out", ".git", "public", "staging", ".venv", ".opencode"];
const IGNORE_FILES = [
  "all-typescript-code.ts",
  "repo-bundle.txt",
  "package-lock.json",
  "uv.lock",
  "countriesGeo.json",
  "landGeo.json",
  "world-natural-earth.raw.json",
  "projected-world.json"
];

const ALLOWED_EXTENSIONS = [".ts", ".tsx", ".js", ".py", ".css", ".json", ".md", ".toml", ".mjs"];

function shouldIgnore(relPath, fileName) {
  const normalized = relPath.split(path.sep).join("/");
  if (normalized.startsWith("public/") || normalized.startsWith("staging/")) return true;
  if (normalized.startsWith("data/es/")) return true; // duplicate mirror of data/
  if (normalized.includes("countriesGeo.json") || normalized.includes("landGeo.json")) return true;
  if (IGNORE_FILES.includes(fileName)) return true;
  return false;
}

function walkDir(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORE_DIRS.includes(entry.name)) continue;
    const res = path.join(dir, entry.name);
    const relPath = path.relative(ROOT_DIR, res);
    if (shouldIgnore(relPath, entry.name)) continue;

    if (entry.isDirectory()) {
      walkDir(res, fileList);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (ALLOWED_EXTENSIONS.includes(ext) || ["package.json", "tsconfig.json", "pyproject.toml"].includes(entry.name)) {
        fileList.push(res);
      }
    }
  }
  return fileList;
}

function bundleRepo() {
  const files = walkDir(ROOT_DIR);
  let output = `/**\n * FACTORES REPOSITORY SOURCE CODE BUNDLE\n * Generated on: ${new Date().toISOString()}\n */\n\n`;

  for (const file of files) {
    const relPath = path.relative(ROOT_DIR, file);
    const content = fs.readFileSync(file, "utf-8");
    output += `// ==========================================\n`;
    output += `// FILE: ${relPath}\n`;
    output += `// ==========================================\n\n`;
    output += content;
    output += `\n\n`;
  }

  fs.writeFileSync(OUTPUT_FILE, output, "utf-8");
  console.log(`[Bundle] Successfully bundled ${files.length} repository source files into ${OUTPUT_FILE}`);
}

bundleRepo();
