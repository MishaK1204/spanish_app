import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { ProgressService } from '../../services/progress.service';
import { WordsService } from '../../services/words.service';

@Component({
  selector: 'app-home-header',
  imports: [RouterLink],
  templateUrl: './home-header.html',
  styleUrl: './home-header.scss',
})
export class HomeHeader {
  protected readonly words = inject(WordsService);
  protected readonly progress = inject(ProgressService);
  protected readonly auth = inject(AuthService);
}
