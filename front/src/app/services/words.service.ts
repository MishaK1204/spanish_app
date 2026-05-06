import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import {
  Observable,
  catchError,
  finalize,
  map,
  of,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs';

import type {
  CategorySummary,
  IndexedWord,
  LearnedWordRow,
  VocabularySearchItem,
  VocabularySearchResponse,
  VocabularyWordsPage,
} from '../models/word.model';

const PAGE_LIMIT = 5000;

@Injectable({ providedIn: 'root' })
export class WordsService {
  private readonly http = inject(HttpClient);

  /** One shared in-flight request per category (avoids duplicate HTTP when loadCategory is subscribed twice). */
  private readonly categoryLoadInflight = new Map<number, Observable<IndexedWord[]>>();

  private readonly categoriesData = signal<CategorySummary[] | null>(null);
  private readonly words = signal<IndexedWord[] | null>(null);
  private readonly loadError = signal<string | null>(null);
  private readonly categoriesLoading = signal(false);
  private readonly wordsLoading = signal(false);

  readonly categories = this.categoriesData.asReadonly();
  readonly indexedWords = this.words.asReadonly();
  readonly error = this.loadError.asReadonly();
  readonly loadingCategories = this.categoriesLoading.asReadonly();
  readonly loadingWords = this.wordsLoading.asReadonly();

  readonly activeCategoryId = signal<number | null>(null);

  readonly count = computed(() => this.words()?.length ?? 0);

  readonly activeCategoryName = computed(() => {
    const id = this.activeCategoryId();
    const cats = this.categoriesData();
    if (id == null || !cats?.length) return '';
    return cats.find((c) => c.id === id)?.name ?? '';
  });

  getLearnedWords(): Observable<LearnedWordRow[]> {
    return this.http.get<LearnedWordRow[]>('/vocabulary/learned/words');
  }

  /** Omit `categoryId` to search every category (Browse uses this). */
  searchVocabulary(q: string, categoryId?: number): Observable<VocabularySearchItem[]> {
    const params: Record<string, string> = { q, limit: '300' };
    if (categoryId != null) {
      params['categoryId'] = String(categoryId);
    }
    return this.http
      .get<VocabularySearchResponse>('/vocabulary/search', { params })
      .pipe(map((r) => r.items));
  }

  loadCategories(): Observable<CategorySummary[]> {
    this.categoriesLoading.set(true);
    this.loadError.set(null);
    return this.http.get<CategorySummary[]>('/vocabulary/categories').pipe(
      tap({
        next: (list) => this.categoriesData.set(list),
        error: () =>
          this.loadError.set(
            'Could not load categories. Is the backend running on port 3000?',
          ),
      }),
      catchError(() => of([])),
      tap(() => this.categoriesLoading.set(false)),
    );
  }

  loadCategory(categoryId: number): Observable<IndexedWord[]> {
    this.loadError.set(null);

    if (this.activeCategoryId() === categoryId && this.words()?.length) {
      return of(this.words()!);
    }

    const inflight = this.categoryLoadInflight.get(categoryId);
    if (inflight) {
      return inflight;
    }

    this.wordsLoading.set(true);
    this.activeCategoryId.set(categoryId);

    const shared = this.accumulatePage(categoryId, 0, []).pipe(
      tap({
        next: (indexed) => this.words.set(indexed),
        error: () => {
          this.loadError.set('Could not load words for this category.');
          this.words.set(null);
        },
      }),
      catchError(() => of([])),
      tap(() => this.wordsLoading.set(false)),
      finalize(() => this.categoryLoadInflight.delete(categoryId)),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

    this.categoryLoadInflight.set(categoryId, shared);
    return shared;
  }

  at(index: number): IndexedWord | undefined {
    return this.words()?.[index];
  }

  shuffleIndices(indices: number[]): number[] {
    const copy = [...indices];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  pickWrongEnglishExcluding(
    correctEnglish: string,
    pool: IndexedWord[],
    count: number,
  ): string[] {
    const unique = [
      ...new Set(pool.map((w) => w.english).filter((e) => e !== correctEnglish)),
    ];
    for (let i = unique.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [unique[i], unique[j]] = [unique[j], unique[i]];
    }
    return unique.slice(0, Math.min(count, unique.length));
  }

  private accumulatePage(
    categoryId: number,
    offset: number,
    acc: { id: number; spanish: string; english: string }[],
  ): Observable<IndexedWord[]> {
    return this.http
      .get<VocabularyWordsPage>(`/vocabulary/categories/${categoryId}/words`, {
        params: { limit: PAGE_LIMIT, offset },
      })
      .pipe(
        switchMap((page) => {
          const merged = [...acc, ...page.items];
          if (merged.length >= page.total || page.items.length === 0) {
            return of(
              merged.map((w, index) => ({
                id: w.id,
                spanish: w.spanish,
                english: w.english,
                index,
              })),
            );
          }
          return this.accumulatePage(
            categoryId,
            offset + page.items.length,
            merged,
          );
        }),
      );
  }
}
