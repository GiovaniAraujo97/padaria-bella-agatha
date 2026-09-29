import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductSize } from '../../core/interfaces/product.interface';
import { CartService } from '../../core/services/cart.service';
import { RevealDirective } from '../../shared/directives/reveal.directive';

@Component({
  selector: 'app-cart', standalone: true, imports: [CurrencyPipe, RouterLink, RevealDirective],
  template: `
    <section class="cart-page"><div class="container">
      <span class="eyebrow">Um pouquinho de carinho a caminho</span><h1 appReveal>Seu pedido</h1>
      @if (cart.items().length === 0) {
        <div class="cart-empty" appReveal><span class="material-symbols-outlined">shopping_bag</span><h2>Seu carrinho está esperando uma fornada.</h2><p>Que tal escolher algo fresquinho para acompanhar seu dia?</p><a routerLink="/produtos" class="button">Ver nossos produtos <span class="material-symbols-outlined">arrow_forward</span></a></div>
      } @else {
        <div class="cart-layout"><div class="cart-list" appReveal><div class="cart-list-head"><span>{{ cart.count() }} itens no seu pedido</span><button class="clear-cart" (click)="cart.clear()">Limpar carrinho</button></div>
          @for (item of cart.items(); track item.product.id + '-' + (item.size ?? 'unico')) {
            <article class="cart-item"><img [src]="item.product.image" [alt]="item.product.name"><div class="cart-item-info"><h2>{{ item.product.name }}</h2>@if (item.size) { <small class="cart-size">Tamanho {{ sizeLabel(item.size) }}</small> }<p>{{ item.product.description }}</p><strong>{{ item.unitPrice | currency:'BRL' }}</strong></div><div class="quantity-control"><button (click)="cart.updateQuantity(item.product.id, item.quantity - 1, item.size)" [attr.aria-label]="'Diminuir ' + item.product.name">−</button><span>{{ item.quantity }}</span><button (click)="cart.updateQuantity(item.product.id, item.quantity + 1, item.size)" [attr.aria-label]="'Aumentar ' + item.product.name">+</button></div><strong class="line-total">{{ item.unitPrice * item.quantity | currency:'BRL' }}</strong><button class="remove-item" (click)="cart.remove(item.product.id, item.size)" [attr.aria-label]="'Remover ' + item.product.name"><span class="material-symbols-outlined">delete</span></button></article>
          }
          <a routerLink="/produtos" class="continue-link"><span class="material-symbols-outlined">arrow_back</span> Continuar escolhendo</a>
        </div><aside class="order-summary" appReveal><h2>Resumo do pedido</h2><div><span>Subtotal</span><span>{{ cart.total() | currency:'BRL' }}</span></div><div><span>Entrega</span><span>A combinar</span></div><div class="summary-total"><strong>Total</strong><strong>{{ cart.total() | currency:'BRL' }}</strong></div><a [href]="whatsappLink()" target="_blank" rel="noopener" class="button"><span class="material-symbols-outlined">chat</span> Finalizar pelo WhatsApp</a><p>O valor da entrega é confirmado com a nossa equipe.</p></aside></div>
      }
    </div></section>
  `,
  styles: [`
    .cart-page { min-height: 58vh; padding: 65px 0 90px; background: #faf8f4; font-family: 'Nunito', sans-serif; }
    .cart-page h1 { margin: 14px 0 33px; color: var(--cocoa); font: 600 clamp(2.6rem, 6vw, 3.8rem)/1.1 'Aboreto', sans-serif; }
    .cart-empty { display: grid; justify-items: center; padding: 60px 18px 85px; border-top: 1px solid var(--line); text-align: center; }
    .cart-empty > .material-symbols-outlined { color: #aa814f; font-size: 48px; }
    .cart-empty h2 { margin: 18px 0 6px; color: var(--cocoa); font: 600 1.6rem 'Aboreto', sans-serif; }
    .cart-empty p { margin: 0 0 22px; color: var(--muted); }
    .cart-layout { display: grid; grid-template-columns: 1.5fr .7fr; align-items: start; gap: 54px; }
    .cart-list-head { display: flex; justify-content: space-between; padding: 0 0 12px; color: #81766b; font-size: .77rem; }
    .clear-cart { border: 0; background: none; color: #8a5c43; font-size: .74rem; text-decoration: underline; cursor: pointer; }
    .cart-item { display: grid; grid-template-columns: 86px 1fr auto auto 30px; align-items: center; gap: 18px; padding: 18px 0; border-top: 1px solid var(--line); }
    .cart-item > img { width: 86px; height: 86px; object-fit: cover; }
    .cart-item-info h2 { margin: 0 0 5px; color: rgb(92, 64, 51); font: 700 16px/19px 'Nunito', sans-serif; }
    .cart-item-info p { margin: 0 0 9px; color: #82786d; font-size: .74rem; }
    .cart-item-info .cart-size { display: block; margin: 3px 0 6px; color: var(--cocoa-light); font-size: .7rem; font-weight: 700; }
    .cart-item-info strong { color: var(--cocoa); font-size: .82rem; }
    .quantity-control { display: flex; align-items: center; border: 1px solid var(--line); background: #fff; }
    .quantity-control button { width: 30px; height: 32px; border: 0; background: transparent; cursor: pointer; }
    .quantity-control button:hover { background: #f1e9dd; }
    .quantity-control span { min-width: 25px; text-align: center; font-size: .8rem; }
    .line-total { color: var(--cocoa); font-size: .83rem; white-space: nowrap; }
    .remove-item { display: grid; width: 30px; height: 30px; place-items: center; border: 0; background: transparent; color: #9a8d81; cursor: pointer; }
    .remove-item:hover { color: #a33d31; }
    .remove-item .material-symbols-outlined { font-size: 19px; }
    .continue-link { display: inline-flex; align-items: center; gap: 7px; margin-top: 20px; color: var(--cocoa); font-size: .8rem; font-weight: 600; }
    .continue-link .material-symbols-outlined { font-size: 17px; }
    .order-summary { padding: 24px; border: 1px solid var(--line); background: #fff; }
    .order-summary h2 { margin: 0 0 23px; color: var(--cocoa); font: 600 1.3rem 'Aboreto', sans-serif; }
    .order-summary > div { display: flex; justify-content: space-between; margin: 14px 0; color: #786f65; font-size: .82rem; }
    .order-summary .summary-total { margin: 21px 0; padding-top: 16px; border-top: 1px solid var(--line); color: var(--cocoa); font-size: .98rem; }
    .order-summary .button { width: 100%; font-size: .8rem; }
    .order-summary p { margin: 12px 0 0; color: #8e847a; font-size: .67rem; line-height: 1.6; text-align: center; }
    @media (max-width: 900px) { .cart-layout { grid-template-columns: 1fr; gap: 30px; } }
    @media (max-width: 620px) {
      .cart-item { grid-template-columns: 68px minmax(0, 1fr) auto; grid-template-rows: auto auto; gap: 11px; }
      .cart-item > img { grid-column: 1; grid-row: 1 / 3; width: 68px; height: 68px; }
      .cart-item-info { grid-column: 2; grid-row: 1; min-width: 0; }
      .cart-item-info h2 { overflow-wrap: anywhere; }
      .cart-item-info p, .cart-item-info strong { display: none; }
      .quantity-control { grid-column: 2; grid-row: 2; width: max-content; }
      .line-total { grid-column: 3; grid-row: 2; justify-self: end; }
      .remove-item { grid-column: 3; grid-row: 1; }
    }
  `]
})
export class CartComponent {
  protected readonly cart = inject(CartService);

  protected sizeLabel(size: ProductSize): string { return size === 'medio' ? 'médio' : size; }

  protected whatsappLink(): string {
    const items = this.cart.items().map(({ product, quantity, size }) => `${quantity}x ${product.name}${size ? ` (${this.sizeLabel(size)})` : ''}`).join(', ');
    const message = encodeURIComponent(`Olá! Gostaria de fazer este pedido: ${items}. Total: ${this.cart.total().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
    return `https://wa.me/5511999999999?text=${message}`;
  }
}