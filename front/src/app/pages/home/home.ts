import { Component, inject } from '@angular/core';

import { CategoryCard } from '../../components/category-card/category-card';
import { HomeHeader } from '../../components/home-header/home-header';
import { AuthService } from '../../services/auth.service';
import { ProgressService } from '../../services/progress.service';
import { WordsService } from '../../services/words.service';

@Component({
  selector: 'app-home',
  imports: [HomeHeader, CategoryCard],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  protected readonly words = inject(WordsService);
  protected readonly progress = inject(ProgressService);
  protected readonly auth = inject(AuthService);

  constructor() {
    if (!this.words.categories()?.length && !this.words.loadingCategories()) {
      this.words.loadCategories().subscribe({ error: () => {} });
    }
  }

  protected clearProgress(): void {
    if (confirm('Clear all words marked as known? This cannot be undone.')) {
      this.progress.clearMastered();
    }
  }
}
