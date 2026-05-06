import { Component, inject, signal } from '@angular/core';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { filter } from 'rxjs';

import { AuthService } from './services/auth.service';
import { ProgressService } from './services/progress.service';
import { WordsService } from './services/words.service';

/** Category segment from `/category/:id/...`; header uses this (not `WordsService.activeCategoryId`, which can stay set after leaving). */
function categoryIdFromRouteUrl(url: string): number | null {
  const path = url.split('?')[0];
  const m = path.match(/^\/category\/(\d+)/);
  if (!m) return null;
  const id = Number(m[1]);
  return Number.isFinite(id) && id > 0 ? id : null;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);
  protected readonly words = inject(WordsService);
  protected readonly auth = inject(AuthService);
  protected readonly progress = inject(ProgressService);

  /** Synced from the URL on every navigation — drives Flashcards / Quiz / Browse in the header. */
  protected readonly routeCategoryId = signal<number | null>(
    categoryIdFromRouteUrl(this.router.url),
  );

  constructor() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => {
        this.routeCategoryId.set(categoryIdFromRouteUrl(this.router.url));
      });

    this.words.loadCategories().subscribe({ error: () => {} });
    this.progress.syncFromServer();
  }
}
