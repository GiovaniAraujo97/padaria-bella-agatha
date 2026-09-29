export type ProductSize = 'pequeno' | 'medio' | 'grande';

export type ProductSizePrices = Partial<Record<ProductSize, number>>;

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  featured: boolean;
  available?: boolean;
  published?: boolean;
  displayOrder?: number;
  categoryId?: number;
  categoryHasSizes?: boolean;
  sizePrices?: ProductSizePrices;
}

export interface ProductSelection {
  product: Product;
  size?: ProductSize;
  price: number;
}