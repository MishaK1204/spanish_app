import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { IndexedWord } from '../../models/word.model';
import { AuthService } from '../../services/auth.service';
import { ProgressService } from '../../services/progress.service';
import { SpanishSpeechService } from '../../services/spanish-speech.service';
import { WordsService } from '../../services/words.service';

type QuizPhase = 'setup' | 'running' | 'done';

interface Question {
  word: IndexedWord;
  choices: string[];
  correct: string;
}

@Component({
  selector: 'app-quiz',
  imports: [RouterLink],
  templateUrl: './quiz.html',
  styleUrl: './quiz.scss',
})
export class Quiz {
  protected readonly wordsService = inject(WordsService);
  protected readonly progress = inject(ProgressService);
  protected readonly auth = inject(AuthService);
  private readonly speech = inject(SpanishSpeechService);

  protected readonly roundSizes = [5, 10, 20] as const;
  protected readonly roundSize = signal(10);
  protected readonly onlyLearning = signal(true);

  protected readonly phase = signal<QuizPhase>('setup');
  protected readonly questions = signal<Question[]>([]);
  protected readonly currentIndex = signal(0);
  protected readonly selected = signal<string | null>(null);
  protected readonly score = signal(0);

  protected startRound(): void {
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
    const n = Math.min(this.roundSize(), pool.length);
    const shuffled = this.wordsService.shuffleIndices([...pool]).slice(0, n);

    const qs: Question[] = shuffled.map((idx) => {
      const word = list[idx];
      const choices = this.buildChoices(word, list);
      return { word, choices, correct: word.english };
    });

    this.questions.set(qs);
    this.currentIndex.set(0);
    this.selected.set(null);
    this.score.set(0);
    this.phase.set('running');
  }

  protected currentQuestion(): Question | undefined {
    return this.questions()[this.currentIndex()];
  }

  protected pick(answer: string): void {
    if (this.selected()) return;
    this.selected.set(answer);
    const q = this.currentQuestion();
    if (!q) return;
    if (answer === q.correct) {
      this.score.update((s) => s + 1);
      this.progress.markMastered(q.word.id);
    }
  }

  protected nextQuestion(): void {
    this.speech.cancel();
    const qs = this.questions();
    const i = this.currentIndex();
    if (i + 1 >= qs.length) {
      this.phase.set('done');
    } else {
      this.currentIndex.set(i + 1);
      this.selected.set(null);
    }
  }

  protected speakSpanish(phrase: string): void {
    this.speech.speakSpanish(phrase);
  }

  protected restartSetup(): void {
    this.speech.cancel();
    this.phase.set('setup');
    this.questions.set([]);
    this.currentIndex.set(0);
    this.selected.set(null);
    this.score.set(0);
  }

  private buildChoices(word: IndexedWord, list: IndexedWord[]): string[] {
    const wrongPool = this.wordsService.pickWrongEnglishExcluding(word.english, list, 24);
    const picks: string[] = [];
    for (const w of wrongPool) {
      if (picks.length >= 3) break;
      if (!picks.includes(w)) picks.push(w);
    }
    let guard = 0;
    while (picks.length < 3 && guard++ < 500) {
      const r = list[Math.floor(Math.random() * list.length)];
      if (r.english !== word.english && !picks.includes(r.english)) {
        picks.push(r.english);
      }
    }
    const base = [word.english, ...picks.slice(0, 3)];
    const unique = [...new Set(base)];
    while (unique.length < 4 && guard++ < 600) {
      const r = list[Math.floor(Math.random() * list.length)];
      if (!unique.includes(r.english)) unique.push(r.english);
    }
    return this.shuffleStrings(unique.slice(0, 4));
  }

  private shuffleStrings(items: string[]): string[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
}
