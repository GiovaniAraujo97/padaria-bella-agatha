import { inject, Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, from, map, Observable, of, switchMap } from 'rxjs';
import { Category } from '../interfaces/category.interface';
import { Product, ProductSize } from '../interfaces/product.interface';
import { supabase } from '../config/supabase.config';

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

type DatabaseProduct = {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  featured: boolean;
  is_available: boolean;
  is_published: boolean;
  display_order: number;
  category_id: number;
  categories: { slug: string; has_sizes: boolean };
  product_sizes: { size: ProductSize; price: number }[];
};

@Injectable({ providedIn: 'root' })
export class AdminService {
  login(email: string, password: string): Observable<{ email: string }> {
    return from(supabase.auth.signInWithPassword({ email, password })).pipe(
      map(({ data, error }) => {
        if (error || !data.user?.email) throw error ?? new Error('E-mail ou senha inválidos.');
        return { email: data.user.email };
      }),
      switchMap((session) => this.session().pipe(map(() => session)))
    );
  }

  session(): Observable<{ email: string }> {
    return from(supabase.auth.getUser()).pipe(
      switchMap(({ data, error }) => {
        if (error || !data.user?.email) throw error ?? new Error('Sessão não encontrada.');
        return from(supabase.from('admin_users').select('user_id').eq('user_id', data.user.id).eq('is_active', true).maybeSingle()).pipe(
          map(({ data: admin, error: adminError }) => {
            if (adminError || !admin) throw adminError ?? new Error('Usuário sem permissão administrativa.');
            return { email: data.user!.email! };
          })
        );
      })
    );
  }

  logout(): Observable<void> {
    return from(supabase.auth.signOut()).pipe(map(({ error }) => { if (error) throw error; }));
  }

  categories(): Observable<AdminCategory[]> {
    return from(supabase.from('categories').select('id,name,icon,slug,is_visible,display_order,has_sizes').order('display_order').order('name')).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []).map((category) => ({
          id: category.id, name: category.name, icon: category.icon, slug: category.slug,
          visible: category.is_visible, displayOrder: category.display_order, hasSizes: category.has_sizes
        }));
      })
    );
  }

  saveCategory(category: CategoryInput, id?: number): Observable<AdminCategory> {
    const value = { name: category.name.trim(), has_sizes: category.hasSizes, slug: this.slugify(category.name), icon: 'bakery_dining' };
    const request = id
      ? supabase.from('categories').update(value).eq('id', id).select('id,name,icon,slug,is_visible,display_order,has_sizes').single()
      : supabase.from('categories').select('display_order').order('display_order', { ascending: false }).limit(1).maybeSingle().then(({ data: last, error }) => {
        if (error) throw error;
        return supabase.from('categories').insert({ ...value, display_order: (last?.display_order ?? 0) + 1 }).select('id,name,icon,slug,is_visible,display_order,has_sizes').single();
      });
    return from(request).pipe(map(({ data, error }) => {
      if (error || !data) throw error ?? new Error('Não foi possível salvar a categoria.');
      return { id: data.id, name: data.name, icon: data.icon, slug: data.slug, visible: data.is_visible, displayOrder: data.display_order, hasSizes: data.has_sizes };
    }));
  }

  saveCategoryOrder(categoryIds: number[]): Observable<void> {
    return from(Promise.all(categoryIds.map((id, index) => supabase.from('categories').update({ display_order: index + 1 }).eq('id', id)))).pipe(
      map((results) => { const error = results.find((result) => result.error)?.error; if (error) throw error; })
    );
  }

  deleteCategory(id: number): Observable<void> {
    return from(supabase.from('categories').delete().eq('id', id).select('id')).pipe(map(({ data, error }) => {
      if (error) throw error;
      if (!data?.length) throw new Error('A categoria não foi excluída. Verifique a permissão administrativa.');
    }));
  }

  products(): Observable<AdminProduct[]> {
    return from(supabase.from('products').select('id,name,description,price,image_url,featured,is_available,is_published,display_order,category_id,categories!inner(slug,has_sizes),product_sizes(size,price)').order('display_order').order('name')).pipe(
      map(({ data, error }) => { if (error) throw error; return (data as unknown as DatabaseProduct[] ?? []).map((product) => this.toProduct(product)); })
    );
  }

  saveProduct(product: AdminProduct, id?: number): Observable<{ id: number }> {
    const value = {
      name: product.name.trim(), description: product.description.trim(), price: product.price, category_id: product.categoryId,
      image_url: product.image, featured: product.featured, is_available: product.available, is_published: product.published, display_order: product.displayOrder
    };
    const request = id
      ? supabase.from('products').update(value).eq('id', id).select('id').single()
      : supabase.from('products').insert(value).select('id').single();
    return from(request).pipe(
      switchMap(({ data, error }) => {
        if (error || !data) throw error ?? new Error('Não foi possível salvar o produto.');
        const productId = data.id as number;
        return from(supabase.from('product_sizes').delete().eq('product_id', productId)).pipe(
          switchMap(({ error: deleteError }) => {
            if (deleteError) throw deleteError;
            const sizes = Object.entries(product.sizePrices ?? {}).map(([size, price]) => ({ product_id: productId, size, price }));
            return from(sizes.length ? supabase.from('product_sizes').insert(sizes) : Promise.resolve({ error: null })).pipe(map(({ error: sizeError }) => {
              if (sizeError) throw sizeError;
              return { id: productId };
            }));
          })
        );
      })
    );
  }

  uploadImage(image: File): Observable<{ url: string }> {
    const path = `${crypto.randomUUID()}-${image.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
    return from(supabase.storage.from('product-images').upload(path, image, { contentType: image.type, upsert: false })).pipe(
      map(({ error }) => {
        if (error) throw error;
        return { url: supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl };
      })
    );
  }

  deleteProduct(id: number): Observable<void> {
    return from(supabase.from('products').delete().eq('id', id).select('id')).pipe(map(({ data, error }) => {
      if (error) throw error;
      if (!data?.length) throw new Error('O produto não foi excluído. Verifique a permissão administrativa.');
    }));
  }

  private toProduct(product: DatabaseProduct): AdminProduct {
    return {
      id: product.id, name: product.name, description: product.description, price: product.price,
      category: product.categories.slug, categoryId: product.category_id, image: product.image_url,
      featured: product.featured, available: product.is_available, published: product.is_published,
      displayOrder: product.display_order, categoryHasSizes: product.categories.has_sizes,
      sizePrices: Object.fromEntries((product.product_sizes ?? []).map((size) => [size.size, size.price]))
    };
  }

  private slugify(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'categoria';
  }
}

export const adminGuard: CanActivateFn = (_route, state) => {
  const router = inject(Router);
  return inject(AdminService).session().pipe(
    map(() => true),
    catchError(() => of(router.createUrlTree(['/admin/login'], { queryParams: { returnUrl: state.url } })))
  );
};
