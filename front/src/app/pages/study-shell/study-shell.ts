import {
  Component,
  effect,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  ActivatedRoute,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { map, distinctUntilChanged } from 'rxjs';

import { WordsService } from '../../services/words.service';

@Component({
  selector: 'app-study-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './study-shell.html',
  styleUrl: './study-shell.scss',
})
export class StudyShell {
  protected readonly words = inject(WordsService);
  private readonly route = inject(ActivatedRoute);

  private readonly categoryId = toSignal(
    this.route.paramMap.pipe(
      map((p) => Number(p.get('categoryId'))),
      distinctUntilChanged(),
    ),
    { initialValue: NaN },
  );

  constructor() {
    effect(() => {
      const id = this.categoryId();
      if (!Number.isFinite(id) || id <= 0) return;
      this.words.loadCategory(id).subscribe({ error: () => {} });
    });
  }
}
