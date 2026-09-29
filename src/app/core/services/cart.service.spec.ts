import { TestBed } from '@angular/core/testing';
import { CartService } from './cart.service';
import { Product } from '../interfaces/product.interface';

const sampleProduct: Product = {
  id: 1,
  name: 'Pão artesanal',
  description: 'Fermentação natural',
  price: 18.9,
  category: 'paes',
  image: '',
  featured: true
};

describe('CartService', () => {
  let cart: CartService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    cart = TestBed.inject(CartService);
  });

  it('combines repeated additions and calculates the total', () => {
    cart.add(sampleProduct);
    cart.add(sampleProduct);

    expect(cart.count()).toBe(2);
    expect(cart.additionCount()).toBe(2);
    expect(cart.items()).toHaveLength(1);
    expect(cart.total()).toBeCloseTo(37.8);
  });

  it('updates quantity and removes an item when quantity reaches zero', () => {
    cart.add(sampleProduct);
    cart.updateQuantity(sampleProduct.id, 3);
    expect(cart.count()).toBe(3);
    expect(cart.additionCount()).toBe(1);

    cart.updateQuantity(sampleProduct.id, 0);
    expect(cart.items()).toHaveLength(0);
    expect(cart.total()).toBe(0);
  });

  it('keeps different product sizes separate and totals their prices', () => {
    cart.add(sampleProduct, 'pequeno', 22);
    cart.add(sampleProduct, 'medio', 33);
    cart.add(sampleProduct, 'pequeno', 22);

    expect(cart.items()).toHaveLength(2);
    expect(cart.count()).toBe(3);
    expect(cart.total()).toBe(77);

    cart.updateQuantity(sampleProduct.id, 1, 'pequeno');
    expect(cart.count()).toBe(2);
    expect(cart.total()).toBe(55);

    cart.remove(sampleProduct.id, 'pequeno');
    expect(cart.items()).toHaveLength(1);
    expect(cart.items()[0].size).toBe('medio');
    expect(cart.total()).toBe(33);
  });

  it('clears every item', () => {
    cart.add(sampleProduct);
    cart.clear();

    expect(cart.items()).toHaveLength(0);
    expect(cart.count()).toBe(0);
  });
});