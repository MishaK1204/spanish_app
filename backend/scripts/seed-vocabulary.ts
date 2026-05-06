import 'reflect-metadata';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { Word } from '../src/vocabulary/word.entity';
import { WordCategory } from '../src/vocabulary/word-category.entity';

type JsonRow = { spanish?: unknown; english?: unknown };

const CHUNK = 400;

function defaultDataDir(): string {
  return join(__dirname, '..', '..', 'Categories and words');
}

async function main(): Promise<void> {
  const dataDir = process.env.VOCABULARY_DATA_DIR ?? defaultDataDir();

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const categoryRepo = app.get<Repository<WordCategory>>(
    getRepositoryToken(WordCategory),
  );
  const wordRepo = app.get<Repository<Word>>(getRepositoryToken(Word));

  let files: string[];
  try {
    files = (await readdir(dataDir)).filter((f) => f.endsWith('.json'));
  } catch (e) {
    console.error(
      `Cannot read vocabulary folder "${dataDir}". Set VOCABULARY_DATA_DIR or run from repo layout with "Categories and words".`,
    );
    throw e;
  }

  files.sort((a, b) => a.localeCompare(b));

  for (const file of files) {
    const name = file.replace(/\.json$/i, '');
    let category = await categoryRepo.findOne({ where: { name } });
    if (!category) {
      category = categoryRepo.create({ name });
      await categoryRepo.save(category);
    }

    const rawText = await readFile(join(dataDir, file), 'utf8');
    const parsed = JSON.parse(rawText) as unknown;
    if (!Array.isArray(parsed)) {
      console.warn(`Skip ${file}: root is not an array`);
      continue;
    }

    const rows: { spanish: string; english: string }[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== 'object') continue;
      const { spanish, english } = item as JsonRow;
      if (typeof spanish !== 'string' || typeof english !== 'string') continue;
      rows.push({ spanish, english });
    }

    await wordRepo.delete({ category: { id: category.id } });

    for (let i = 0; i < rows.length; i += CHUNK) {
      const slice = rows.slice(i, i + CHUNK);
      await wordRepo.insert(
        slice.map((r) => ({
          spanish: r.spanish,
          english: r.english,
          category: { id: category.id },
        })),
      );
    }

    console.log(`Seeded "${name}": ${rows.length} words`);
  }

  await app.close();
  console.log(`Done. Imported ${files.length} categories from ${dataDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
