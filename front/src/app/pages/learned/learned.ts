import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { LearnedWordRow } from '../../models/word.model';
import { AuthService } from '../../services/auth.service';
import { ProgressService } from '../../services/progress.service';
import { WordsService } from '../../services/words.service';

@Component({
  selector: 'app-learned',
  imports: [RouterLink],
  templateUrl: './learned.html',
  styleUrl: './learned.scss',
})
export class Learned {
  protected readonly wordsService = inject(WordsService);
  protected readonly progress = inject(ProgressService);
  protected readonly auth = inject(AuthService);

  protected readonly items = signal<LearnedWordRow[] | null>(null);
  protected readonly loadError = signal<string | null>(null);
  protected readonly loading = signal(true);

  protected readonly query = signal('');

  protected readonly filtered = computed(() => {
    const list = this.items();
    const q = this.query().trim().toLowerCase();
    if (!list?.length) return [];
    if (!q) return list;
    return list.filter(
      (w) =>
        w.spanish.toLowerCase().includes(q) ||
        w.english.toLowerCase().includes(q) ||
        w.categoryName.toLowerCase().includes(q),
    );
  });

  constructor() {
    this.loading.set(true);
    this.loadError.set(null);
    this.wordsService.getLearnedWords().subscribe({
      next: (rows) => {
        this.items.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.items.set(null);
        this.loadError.set(
          'Could not load known words. Is the backend running?',
        );
        this.loading.set(false);
      },
    });
  }

  protected onQueryInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected unmark(wordId: number): void {
    const list = this.items();
    if (!list) return;
    this.progress.unmarkMastered(wordId);
    this.items.set(list.filter((w) => w.id !== wordId));
  }
}
