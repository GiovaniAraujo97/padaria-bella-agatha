import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatButtonModule, MatIconModule],
  template: `
    <header class="site-header" [class.is-scrolled]="scrolled()">
      <div class="header-inner container">
        <a class="brand" routerLink="/" aria-label="Bella Agatha, início" (click)="closeMenu()">
          <img src="/logo-pba.png" alt="Padaria Bella Agatha" class="brand-mark">
        </a>
        <nav class="main-nav" [class.is-open]="menuOpen()" aria-label="Navegação principal">
          <div class="nav-group nav-group-left">
            <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" (click)="closeMenu()">Início</a>
            <a routerLink="/sobre" routerLinkActive="active" (click)="closeMenu()">Quem somos</a>
          </div>
          <div class="nav-group nav-group-right">
            <a routerLink="/produtos" routerLinkActive="active" (click)="closeMenu()">Produtos</a>
            <a routerLink="/contato" routerLinkActive="active" (click)="closeMenu()">Contato</a>
          </div>
        </nav>
        <div class="header-actions">
          <a class="cart-link" routerLink="/carrinho" [attr.aria-label]="cart.count() ? 'Abrir carrinho, ' + cart.count() + ' itens' : 'Abrir carrinho vazio'">
            <mat-icon aria-hidden="true" fontSet="material-symbols-outlined" [class.cart-shake-a]="cart.additionCount() > 0 && cart.additionCount() % 2 === 1" [class.cart-shake-b]="cart.additionCount() > 0 && cart.additionCount() % 2 === 0">shopping_bag</mat-icon>
            @if (cart.count() > 0) { <span class="cart-count" aria-hidden="true">{{ cart.count() }}</span> }
          </a>
          <button class="menu-toggle" mat-icon-button (click)="toggleMenu()" [attr.aria-expanded]="menuOpen()" aria-label="Abrir menu"><mat-icon fontSet="material-symbols-outlined">{{ menuOpen() ? 'close' : 'menu' }}</mat-icon></button>
        </div>
      </div>
      <div class="chocolate-drip" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>
    </header>
  `,
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  private readonly host = inject(ElementRef<HTMLElement>);
  protected readonly cart = inject(CartService);
  protected readonly scrolled = signal(false);
  protected readonly menuOpen = signal(false);

  @HostListener('window:scroll')
  onScroll(): void { this.scrolled.set(window.scrollY > 12); }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.menuOpen() && !this.host.nativeElement.contains(event.target as Node)) this.closeMenu();
  }

  toggleMenu(): void { this.menuOpen.update((open) => !open); }
  closeMenu(): void { this.menuOpen.set(false); }
}