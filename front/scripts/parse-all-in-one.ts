import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

type WordPair = {
  spanish: string;
  english: string;
};

function parseLine(line: string): WordPair | null {
  const trimmed = line.replace(/^\uFEFF/, "").trim(); // strip BOM, whitespace
  if (!trimmed) return null;

  const commaIdx = trimmed.indexOf(",");
  if (commaIdx === -1) return null;

  const english = trimmed.slice(0, commaIdx).trim();
  const spanish = trimmed.slice(commaIdx + 1).trim();

  if (!english || !spanish) return null;
  return { spanish, english };
}

async function main() {
  const inputArg = process.argv[2] ?? "../All in one.txt";
  const outputArg = process.argv[3] ?? "all-in-one.words.json";

  const inputPath = resolve(process.cwd(), inputArg);
  const outputPath = resolve(process.cwd(), outputArg);

  const raw = await readFile(inputPath, "utf8");
  const lines = raw.split(/\r?\n/);

  const words: WordPair[] = [];
  const skipped: { lineNumber: number; line: string }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const parsed = parseLine(lines[i] ?? "");
    if (parsed) words.push(parsed);
    else if ((lines[i] ?? "").trim().length > 0) {
      skipped.push({ lineNumber: i + 1, line: lines[i] ?? "" });
    }
  }

  await writeFile(outputPath, JSON.stringify(words, null, 2) + "\n", "utf8");

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        input: inputPath,
        output: outputPath,
        parsed: words.length,
        skipped: skipped.length,
        skippedExamples: skipped.slice(0, 5),
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});

