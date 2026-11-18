import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = process.cwd();
const OUTPUT_FILE = path.join(ROOT_DIR, "all-typescript-code.ts");

const IGNORE_DIRS = ["node_modules", ".next", "out", "public", ".git"];

function walkDir(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORE_DIRS.includes(entry.name)) continue;
    const res = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(res, fileList);
    } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) {
      fileList.push(res);
    }
  }
  return fileList;
}

function dumpTsCode() {
  const files = walkDir(ROOT_DIR);
  let output = `/**\n * CONSOLIDATED TYPESCRIPT & TSX CODE DUMP\n * Generated on: ${new Date().toISOString()}\n */\n\n`;

  for (const file of files) {
    const relPath = path.relative(ROOT_DIR, file);
    if (relPath === "all-typescript-code.ts") continue;
    const content = fs.readFileSync(file, "utf-8");
    output += `// ==========================================\n`;
    output += `// FILE: ${relPath}\n`;
    output += `// ==========================================\n\n`;
    output += content;
    output += `\n\n`;
  }

  fs.writeFileSync(OUTPUT_FILE, output, "utf-8");
  console.log(`[Dump] Successfully dumped ${files.length} TypeScript files into ${OUTPUT_FILE}`);
}

dumpTsCode();
