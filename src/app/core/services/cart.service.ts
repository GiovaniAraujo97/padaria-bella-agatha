import { computed, Injectable, signal } from '@angular/core';
import { Product, ProductSize } from '../interfaces/product.interface';

export interface CartItem {
  product: Product;
  quantity: number;
  size?: ProductSize;
  unitPrice: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly cartItems = signal<CartItem[]>([]);
  readonly additionCount = signal(0);
  readonly items = this.cartItems.asReadonly();
  readonly count = computed(() => this.cartItems().reduce((sum, item) => sum + item.quantity, 0));

  add(product: Product, size?: ProductSize, unitPrice = product.price): void {
    this.additionCount.update((count) => count + 1);
    this.cartItems.update((items) => {
      const existing = items.find((item) => item.product.id === product.id && item.size === size);
      return existing
        ? items.map((item) => item.product.id === product.id && item.size === size ? { ...item, quantity: item.quantity + 1 } : item)
        : [...items, { product, quantity: 1, size, unitPrice }];
    });
  }

  remove(productId: number, size?: ProductSize): void {
    this.cartItems.update((items) => items.filter((item) => item.product.id !== productId || (size !== undefined && item.size !== size)));
  }

  clear(): void { this.cartItems.set([]); }

  updateQuantity(productId: number, quantity: number, size?: ProductSize): void {
    if (quantity < 1) { this.remove(productId, size); return; }
    this.cartItems.update((items) => items.map((item) => item.product.id === productId && item.size === size ? { ...item, quantity } : item));
  }

  total(): number {
    return this.cartItems().reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }
}