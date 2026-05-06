import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CATEGORIES_DIR = path.join(__dirname, "Categories and words");

type WordPair = {
  spanish: string;
  english: string;
};

function parseLine(line: string): WordPair | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const comma = trimmed.indexOf(",");
  if (comma === -1) {
    console.warn(`Skipping line (no comma): ${trimmed.slice(0, 80)}`);
    return null;
  }

  const english = trimmed.slice(0, comma).trim();
  const spanish = trimmed.slice(comma + 1).trim();

  return { spanish, english };
}

function txtToJsonObjects(content: string): WordPair[] {
  const lines = content.split(/\r?\n/);
  const out: WordPair[] = [];

  for (const line of lines) {
    const pair = parseLine(line);
    if (pair) out.push(pair);
  }

  return out;
}

function main(): void {
  if (!fs.existsSync(CATEGORIES_DIR)) {
    console.error(`Folder not found: ${CATEGORIES_DIR}`);
    process.exit(1);
  }

  const entries = fs.readdirSync(CATEGORIES_DIR, { withFileTypes: true });
  const txtFiles = entries.filter((e) => e.isFile() && e.name.endsWith(".txt"));

  if (txtFiles.length === 0) {
    console.warn(`No .txt files in ${CATEGORIES_DIR}`);
    return;
  }

  for (const file of txtFiles) {
    const txtPath = path.join(CATEGORIES_DIR, file.name);
    const baseName = path.basename(file.name, ".txt");
    const jsonPath = path.join(CATEGORIES_DIR, `${baseName}.json`);

    const content = fs.readFileSync(txtPath, "utf8");
    const data = txtToJsonObjects(content);
    const json = JSON.stringify(data, null, 4) + "\n";

    fs.writeFileSync(jsonPath, json, "utf8");
    console.log(`Wrote ${jsonPath} (${data.length} entries)`);
  }
}

main();
