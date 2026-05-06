import {
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  of,
  switchMap,
  tap,
} from 'rxjs';

import type { IndexedWord } from '../../models/word.model';
import { AuthService } from '../../services/auth.service';
import { ProgressService } from '../../services/progress.service';
import { WordsService } from '../../services/words.service';

/** Browse row: category fields come from API search; omitted when showing the loaded deck only. */
export type BrowseRow = IndexedWord & {
  categoryId?: number;
  categoryName?: string;
};

@Component({
  selector: 'app-browse',
  imports: [RouterLink],
  templateUrl: './browse.html',
  styleUrl: './browse.scss',
})
export class Browse {
  protected readonly wordsService = inject(WordsService);
  protected readonly progress = inject(ProgressService);
  protected readonly auth = inject(AuthService);

  protected readonly query = signal('');
  protected readonly searchRows = signal<BrowseRow[]>([]);
  protected readonly searchLoading = signal(false);
  protected readonly searchFailed = signal(false);

  private readonly searchDeps = computed(() => this.query().trim());

  protected readonly displayRows = computed(() => {
    const q = this.query().trim();
    const local = this.wordsService.indexedWords();
    if (!q) return (local ?? []) as BrowseRow[];
    return this.searchRows();
  });

  protected readonly shownCount = computed(() => this.displayRows().length);

  constructor() {
    toObservable(this.searchDeps)
      .pipe(
        debounceTime(280),
        distinctUntilChanged(),
        switchMap((q) => {
          if (!q) {
            this.searchLoading.set(false);
            this.searchFailed.set(false);
            return of([] as BrowseRow[]);
          }
          this.searchLoading.set(true);
          this.searchFailed.set(false);
          return this.wordsService.searchVocabulary(q).pipe(
            map((items) =>
              items.map((item, index) => ({
                id: item.id,
                spanish: item.spanish,
                english: item.english,
                index,
                categoryId: item.categoryId,
                categoryName: item.categoryName,
              })),
            ),
            tap(() => this.searchLoading.set(false)),
            catchError(() => {
              this.searchLoading.set(false);
              this.searchFailed.set(true);
              return of([]);
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((rows) => this.searchRows.set(rows));
  }

  protected onQueryInput(event: Event): void {
    const v = (event.target as HTMLInputElement).value;
    this.query.set(v);
  }

  protected toggle(wordId: number): void {
    this.progress.toggleMastered(wordId);
  }
}
