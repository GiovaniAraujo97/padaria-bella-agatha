import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { Category } from '../interfaces/category.interface';
import { Product } from '../interfaces/product.interface';
import { supabase } from '../config/supabase.config';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private refreshQueued = false;
  private readonly productState = signal<Product[]>([]);
  private readonly categoryState = signal<Category[]>([]);
  readonly products = this.productState.asReadonly();
  readonly categories = this.categoryState.asReadonly();
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor() {
    if (this.browser) {
      this.refresh();
      this.subscribeToCatalogChanges();
    }
  }

  getProducts(): Product[] { return this.productState(); }
  getFeaturedProducts(): Product[] { return this.productState().filter((product) => product.featured && product.available !== false); }
  getCategories(): Category[] { return this.categoryState(); }

  refresh(): void {
    this.loading.set(true);
    Promise.all([
      supabase.from('categories').select('id,name,icon,slug,has_sizes,is_visible,display_order').eq('is_visible', true).order('display_order').order('name'),
      supabase.from('products').select('id,name,description,price,image_url,featured,is_available,is_published,display_order,category_id,categories!inner(slug,has_sizes),product_sizes(size,price)').eq('is_published', true).order('display_order').order('name')
    ]).then(([categoriesResult, productsResult]) => {
      if (categoriesResult.error) throw categoriesResult.error;
      if (productsResult.error) throw productsResult.error;
      const categories = (categoriesResult.data ?? []).map((category) => ({
        id: category.id, name: category.name, icon: category.icon, slug: category.slug,
        hasSizes: category.has_sizes, visible: category.is_visible, displayOrder: category.display_order
      }));
      const products = (productsResult.data as unknown as Array<Record<string, any>> ?? []).map((product) => ({
        id: product['id'], name: product['name'], description: product['description'], price: product['price'],
        category: product['categories']['slug'], categoryId: product['category_id'], image: product['image_url'],
        featured: product['featured'], available: product['is_available'], published: product['is_published'],
        displayOrder: product['display_order'], categoryHasSizes: product['categories']['has_sizes'],
        sizePrices: Object.fromEntries((product['product_sizes'] ?? []).map((size: { size: string; price: number }) => [size.size, size.price]))
      })) as Product[];
      this.productState.set(products);
      this.categoryState.set(categories);
      this.error.set(null);
    }).catch(() => this.error.set('Não foi possível carregar o catálogo do banco de dados.'))
      .finally(() => this.loading.set(false));
  }

  private subscribeToCatalogChanges(): void {
    supabase.channel('catalog-live-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => this.queueRefresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => this.queueRefresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_sizes' }, () => this.queueRefresh())
      .subscribe();
  }

  private queueRefresh(): void {
    if (this.refreshQueued) return;
    this.refreshQueued = true;
    setTimeout(() => {
      this.refreshQueued = false;
      this.refresh();
    }, 150);
  }
}