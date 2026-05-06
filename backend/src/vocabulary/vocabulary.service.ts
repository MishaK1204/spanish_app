import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LearnedWord } from './learned-word.entity';
import { Word } from './word.entity';
import { WordCategory } from './word-category.entity';

/** Stored on `LearnedWord.clientKey` — one bucket per authenticated user. */
export function learnedScopeForUser(user: { id: number }): string {
  return `user:${user.id}`;
}

export type CategorySummary = {
  id: number;
  name: string;
  wordCount: number;
};

export type LearnedWordSummary = {
  id: number;
  spanish: string;
  english: string;
  categoryId: number;
  categoryName: string;
};

export type VocabularySearchHit = {
  id: number;
  spanish: string;
  english: string;
  categoryId: number;
  categoryName: string;
};

@Injectable()
export class VocabularyService {
  constructor(
    @InjectRepository(WordCategory)
    private readonly categories: Repository<WordCategory>,
    @InjectRepository(Word)
    private readonly words: Repository<Word>,
    @InjectRepository(LearnedWord)
    private readonly learned: Repository<LearnedWord>,
  ) {}

  async listCategories(): Promise<CategorySummary[]> {
    const rows = await this.categories
      .createQueryBuilder('c')
      .loadRelationCountAndMap('c.wordCount', 'c.words')
      .orderBy('c.name', 'ASC')
      .getMany();

    return rows.map((c) => ({
      id: c.id,
      name: c.name,
      wordCount: (c as WordCategory & { wordCount: number }).wordCount,
    }));
  }

  async listWords(
    categoryId: number,
    limit: number,
    offset: number,
  ): Promise<{ items: Word[]; total: number }> {
    const category = await this.categories.findOne({ where: { id: categoryId } });
    if (!category) {
      throw new NotFoundException(`Category ${categoryId} not found`);
    }

    const [items, total] = await this.words.findAndCount({
      select: ['id', 'spanish', 'english'],
      where: { category: { id: categoryId } },
      order: { spanish: 'ASC' },
      take: limit,
      skip: offset,
    });

    return { items, total };
  }

  /**
   * Case-insensitive substring match on Spanish and English.
   * If `categoryId` is set, results are limited to that category.
   */
  async searchWords(
    q: string,
    limit: number,
    categoryId?: number,
  ): Promise<{ items: VocabularySearchHit[] }> {
    const term = q.trim().toLowerCase();
    if (!term) {
      return { items: [] };
    }

    if (categoryId != null) {
      const category = await this.categories.findOne({ where: { id: categoryId } });
      if (!category) {
        throw new NotFoundException(`Category ${categoryId} not found`);
      }
    }

    let qb = this.words
      .createQueryBuilder('w')
      .innerJoinAndSelect('w.category', 'cat')
      .where(
        '(POSITION(:needle IN LOWER(w.spanish)) > 0 OR POSITION(:needle IN LOWER(w.english)) > 0)',
        { needle: term },
      );

    if (categoryId != null) {
      qb = qb.andWhere('cat.id = :categoryId', { categoryId });
    }

    const rows = await qb
      .orderBy('cat.name', 'ASC')
      .addOrderBy('w.spanish', 'ASC')
      .take(limit)
      .getMany();

    return {
      items: rows.map((w) => ({
        id: w.id,
        spanish: w.spanish,
        english: w.english,
        categoryId: w.category.id,
        categoryName: w.category.name,
      })),
    };
  }

  async searchInCategory(
    categoryId: number,
    q: string,
    limit: number,
  ): Promise<{ items: VocabularySearchHit[] }> {
    return this.searchWords(q, limit, categoryId);
  }

  async markLearned(clientKey: string, wordId: number): Promise<void> {
    const word = await this.words.findOne({ where: { id: wordId } });
    if (!word) {
      throw new NotFoundException(`Word ${wordId} not found`);
    }
    const exists = await this.learned.findOne({
      where: { clientKey, word: { id: wordId } },
    });
    if (exists) return;
    await this.learned.save(this.learned.create({ clientKey, word }));
  }

  async unmarkLearned(clientKey: string, wordId: number): Promise<void> {
    await this.learned.delete({
      clientKey,
      word: { id: wordId },
    });
  }

  async listLearnedWordIds(clientKey: string): Promise<{ wordIds: number[] }> {
    const rows = await this.learned.find({
      where: { clientKey },
      relations: ['word'],
      order: { id: 'ASC' },
    });
    return { wordIds: rows.map((r) => r.word.id) };
  }

  async listLearnedWords(clientKey: string): Promise<LearnedWordSummary[]> {
    const rows = await this.learned.find({
      where: { clientKey },
      relations: { word: { category: true } },
      order: { id: 'ASC' },
    });
    const items: LearnedWordSummary[] = [];
    for (const row of rows) {
      const w = row.word;
      const cat = w.category;
      if (!cat) continue;
      items.push({
        id: w.id,
        spanish: w.spanish,
        english: w.english,
        categoryId: cat.id,
        categoryName: cat.name,
      });
    }
    items.sort((a, b) => {
      const byCat = a.categoryName.localeCompare(b.categoryName, undefined, {
        sensitivity: 'base',
      });
      if (byCat !== 0) return byCat;
      return a.spanish.localeCompare(b.spanish, undefined, { sensitivity: 'base' });
    });
    return items;
  }

  async clearLearned(clientKey: string): Promise<void> {
    await this.learned.delete({ clientKey });
  }
}
