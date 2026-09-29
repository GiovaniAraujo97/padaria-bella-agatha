import { Component, computed, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CartService } from '../../core/services/cart.service';
import { ProductService } from '../../core/services/product.service';
import { ProductSelection, ProductSize } from '../../core/interfaces/product.interface';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { RevealDirective } from '../../shared/directives/reveal.directive';

@Component({
  selector: 'app-products', standalone: true,
  imports: [FormsModule, MatSnackBarModule, ProductCardComponent, RevealDirective],
  template: `
    <section class="page-intro"><div class="container"><span class="eyebrow intro-kicker" appReveal>Feito hoje, para você</span><h1 class="intro-title" appReveal>Nosso cardápio</h1><p class="intro-description" appReveal>Receitas artesanais, preparadas com ingredientes de verdade e muito carinho.</p></div></section>
    <section class="section catalog-section"><div class="container">
      @if (productService.error()) { <p class="catalog-message" role="status">{{ productService.error() }}</p> }
      @if (productService.loading()) { <p class="catalog-message" role="status">Carregando o cardápio atualizado...</p> }
      <div class="catalog-tools" appReveal><label class="catalog-search"><span class="material-symbols-outlined" aria-hidden="true">search</span><input type="search" [(ngModel)]="searchTerm" aria-label="Buscar produtos" placeholder="Buscar no cardápio"></label><div class="category-filters"><button type="button" [class.active]="selectedCategory() === 'todos'" [attr.aria-pressed]="selectedCategory() === 'todos'" (click)="selectCategory('todos')">Tudo</button>@for (category of categories; track category.slug) { <button type="button" [class.active]="selectedCategory() === category.slug" [attr.aria-pressed]="selectedCategory() === category.slug" (click)="selectCategory(category.slug)">{{ category.name }}</button> }</div><span>{{ filteredProducts().length }} delícias</span></div>
      @if (filteredProducts().length) {
        <div class="product-grid">@for (product of filteredProducts(); track product.id) { <app-product-card appReveal [product]="product" (add)="addToCart($event)" /> }</div>
      } @else {
        <div class="empty-category"><span class="material-symbols-outlined">bakery_dining</span><h2>{{ searchTerm() ? 'Nenhum produto encontrado.' : productService.loading() ? 'Carregando o cardápio...' : 'Essa fornada está chegando.' }}</h2><p>{{ searchTerm() ? 'Tente outro termo ou escolha uma categoria diferente.' : productService.loading() ? 'Só um instante.' : 'Enquanto isso, veja todas as delícias do nosso cardápio.' }}</p><button type="button" class="button" (click)="selectCategory('todos')">Ver tudo</button></div>
      }
    </div></section>
  `,
  styles: [`
    .page-intro { padding: 70px 0 55px; background: #f0ebe3; }
    .page-intro h1 { margin: 15px 0 10px; color: var(--cocoa); font: 600 clamp(2.6rem, 6vw, 4rem)/1.1 var(--serif); }
    .page-intro h1 { font-family: 'Aboreto', sans-serif; }
    .page-intro h1 { font-size: clamp(2.35rem, 5.5vw, 3.6rem); }
    .page-intro p { margin: 0; color: #756a60; line-height: 1.7; }
    .page-intro .intro-kicker.reveal { transform: translateX(-28px); transition-delay: .04s; }
    .page-intro .intro-title.reveal { transform: translateY(22px); transition-delay: .13s; }
    .page-intro .intro-description.reveal { transform: translateX(28px); transition-delay: .22s; }
    .page-intro .intro-kicker.reveal.is-visible, .page-intro .intro-title.reveal.is-visible, .page-intro .intro-description.reveal.is-visible { transform: translate(0); }
    .catalog-section { min-height: 55vh; }
    .catalog-message { margin: 0 0 18px; padding: 12px 16px; border-left: 3px solid var(--honey); background: #fff; color: var(--muted); font-size: .85rem; }
    .catalog-tools { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 28px; }
    .catalog-tools > span { flex: 0 0 auto; color: #877c70; font-size: .77rem; }
    .catalog-search { display: flex; min-width: 220px; align-items: center; gap: 8px; padding: 0 11px; border: 1px solid var(--line); background: #fff; color: var(--muted); }
    .catalog-search .material-symbols-outlined { font-size: 20px; }
    .catalog-search input { width: 100%; min-width: 0; height: 38px; border: 0; outline: 0; background: transparent; color: var(--ink); font: inherit; font-size: .85rem; }
    .category-filters { display: flex; flex-wrap: wrap; gap: 8px; }
    .category-filters button { padding: 10px 14px; border: 1px solid var(--line); background: #fff; color: #71685f; font: inherit; font-size: .9rem; cursor: pointer; transition: all .2s; }
    .category-filters button:hover, .category-filters button.active { border-color: var(--cocoa); background: var(--cocoa); color: #fff; }
    .product-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 18px; }
    .empty-category { display: grid; justify-items: center; padding: 60px 20px; text-align: center; }
    .empty-category > .material-symbols-outlined { color: #ae8050; font-size: 42px; }
    .empty-category h2 { margin: 15px 0 5px; color: var(--cocoa); font: 600 1.8rem var(--serif); }
    .empty-category p { margin: 0 0 22px; color: var(--muted); }
    @media (max-width: 900px) { .product-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; } }
    @media (max-width: 600px) { .catalog-tools { align-items: stretch; flex-direction: column; } .catalog-search { width: 100%; } .category-filters { flex-wrap: nowrap; width: calc(100vw - 36px); overflow-x: auto; padding-bottom: 8px; } .category-filters button { flex: 0 0 auto; } }
    @media (prefers-reduced-motion: reduce) { .page-intro .intro-kicker.reveal, .page-intro .intro-title.reveal, .page-intro .intro-description.reveal { transform: none; transition: none; } }
  `]
})
export class ProductsComponent {
  private readonly productService = inject(ProductService);
  private readonly cart = inject(CartService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  protected readonly searchTerm = signal('');
  protected readonly selectedCategory = signal(this.route.snapshot.queryParamMap.get('categoria') ?? 'todos');
  protected get categories() { return this.productService.getCategories(); }
  protected readonly filteredProducts = computed(() => {
    const category = this.selectedCategory();
    const query = this.searchTerm().trim().toLocaleLowerCase('pt-BR');
    return this.productService.getProducts().filter((product) =>
      (category === 'todos' || product.category === category)
      && (!query || `${product.name} ${product.description}`.toLocaleLowerCase('pt-BR').includes(query))
    );
  });

  protected selectCategory(category: string): void {
    this.selectedCategory.set(category);
    this.location.replaceState('/produtos', category === 'todos' ? '' : `categoria=${encodeURIComponent(category)}`);
  }

  protected addToCart(selection: ProductSelection): void {
    this.cart.add(selection.product, selection.size, selection.price);
    const size = selection.size ? ` (${this.sizeLabel(selection.size)})` : '';
    this.snackBar.open(`${selection.product.name}${size} adicionado ao carrinho`, '', { duration: 1800 });
  }

  private sizeLabel(size: ProductSize): string { return size === 'medio' ? 'médio' : size; }
}