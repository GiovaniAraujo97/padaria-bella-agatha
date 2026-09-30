import { CurrencyPipe, isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, inject, input, output, PLATFORM_ID, signal, ViewChild } from '@angular/core';
import { Product, ProductSelection, ProductSize } from '../../../core/interfaces/product.interface';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CurrencyPipe],
  template: `
    <article class="product-card" (click)="openDetails()">
    <button type="button" class="product-image-wrap" [attr.aria-label]="'Ver detalhes de ' + product().name"><img [src]="product().image" [alt]="product().name" loading="lazy"><span class="product-tag">{{ product().available === false ? 'Indisponível' : product().featured ? 'Destaque' : 'Disponível' }}</span></button>
      <div class="product-info">
        <h3>{{ product().name }}</h3><p>{{ product().description }}</p>
        <div class="product-bottom"><strong>{{ hasSizeOptions() ? 'A partir de ' : '' }}{{ startingPrice() | currency:'BRL' }}</strong><button class="add-button" (click)="handleAdd($event)" [attr.aria-label]="product().available === false ? 'Ver detalhes de ' + product().name : hasSizeOptions() ? 'Escolher tamanho de ' + product().name : 'Ver detalhes de ' + product().name"><span class="material-symbols-outlined">{{ hasSizeOptions() ? 'tune' : 'add' }}</span></button></div>
      </div>
    </article>
    @if (dialogOpen()) {
      <dialog #sizeDialog class="size-dialog" [attr.aria-labelledby]="'size-dialog-title-' + product().id" (click)="closeOnBackdrop($event)" (close)="dialogOpen.set(false)">
        <div class="size-dialog-layout">
          <div class="size-dialog-image"><img [src]="product().image" [alt]="product().name"></div>
          <div class="size-dialog-details">
            <button type="button" class="dialog-close" (click)="closeSizeDialog()" aria-label="Fechar detalhes"><span class="material-symbols-outlined" aria-hidden="true">close</span></button>
            <span class="eyebrow">{{ product().available === false ? 'Indisponível no momento' : 'Disponível' }}</span>
            <h2 [id]="'size-dialog-title-' + product().id">{{ product().name }}</h2>
            <p class="dialog-description">{{ product().description }}</p>
            @if (hasSizeOptions()) {
              <fieldset class="size-picker">
                <legend>Escolha o tamanho</legend>
                <div class="size-options">
                  @for (option of availableSizeOptions(); track option.value) {
                    <button type="button" class="size-option" [class.is-selected]="selectedSize() === option.value" [attr.aria-pressed]="selectedSize() === option.value" (click)="selectedSize.set(option.value)"><span>{{ option.label }}</span><strong>{{ product().sizePrices?.[option.value] | currency:'BRL' }}</strong></button>
                  }
                </div>
              </fieldset>
              <p class="price-note">Preços provisórios</p>
            } @else {
              <p class="dialog-price">{{ product().price | currency:'BRL' }}</p>
            }
            <button type="button" class="button modal-add" (click)="addSelectedSize()" [disabled]="product().available === false"><span class="material-symbols-outlined" aria-hidden="true">add_shopping_cart</span>{{ product().available === false ? 'Indisponível' : 'Adicionar ao carrinho' }} <strong>{{ selectedPrice() | currency:'BRL' }}</strong></button>
          </div>
        </div>
      </dialog>
    }
  `,
  styles: [`
    :host { display: block; }
    .product-card { overflow: hidden; height: 100%; border: 1px solid #eae4dc; background: #fff; transition: border-color .2s, box-shadow .2s; }
    .product-card:hover, .product-card:has(.product-image-wrap:focus-visible) { border-color: #c9a878; box-shadow: 0 8px 20px #39281918; }
    .product-image-wrap { position: relative; display: block; overflow: hidden; width: 100%; padding: 0; border: 0; aspect-ratio: 1.55; background: #eee8df; text-align: left; }
    .product-image-wrap:not(:disabled) { cursor: pointer; }
    .product-image-wrap img { width: 100%; height: 100%; object-fit: cover; transition: transform .45s; }
    .product-image-wrap:not(:disabled):hover img { transform: scale(1.04); }
    .product-tag { position: absolute; top: 12px; left: 12px; padding: 6px 9px; background: #fffdf8ed; color: var(--cocoa); font-size: .65rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; }
    .size-dialog { width: min(760px, calc(100% - 32px)); max-width: 760px; max-height: min(680px, calc(100dvh - 32px)); padding: 0; overflow: auto; border: 1px solid #e8dfd4; border-radius: 8px; background: #faf8f4; color: var(--ink); box-shadow: 0 24px 70px #20160f40; }
    .size-dialog::backdrop { background: #21170fd1; backdrop-filter: blur(3px); }
    .size-dialog-layout { display: grid; grid-template-columns: 1fr 1fr; min-height: 440px; }
    .size-dialog-image { min-height: 100%; background: #eee8df; }
    .size-dialog-image img { width: 100%; height: 100%; object-fit: cover; }
    .size-dialog-details { position: relative; display: flex; flex-direction: column; justify-content: center; padding: 42px 34px 30px; }
    .dialog-close { position: absolute; top: 12px; right: 12px; display: grid; box-sizing: border-box; width: 36px; height: 36px; place-items: center; overflow: hidden; border: 1px solid #e7ded3; border-radius: 50%; background: #fff; color: var(--cocoa); cursor: pointer; line-height: 1; transition: background .2s, border-color .2s, color .2s; }
    .dialog-close .material-symbols-outlined { display: block; font-size: 20px; line-height: 1; }
    .dialog-close:hover, .dialog-close:focus-visible { border-color: var(--cocoa); background: var(--cocoa); color: #fff; }
    .size-dialog-details > .eyebrow { font-size: .62rem; }
    .size-dialog-details h2 { margin: 12px 32px 8px 0; color: var(--cocoa); font: 600 1.65rem/1.2 'Aboreto', sans-serif; }
    .dialog-description { margin: 0; color: #756a60; font-size: .84rem; line-height: 1.65; }
    .dialog-price { margin: 18px 0 0; color: var(--cocoa); font-size: 1.15rem; font-weight: 700; }
    .size-picker { min-width: 0; margin: 22px 0 0; padding: 0; border: 0; }
    .size-picker legend { margin-bottom: 9px; color: var(--cocoa); font-size: .78rem; font-weight: 700; }
    .size-options { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 7px; }
    .size-option { display: flex; min-width: 0; min-height: 58px; flex-direction: column; align-items: center; justify-content: center; gap: 4px; padding: 6px 3px; border: 1px solid #ddd2c5; border-radius: 3px; background: #fff; color: #6c5b4b; cursor: pointer; }
    .size-option span { font-size: .7rem; }
    .size-option strong { font-size: .7rem; white-space: nowrap; }
    .size-option.is-selected { border-color: var(--cocoa); background: var(--cocoa); color: #fff; }
    .price-note { margin: 9px 0 0; color: #8a7b6b; font-size: .65rem; }
    .modal-add { display: flex; width: 100%; min-height: 46px; align-items: center; gap: 8px; margin-top: 18px; padding-inline: 12px; font-size: .75rem; }
    .modal-add > strong { margin-left: auto; white-space: nowrap; }
    .modal-add .material-symbols-outlined { font-size: 19px; }
    .product-info { padding: 12px; }
    h3 { margin: 9px 0 5px; color: rgb(92, 64, 51); font: 700 16px/19px 'Nunito', sans-serif; }
    p { min-height: 38px; margin: 0; color: #80776e; font-size: .78rem; line-height: 1.5; }
    .product-bottom { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; }
    .product-bottom strong { color: var(--cocoa); font-size: 1rem; }
    .add-button { display: grid; width: 36px; height: 36px; place-items: center; border: 0; border-radius: 50%; background: var(--cocoa); color: #fff; cursor: pointer; transition: background .2s, transform .2s; }
    .add-button:hover { transform: rotate(90deg); background: var(--cocoa-light); }
    .add-button:disabled { transform: none; background: #9a9188; cursor: not-allowed; }
    @media (max-width: 700px) {
      .product-image-wrap { aspect-ratio: 1.25; }
      .product-tag { top: 7px; left: 7px; padding: 4px 6px; font-size: .52rem; letter-spacing: .05em; }
      .product-info { padding: 8px; }
      h3 { display: -webkit-box; min-height: 32px; overflow: hidden; margin: 5px 0 4px; font-size: 13px; line-height: 16px; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
      .product-info > p { display: none; }
      .product-bottom { min-height: 30px; gap: 5px; margin-top: 7px; }
      .product-bottom strong { max-width: calc(100% - 35px); font-size: .75rem; line-height: 1.2; white-space: normal; }
      .add-button { width: 30px; height: 30px; flex: 0 0 auto; padding: 0; place-items: center; line-height: 1; }
      .add-button .material-symbols-outlined { display: block; width: 18px; height: 18px; font-size: 18px; line-height: 18px; }
    }
    @media (max-width: 620px) {
      .size-dialog { width: min(520px, calc(100% - 24px)); max-height: calc(100dvh - 24px); }
      .size-dialog-layout { grid-template-columns: minmax(0, 1fr); min-height: 0; }
      .size-dialog-image { height: clamp(130px, 22vh, 180px); min-height: 0; max-height: none; aspect-ratio: auto; }
      .size-dialog-details { justify-content: flex-start; padding: 22px 18px 18px; }
      .dialog-close { top: 8px; right: 8px; width: 32px; height: 32px; }
      .size-dialog-details h2 { margin: 9px 38px 7px 0; font-size: 1.35rem; }
      .dialog-description { font-size: .78rem; line-height: 1.45; }
      .size-picker { margin-top: 15px; }
      .size-options { gap: 5px; }
      .size-option { min-height: 50px; }
      .modal-add { min-height: 44px; margin-top: 13px; }
    }
    @media (prefers-reduced-motion: reduce) { .product-image-wrap img, .add-button { transition: none; } }
  `]
})
export class ProductCardComponent {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private dialogElement?: HTMLDialogElement;

  readonly product = input.required<Product>();
  readonly add = output<ProductSelection>();
  protected readonly dialogOpen = signal(false);
  protected readonly selectedSize = signal<ProductSize>('medio');
  protected readonly sizeOptions = [
    { value: 'pequeno' as const, label: 'Pequeno' },
    { value: 'medio' as const, label: 'Médio' },
    { value: 'grande' as const, label: 'Grande' }
  ];

  @ViewChild('sizeDialog')
  set sizeDialog(ref: ElementRef<HTMLDialogElement> | undefined) {
    this.dialogElement = ref?.nativeElement;
    if (this.isBrowser && this.dialogElement && !this.dialogElement.open) this.dialogElement.showModal();
  }

  protected hasSizeOptions(): boolean {
    const product = this.product();
    return product.categoryHasSizes !== false && !!product.sizePrices && Object.keys(product.sizePrices).length > 0;
  }

  protected startingPrice(): number {
    const prices = this.product().sizePrices;
    return this.hasSizeOptions() && prices ? Math.min(...Object.values(prices)) : this.product().price;
  }

  protected availableSizeOptions() {
    const prices = this.product().sizePrices;
    return this.sizeOptions.filter((option) => typeof prices?.[option.value] === 'number');
  }

  protected selectedPrice(): number {
    return this.product().sizePrices?.[this.selectedSize()] ?? this.product().price;
  }

  protected openDetails(): void {
    if (this.hasSizeOptions()) this.selectedSize.set(this.availableSizeOptions()[0].value);
    this.dialogOpen.set(true);
  }

  protected handleAdd(event: MouseEvent): void {
    event.stopPropagation();
    this.openDetails();
  }

  protected addSelectedSize(): void {
    const selection = this.hasSizeOptions()
      ? { product: this.product(), size: this.selectedSize(), price: this.selectedPrice() }
      : { product: this.product(), price: this.product().price };
    this.add.emit(selection);
    this.closeSizeDialog();
  }

  protected closeSizeDialog(): void {
    this.dialogElement?.close();
    this.dialogOpen.set(false);
  }

  protected closeOnBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.closeSizeDialog();
  }
}