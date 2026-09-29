import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { CATEGORIES, PRODUCTS } from '../models/mock-data';
import { Category } from '../interfaces/category.interface';
import { Product } from '../interfaces/product.interface';

interface CatalogResponse { categories: Category[]; products: Product[]; }

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly productState = signal<Product[]>(PRODUCTS.map((product) => ({ ...product, available: true, published: true })));
  private readonly categoryState = signal<Category[]>(CATEGORIES.map((category, displayOrder) => ({ ...category, visible: true, displayOrder })));
  readonly products = this.productState.asReadonly();
  readonly categories = this.categoryState.asReadonly();
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    if (this.browser) this.refresh();
  }

  getProducts(): Product[] { return this.productState(); }
  getFeaturedProducts(): Product[] { return this.productState().filter((product) => product.featured && product.available !== false); }
  getCategories(): Category[] { return this.categoryState(); }

  refresh(): void {
    this.loading.set(true);
    this.http.get<CatalogResponse>('/api/catalog').subscribe({
      next: (catalog) => {
        this.productState.set(catalog.products);
        this.categoryState.set(catalog.categories);
        this.error.set(null);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Catálogo demonstrativo: não foi possível conectar ao banco de dados.');
        this.loading.set(false);
      }
    });
  }
}