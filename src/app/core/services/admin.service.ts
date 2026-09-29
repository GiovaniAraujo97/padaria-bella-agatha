import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, Observable, of } from 'rxjs';
import { Category } from '../interfaces/category.interface';
import { Product } from '../interfaces/product.interface';

export interface AdminProduct extends Product {
  id: number;
  categoryId: number;
  published: boolean;
  available: boolean;
  displayOrder: number;
}

export interface AdminCategory extends Category {
  id: number;
  visible: boolean;
  displayOrder: number;
  hasSizes: boolean;
}

export type CategoryInput = Pick<AdminCategory, 'name' | 'hasSizes'>;

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);

  login(email: string, password: string): Observable<{ email: string }> {
    return this.http.post<{ email: string }>('/api/admin/login', { email, password });
  }

  session(): Observable<{ email: string }> {
    return this.http.get<{ email: string }>('/api/admin/session');
  }

  logout(): Observable<void> {
    return this.http.post<void>('/api/admin/logout', {});
  }

  categories(): Observable<AdminCategory[]> {
    return this.http.get<AdminCategory[]>('/api/admin/categories');
  }

  saveCategory(category: CategoryInput, id?: number): Observable<AdminCategory> {
    return id
      ? this.http.put<AdminCategory>(`/api/admin/categories/${id}`, category)
      : this.http.post<AdminCategory>('/api/admin/categories', category);
  }

  saveCategoryOrder(categoryIds: number[]): Observable<void> {
    return this.http.put<void>('/api/admin/categories/order', { categoryIds });
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`/api/admin/categories/${id}`);
  }

  products(): Observable<AdminProduct[]> {
    return this.http.get<AdminProduct[]>('/api/admin/products');
  }

  saveProduct(product: AdminProduct, id?: number): Observable<{ id: number }> {
    return id
      ? this.http.put<{ id: number }>(`/api/admin/products/${id}`, product)
      : this.http.post<{ id: number }>('/api/admin/products', product);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`/api/admin/products/${id}`);
  }
}

export const adminGuard: CanActivateFn = (_route, state) => {
  const router = inject(Router);
  return inject(AdminService).session().pipe(
    map(() => true),
    catchError(() => of(router.createUrlTree(['/admin/login'], { queryParams: { returnUrl: state.url } })))
  );
};