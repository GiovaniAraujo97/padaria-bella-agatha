import { Routes } from '@angular/router';
export const routes: Routes = [
	{ path: 'admin/login', loadComponent: () => import('./features/admin/admin-login.component').then((module) => module.AdminLoginComponent), title: 'Acesso administrativo | Bella Agatha' },
	{ path: 'admin', canActivate: [() => import('./core/services/admin.service').then((module) => module.adminGuard)], loadComponent: () => import('./features/admin/admin.component').then((module) => module.AdminComponent), title: 'Gerenciar catálogo | Bella Agatha' },
	{ path: '', loadComponent: () => import('./features/home/home.component').then((module) => module.HomeComponent), title: 'Padaria Bella Agatha | Feito com tempo, servido com afeto' },
	{ path: 'produtos', loadComponent: () => import('./features/produtos/products.component').then((module) => module.ProductsComponent), title: 'Nossos produtos | Bella Agatha' },
	{ path: 'sobre', loadComponent: () => import('./features/sobre/about.component').then((module) => module.AboutComponent), title: 'Nossa história | Bella Agatha' },
	{ path: 'contato', loadComponent: () => import('./features/contato/contact.component').then((module) => module.ContactComponent), title: 'Fale com a gente | Bella Agatha' },
	{ path: 'carrinho', loadComponent: () => import('./features/carrinho/cart.component').then((module) => module.CartComponent), title: 'Seu pedido | Bella Agatha' },
	{ path: '**', redirectTo: '' }
];
