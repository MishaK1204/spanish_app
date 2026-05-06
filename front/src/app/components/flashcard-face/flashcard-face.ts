import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-flashcard-face',
  templateUrl: './flashcard-face.html',
  styleUrl: './flashcard-face.scss',
})
export class FlashcardFace {
  readonly spanish = input.required<string>();
  readonly english = input.required<string>();
  readonly flipped = input.required<boolean>();

  readonly flip = output<void>();
  readonly speak = output<void>();
}
