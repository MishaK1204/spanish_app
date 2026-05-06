import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-category-card',
  imports: [RouterLink],
  templateUrl: './category-card.html',
  styleUrl: './category-card.scss',
})
export class CategoryCard {
  readonly link = input.required<string | readonly (string | number)[]>();
  readonly title = input.required<string>();
  readonly subtitle = input.required<string>();
  readonly hint = input.required<string>();
}
