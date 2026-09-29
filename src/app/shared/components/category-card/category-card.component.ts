import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Category } from '../../../core/interfaces/category.interface';

@Component({
  selector: 'app-category-card',
  standalone: true,
  imports: [RouterLink],
  template: `<a class="category-card" [routerLink]="['/produtos']" [queryParams]="{ categoria: category().slug }"><span class="material-symbols-outlined">{{ category().icon }}</span><span>{{ category().name }}</span><span class="material-symbols-outlined arrow">arrow_outward</span></a>`,
  styles: [`
    :host { display: block; }
    .category-card { position: relative; display: flex; min-height: 88px; align-items: center; justify-content: flex-start; gap: 8px; padding: 10px 24px 10px 12px; border: 1px solid #e8e1d8; background: #fff; color: var(--cocoa); cursor: pointer; transition: transform .25s, background .25s, border-color .25s, box-shadow .25s; }
    .category-card:hover, .category-card:focus-visible { transform: translateY(-4px); border-color: var(--honey); background: #fffcf5; box-shadow: 0 9px 20px #35251714; }
    .category-card > .material-symbols-outlined:first-child { flex: 0 0 auto; color: #a9814b; font-size: 24px; transition: color .2s, transform .2s; }
    .category-card:hover > .material-symbols-outlined:first-child, .category-card:focus-visible > .material-symbols-outlined:first-child { transform: scale(1.08); color: var(--cocoa); }
    .category-card > span:nth-child(2) { font: 500 14px/20px 'Nunito', sans-serif; }
    .arrow { position: absolute; top: 8px; right: 6px; font-size: 15px; opacity: 0; transition: opacity .2s, transform .2s; }
    .category-card:hover .arrow, .category-card:focus-visible .arrow { transform: translate(2px, -2px); opacity: 1; }
    @media (max-width: 700px) { .category-card { min-height: 78px; padding: 9px 21px 9px 10px; gap: 7px; } .category-card > .material-symbols-outlined:first-child { font-size: 22px; } }
    @media (prefers-reduced-motion: reduce) { .category-card, .category-card > .material-symbols-outlined:first-child, .arrow { transition: none; } }
  `]
})
export class CategoryCardComponent {
  readonly category = input.required<Category>();
}