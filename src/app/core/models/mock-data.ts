import { Category } from '../interfaces/category.interface';
import { Product } from '../interfaces/product.interface';

export const CATEGORIES: Category[] = [
  { name: 'Pães artesanais', icon: 'bakery_dining', slug: 'paes' },
  { name: 'Bolos', icon: 'cake', slug: 'bolos' },
  { name: 'Tortas', icon: 'pie_chart', slug: 'tortas' },
  { name: 'Doces', icon: 'cookie', slug: 'doces' },
  { name: 'Salgados', icon: 'tapas', slug: 'salgados' },
  { name: 'Cafés', icon: 'coffee', slug: 'cafes' },
  { name: 'Bebidas', icon: 'local_cafe', slug: 'bebidas' },
  { name: 'Combos', icon: 'redeem', slug: 'combos' }
];

export const PRODUCTS: Product[] = [
  { id: 1, name: 'Bolo Floresta Negra', description: 'Chocolate intenso, cerejas frescas e chantilly leve.', price: 89.9, sizePrices: { pequeno: 59.9, medio: 89.9, grande: 129.9 }, category: 'bolos', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=85', featured: true },
  { id: 2, name: 'Torta Holandesa', description: 'Creme aveludado, base crocante e ganache belga.', price: 74.9, sizePrices: { pequeno: 49.9, medio: 74.9, grande: 109.9 }, category: 'tortas', image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=800&q=85', featured: true },
  { id: 3, name: 'Sonho de Creme', description: 'Massa fofinha recheada com creme de baunilha.', price: 9.5, category: 'doces', image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=85', featured: true },
  { id: 4, name: 'Pão Italiano', description: 'Casca rústica, miolo macio e fermentação natural.', price: 18.9, category: 'paes', image: 'https://images.unsplash.com/photo-1585478259715-876acc5be8eb?auto=format&fit=crop&w=800&q=85', featured: true },
  { id: 5, name: 'Croissant de Manteiga', description: 'Folhado artesanal com manteiga de primeira.', price: 12.9, category: 'paes', image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=85', featured: true },
  { id: 6, name: 'Cheesecake de Frutas', description: 'Cheesecake delicado com geleia feita na casa.', price: 16.9, sizePrices: { pequeno: 11.9, medio: 16.9, grande: 24.9 }, category: 'tortas', image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=85', featured: true },
  { id: 7, name: 'Brownie Premium', description: 'Chocolate meio amargo, casquinha fina e interior úmido.', price: 11.9, category: 'doces', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=85', featured: true },
  { id: 8, name: 'Pão de Queijo Gourmet', description: 'Queijo meia-cura e receita mineira de família.', price: 8.9, category: 'salgados', image: 'https://images.unsplash.com/photo-1608198093002-ad4e005484df?auto=format&fit=crop&w=800&q=85', featured: true }
];