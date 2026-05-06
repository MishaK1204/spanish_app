import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';

import { hasStoredAccessToken } from '../auth/auth-storage';

/** Cached copy of server state for faster first paint; server wins after sync. */
const MASTERED_CACHE_KEY = 'spanish-learn-mastered-word-ids-cache';

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly http = inject(HttpClient);

  private readonly mastered = signal<Set<number>>(this.readCache());

  readonly masteredCount = computed(() => this.mastered().size);
  readonly masteredIndices = this.mastered.asReadonly();

  /** Clear UI cache and reload learned ids for the current session (e.g. after logout). */
  onLogout(): void {
    this.mastered.set(new Set());
    try {
      localStorage.removeItem(MASTERED_CACHE_KEY);
    } catch {
      /* ignore */
    }
    this.syncFromServer();
  }

  /** Pull learned word ids from the API (call on app load). */
  syncFromServer(): void {
    this.http.get<{ wordIds: number[] }>('/vocabulary/learned').subscribe({
      next: ({ wordIds }) => {
        this.mastered.set(new Set(wordIds));
        this.persistCache();
      },
      error: () => {
        /* keep cached Set if offline */
      },
    });
  }

  isMastered(wordId: number): boolean {
    return this.mastered().has(wordId);
  }

  markMastered(wordId: number): void {
    if (!hasStoredAccessToken()) return;
    const prev = new Set(this.mastered());
    const next = new Set(prev);
    next.add(wordId);
    this.mastered.set(next);
    this.persistCache();
    this.http.post(`/vocabulary/words/${wordId}/learned`, {}).subscribe({
      error: () => {
        this.mastered.set(prev);
        this.persistCache();
      },
    });
  }

  unmarkMastered(wordId: number): void {
    if (!hasStoredAccessToken()) return;
    const prev = new Set(this.mastered());
    const next = new Set(prev);
    next.delete(wordId);
    this.mastered.set(next);
    this.persistCache();
    this.http.delete(`/vocabulary/words/${wordId}/learned`).subscribe({
      error: () => {
        this.mastered.set(prev);
        this.persistCache();
      },
    });
  }

  toggleMastered(wordId: number): void {
    if (this.isMastered(wordId)) {
      this.unmarkMastered(wordId);
    } else {
      this.markMastered(wordId);
    }
  }

  clearMastered(): void {
    if (!hasStoredAccessToken()) return;
    const prev = new Set(this.mastered());
    this.mastered.set(new Set());
    this.persistCache();
    this.http.delete('/vocabulary/learned').subscribe({
      error: () => {
        this.mastered.set(prev);
        this.persistCache();
      },
    });
  }

  private readCache(): Set<number> {
    try {
      const raw = localStorage.getItem(MASTERED_CACHE_KEY);
      if (!raw) return new Set();
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return new Set();
      return new Set(
        parsed.filter((n): n is number => typeof n === 'number' && Number.isFinite(n)),
      );
    } catch {
      return new Set();
    }
  }

  private persistCache(): void {
    try {
      localStorage.setItem(
        MASTERED_CACHE_KEY,
        JSON.stringify([...this.mastered()]),
      );
    } catch {
      /* ignore quota */
    }
  }
}
