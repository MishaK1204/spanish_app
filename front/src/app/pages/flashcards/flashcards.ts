import { Component, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { FlashcardFace } from '../../components/flashcard-face/flashcard-face';
import type { IndexedWord } from '../../models/word.model';
import { AuthService } from '../../services/auth.service';
import { ProgressService } from '../../services/progress.service';
import { SpanishSpeechService } from '../../services/spanish-speech.service';
import { WordsService } from '../../services/words.service';

@Component({
  selector: 'app-flashcards',
  imports: [RouterLink, FlashcardFace],
  templateUrl: './flashcards.html',
  styleUrl: './flashcards.scss',
})
export class Flashcards {
  protected readonly wordsService = inject(WordsService);
  protected readonly progress = inject(ProgressService);
  protected readonly auth = inject(AuthService);
  private readonly speech = inject(SpanishSpeechService);

  protected readonly onlyLearning = signal(true);
  protected readonly flipped = signal(false);
  protected readonly queue = signal<number[]>([]);
  protected readonly position = signal(0);

  constructor() {
    effect(() => {
      const list = this.wordsService.indexedWords();
      const only = this.onlyLearning();
      if (!list?.length) return;
      void only;
      this.resetQueue();
    });
  }

  protected currentWord(): IndexedWord | undefined {
    const q = this.queue();
    const pos = this.position();
    const idx = q[pos];
    return idx !== undefined ? this.wordsService.at(idx) : undefined;
  }

  protected deckProgress(): number {
    const len = this.queue().length;
    if (!len) return 0;
    return (this.position() + 1) / len;
  }

  protected progressPercent(): number {
    return Math.round(this.deckProgress() * 100);
  }

  protected toggleFlip(): void {
    this.flipped.update((f) => !f);
  }

  protected speakSpanish(phrase: string): void {
    this.speech.speakSpanish(phrase);
  }

  protected know(): void {
    const w = this.currentWord();
    if (w) this.progress.markMastered(w.id);
    this.advance();
  }

  protected again(): void {
    this.advance();
  }

  protected reshuffle(): void {
    this.resetQueue();
  }

  protected togglePool(): void {
    this.onlyLearning.update((v) => !v);
    this.resetQueue();
  }

  private advance(): void {
    this.speech.cancel();
    this.flipped.set(false);
    const q = this.queue();
    const pos = this.position();
    if (!q.length) {
      this.resetQueue();
      return;
    }
    if (pos + 1 >= q.length) {
      this.resetQueue();
    } else {
      this.position.set(pos + 1);
    }
  }

  private resetQueue(): void {
    this.speech.cancel();
    const list = this.wordsService.indexedWords();
    if (!list?.length) return;
    const indices = list.map((_, i) => i);
    const filtered = this.onlyLearning()
      ? indices.filter((i) => {
          const w = list[i];
          return w ? !this.progress.isMastered(w.id) : false;
        })
      : indices;
    const pool = filtered.length ? filtered : indices;
    this.queue.set(this.wordsService.shuffleIndices(pool));
    this.position.set(0);
    this.flipped.set(false);
  }
}
