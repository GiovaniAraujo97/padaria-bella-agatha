import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { afterNextRender, Component, computed, ElementRef, inject, Injector, signal, ViewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { ProductSize } from '../../core/interfaces/product.interface';
import { AdminCategory, AdminProduct, AdminService, CategoryInput } from '../../core/services/admin.service';

type ProductDraft = Omit<AdminProduct, 'id'>;
type CategoryDraft = CategoryInput;

const emptyProduct = (): ProductDraft => ({
  name: '', description: '', price: 0, category: '', categoryId: 0, image: '', featured: false,
  available: true, published: false, displayOrder: 0, sizePrices: {}
});
const emptyCategory = (): CategoryDraft => ({ name: '', hasSizes: false });

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, CdkDropList, CdkDrag],
  template: `
    <section class="admin-page">
      <header class="admin-header"><div><span class="eyebrow">Bella Agatha <span class="admin-label">· Painel interno</span></span><h1>Gerenciar catálogo</h1></div><button type="button" class="text-button exit-button" (click)="logout()"><span class="material-symbols-outlined" aria-hidden="true">logout</span>Sair</button></header>
      <nav class="admin-tabs" aria-label="Seções administrativas"><button type="button" [class.active]="section() === 'products'" (click)="section.set('products')"><span>Produtos</span><span class="tab-count">{{ products().length }}</span></button><button type="button" [class.active]="section() === 'categories'" (click)="section.set('categories')"><span>Categorias</span><span class="tab-count">{{ categories().length }}</span></button></nav>
      @if (message()) { <p class="notice" role="status"><span class="material-symbols-outlined" aria-hidden="true">check_circle</span>{{ message() }}</p> }
      @if (error() && !unavailable()) { <p class="error-notice" role="alert"><span class="material-symbols-outlined" aria-hidden="true">error</span>{{ error() }}</p> }

      @if (unavailable()) {
        <section class="connection-state" role="alert"><span class="material-symbols-outlined" aria-hidden="true">database_off</span><div><h2>Catálogo desconectado</h2><p>{{ error() }}</p><p>Configure o PostgreSQL e aplique a migration do catálogo para gerenciar produtos e categorias.</p><button type="button" class="retry-button" (click)="retry()"><span class="material-symbols-outlined" aria-hidden="true">refresh</span>Tentar novamente</button></div></section>
      } @else if (section() === 'products') {
        <div class="section-heading"><div><h2>Produtos</h2><p>Edite preços, tamanhos, disponibilidade e publicação.</p><label class="admin-search"><span class="material-symbols-outlined" aria-hidden="true">search</span><input type="search" [ngModel]="searchTerm()" (ngModelChange)="updateSearch($event)" placeholder="Buscar produtos" aria-label="Buscar produtos"></label></div><button class="button" type="button" (click)="newProduct()"><span class="material-symbols-outlined" aria-hidden="true">add</span>Novo produto</button></div>
        @if (editingProduct()) {
          <form #productEditor class="editor" #productForm="ngForm">
            <div class="editor-title"><h3>{{ productId() ? 'Editar produto' : 'Novo produto' }}</h3><button type="button" class="icon-button" aria-label="Fechar formulário" (click)="cancelProduct()"><span class="material-symbols-outlined">close</span></button></div>
            <div class="form-grid">
              <label>Nome<input name="name" [(ngModel)]="draft.name" required maxlength="120"></label>
              <label>Categoria<select name="categoryId" [(ngModel)]="draft.categoryId" required><option [ngValue]="0" disabled>Selecione</option>@for (category of categories(); track category.id) { <option [ngValue]="category.id">{{ category.name }}</option> }</select></label>
              <label class="span-two">Descrição<textarea name="description" [(ngModel)]="draft.description" maxlength="2000" rows="3"></textarea></label>
              <label>Preço base<input name="price" [ngModel]="basePriceInput" (ngModelChange)="updateBasePrice($event)" type="text" inputmode="decimal" placeholder="0,00" required></label>
              <label class="span-two">URL da imagem<input name="image" [(ngModel)]="draft.image" type="text" pattern="(/(?!/).+|https://.+)" maxlength="2048" placeholder="https://... ou /images/produto.jpg" required></label>
              @if (categoryAllowsSizes()) { <fieldset class="span-two size-fields"><legend>Tamanhos disponíveis</legend><div class="size-checks">@for (size of sizeOptions; track size.key) { <label class="size-check"><input type="checkbox" [checked]="isSizeSelected(size.key)" (change)="toggleSize(size.key, $any($event.target).checked)">{{ size.label }}</label> }</div><div class="size-prices">@for (size of sizeOptions; track size.key) { @if (isSizeSelected(size.key)) { <label>Preço {{ size.label }}<input #sizePriceInput [name]="'sizePrice-' + size.key" [ngModel]="sizePriceInputs[size.key] ?? ''" (ngModelChange)="updateSizePrice(size.key, $event, sizePriceInput)" type="text" inputmode="decimal" placeholder="0,00" required></label> } }</div></fieldset> }
              <div class="toggles span-two"><label><input name="featured" [(ngModel)]="draft.featured" type="checkbox"> Destaque</label><label><input name="available" [(ngModel)]="draft.available" type="checkbox"> Disponível</label><label><input name="published" [(ngModel)]="draft.published" type="checkbox"> Publicado</label></div>
            </div>
            <div class="form-actions"><button type="button" class="button button--outline" (click)="cancelProduct()">Cancelar</button><button type="button" class="button" [disabled]="saving()" (click)="saveProduct(productForm)">{{ saving() ? 'Salvando...' : 'Salvar produto' }}</button></div>
          </form>
        }
        @if (loading()) { <p class="loading" role="status"><span class="material-symbols-outlined" aria-hidden="true">progress_activity</span>Carregando produtos...</p> }
        @else if (!products().length) { <div class="empty-state"><span class="material-symbols-outlined" aria-hidden="true">inventory_2</span><div class="empty-copy"><h3>Nenhum produto cadastrado</h3><p>Adicione o primeiro produto para começar a montar o cardápio.</p></div></div> }
        @else {
          <div class="table-wrap"><table><thead><tr><th>Produto</th><th>Categoria</th><th>Preço</th><th>Visibilidade</th><th>Ações</th></tr></thead><tbody>
            @for (product of paginatedProducts(); track product.id; let index = $index) { <tr [class.category-start]="index > 0 && product.categoryId !== paginatedProducts()[index - 1].categoryId"><td><div class="product-cell"><img [src]="product.image" [alt]="''" loading="lazy"><strong>{{ product.name }}</strong></div></td><td>{{ categoryName(product.categoryId) }}</td><td>{{ product.price | currency:'BRL' }}</td><td><span class="state" [class.is-muted]="!product.published || !product.available">{{ product.published ? (product.available ? 'Publicado' : 'Indisponível') : 'Rascunho' }}</span></td><td><div class="row-actions"><button type="button" class="icon-button" [attr.aria-label]="'Editar ' + product.name" (click)="editProduct(product)"><span class="material-symbols-outlined">edit</span></button><button type="button" class="icon-button danger" [attr.aria-label]="'Excluir ' + product.name" (click)="deleteProduct(product)"><span class="material-symbols-outlined">delete</span></button></div></td></tr> }
          </tbody></table></div>
          @if (productPageCount() > 1) { <nav class="pagination" aria-label="Paginação de produtos"><button type="button" class="icon-button" [disabled]="productPage() === 1" aria-label="Página anterior" (click)="changeProductPage(-1)"><span class="material-symbols-outlined">chevron_left</span></button><span>Página {{ productPage() }} de {{ productPageCount() }}</span><button type="button" class="icon-button" [disabled]="productPage() === productPageCount()" aria-label="Próxima página" (click)="changeProductPage(1)"><span class="material-symbols-outlined">chevron_right</span></button></nav> }
        }
      } @else {
        <div class="section-heading"><div><h2>Categorias</h2><p>Organize as seções do cardápio público.</p><label class="admin-search"><span class="material-symbols-outlined" aria-hidden="true">search</span><input type="search" [ngModel]="searchTerm()" (ngModelChange)="updateSearch($event)" placeholder="Buscar categorias" aria-label="Buscar categorias"></label></div><button class="button" type="button" (click)="newCategory()"><span class="material-symbols-outlined" aria-hidden="true">add</span>Nova categoria</button></div>
        @if (editingCategory()) {
          <form #categoryEditor class="editor" #categoryForm="ngForm" (ngSubmit)="saveCategory(categoryForm)">
            <div class="editor-title"><h3>{{ categoryId() ? 'Editar categoria' : 'Nova categoria' }}</h3><button type="button" class="icon-button" aria-label="Fechar formulário" (click)="cancelCategory()"><span class="material-symbols-outlined">close</span></button></div>
            <div class="form-grid category-form-grid"><label>Nome<input name="name" [(ngModel)]="categoryDraft.name" required maxlength="100"></label><div class="toggles"><label><input name="hasSizes" [(ngModel)]="categoryDraft.hasSizes" type="checkbox"> Permite tamanhos diferentes</label></div></div>
            <div class="form-actions"><button type="button" class="button button--outline" (click)="cancelCategory()">Cancelar</button><button type="submit" class="button" [disabled]="categoryForm.invalid || saving()">{{ saving() ? 'Salvando...' : 'Salvar categoria' }}</button></div>
          </form>
        }
        @if (loading()) { <p class="loading" role="status"><span class="material-symbols-outlined" aria-hidden="true">progress_activity</span>Carregando categorias...</p> }
        @else if (!categories().length) { <div class="empty-state"><span class="material-symbols-outlined" aria-hidden="true">category</span><div class="empty-copy"><h3>Nenhuma categoria cadastrada</h3><p>Crie categorias para organizar o cardápio público.</p></div></div> }
        @else { <div class="category-list">@for (category of paginatedCategories(); track category.id) { <article><span class="material-symbols-outlined" aria-hidden="true">{{ category.hasSizes ? 'straighten' : 'bakery_dining' }}</span><div><strong>{{ category.name }}</strong><small>{{ category.hasSizes ? 'Permite tamanhos diferentes' : 'Tamanho único' }}</small></div><button type="button" class="icon-button" [attr.aria-label]="'Editar categoria ' + category.name" (click)="editCategory(category)"><span class="material-symbols-outlined">edit</span></button><button type="button" class="icon-button danger" [attr.aria-label]="'Excluir categoria ' + category.name" (click)="deleteCategory(category)"><span class="material-symbols-outlined">delete</span></button></article> }</div> }
        @if (categoryPageCount() > 1) { <nav class="pagination" aria-label="Paginação de categorias"><button type="button" class="icon-button" [disabled]="categoryPage() === 1" aria-label="Página anterior" (click)="changeCategoryPage(-1)"><span class="material-symbols-outlined">chevron_left</span></button><span>Página {{ categoryPage() }} de {{ categoryPageCount() }}</span><button type="button" class="icon-button" [disabled]="categoryPage() === categoryPageCount()" aria-label="Próxima página" (click)="changeCategoryPage(1)"><span class="material-symbols-outlined">chevron_right</span></button></nav> }
      }
      @if (!unavailable() && categories().length) {
        <section class="category-order-section" aria-labelledby="category-order-title">
          <div class="category-order-heading"><div><h2 id="category-order-title">Ordem das categorias</h2><p>Essa sequência define a posição das categorias na página de produtos.</p></div>@if (savingCategoryOrder()) { <span role="status">Salvando...</span> }</div>
          <div class="category-order-list" cdkDropList [cdkDropListData]="categories()" (cdkDropListDropped)="dropCategory($event)">
            @for (category of categories(); track category.id; let index = $index) {
              <article class="category-order-item" cdkDrag [cdkDragData]="category">
                <span class="drag-handle" aria-hidden="true"><span class="material-symbols-outlined">drag_indicator</span></span>
                <span class="category-order-number">{{ index + 1 }}</span><strong>{{ category.name }}</strong>
                <div class="category-order-actions"><button type="button" class="icon-button" [disabled]="index === 0 || savingCategoryOrder()" [attr.aria-label]="'Mover ' + category.name + ' para cima'" (click)="moveCategory(index, -1)"><span class="material-symbols-outlined" aria-hidden="true">arrow_upward</span></button><button type="button" class="icon-button" [disabled]="index === categories().length - 1 || savingCategoryOrder()" [attr.aria-label]="'Mover ' + category.name + ' para baixo'" (click)="moveCategory(index, 1)"><span class="material-symbols-outlined" aria-hidden="true">arrow_downward</span></button></div>
              </article>
            }
          </div>
        </section>
      }
    </section>
  `,
  styles: [`
    .admin-page { width: min(1240px, calc(100% - 48px)); min-height: 70vh; margin: 0 auto; padding: 50px 0 90px; }
    .admin-header, .section-heading, .editor-title { display: flex; align-items: center; justify-content: space-between; gap: 20px; }
    .admin-header h1 { margin: 10px 0 24px; color: var(--cocoa); font: 600 2.2rem/1.15 'Aboreto', sans-serif; }
    .text-button { padding: 9px 15px; border: 1px solid var(--line); background: #fff; color: var(--cocoa); cursor: pointer; }
    .admin-tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--line); }
    .admin-tabs button { display: inline-flex; align-items: center; gap: 9px; padding: 13px 17px; border: 0; border-bottom: 2px solid transparent; background: transparent; color: var(--muted); cursor: pointer; }
    .admin-tabs button.active { border-color: var(--honey); color: var(--cocoa); font-weight: 700; }
    .admin-tabs span { color: #96887b; font-size: .75rem; }
    .section-heading { margin: 30px 0 20px; }
    .section-heading h2 { margin: 0 0 4px; color: var(--cocoa); font: 600 1.55rem 'Aboreto', sans-serif; }
    .section-heading p { margin: 0; color: var(--muted); font-size: .85rem; }
    .section-heading .button, .form-actions .button { min-height: 42px; }
    .notice, .error-notice { margin: 18px 0; padding: 12px 15px; border-left: 3px solid #69866b; background: #fff; color: #385940; }
    .error-notice { border-color: #b65343; color: #8f3227; }
    .editor { scroll-margin-top: 24px; margin: 20px 0 28px; padding: 22px; border: 1px solid var(--line); background: #fff; }
    .editor-title { margin-bottom: 18px; }
    .editor-title h3 { margin: 0; color: var(--cocoa); font: 600 1.2rem 'Aboreto', sans-serif; }
    .form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
    .form-grid > label { display: grid; gap: 6px; color: var(--cocoa); font-size: .82rem; font-weight: 700; }
    input:not([type=checkbox]), textarea, select { width: 100%; min-width: 0; min-height: 42px; padding: 9px 11px; border: 1px solid #ded6cb; border-radius: 2px; background: var(--paper); color: var(--ink); font: 400 .9rem var(--sans); }
    input[type=checkbox] { width: 20px; height: 20px; flex: 0 0 auto; accent-color: var(--cocoa); cursor: pointer; }
    textarea { resize: vertical; }
    input:focus, textarea:focus, select:focus { outline: 2px solid var(--honey); outline-offset: 1px; }
    .span-two { grid-column: span 2; }
    .size-fields { display: grid; grid-template-columns: 1fr; gap: 12px; margin: 0; padding: 14px; border: 1px solid var(--line); }
    .size-fields legend { padding: 0 6px; color: var(--cocoa); font-size: .8rem; font-weight: 700; }
    .size-checks { display: flex; flex-wrap: wrap; gap: 16px; }
    .size-check { display: inline-flex; align-items: center; gap: 7px; color: var(--cocoa); font-size: .82rem; }
    .size-check input { margin: 0; }
    .size-prices { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
    .size-prices label { display: grid; gap: 6px; color: var(--muted); font-size: .78rem; }
    .toggles { display: flex; flex-wrap: wrap; gap: 18px; align-items: center; }
    .toggles label { display: inline-flex; align-items: center; gap: 7px; color: var(--cocoa); font-size: .85rem; }
    .form-actions { display: flex; justify-content: flex-end; gap: 9px; margin-top: 20px; }
    .table-wrap { overflow-x: auto; border: 1px solid var(--line); background: #fff; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th, td { padding: 12px 14px; border-bottom: 1px solid var(--line); font-size: .84rem; white-space: nowrap; }
    th { background: #f4f0e9; color: var(--cocoa); font-size: .75rem; }
    tbody tr:last-child td { border-bottom: 0; }
    tbody tr.category-start td { border-top: 3px solid #eee8df; }
    .product-cell { display: flex; align-items: center; gap: 10px; }
    .product-cell img { width: 44px; height: 40px; object-fit: cover; background: var(--paper); }
    .state { padding: 4px 8px; background: #e7efe7; color: #456547; font-size: .72rem; }
    .state.is-muted { background: #f2ede6; color: #776d63; }
    .row-actions { display: flex; gap: 5px; }
    .icon-button { width: 34px; height: 34px; border: 1px solid var(--line); background: #fff; color: var(--cocoa); cursor: pointer; }
    .icon-button .material-symbols-outlined { font-size: 19px; }
    .icon-button.danger { color: #a43f32; }
    .category-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px; }
    .category-list article { display: flex; min-width: 0; align-items: center; gap: 10px; padding: 12px; border: 1px solid var(--line); background: #fff; }
    .category-list article > .material-symbols-outlined { color: #a9814b; }
    .category-list article > div { display: grid; min-width: 0; flex: 1; gap: 3px; }
    .category-list small { overflow: hidden; color: var(--muted); text-overflow: ellipsis; }
    .pagination { display: flex; align-items: center; justify-content: center; gap: 14px; margin-top: 18px; color: var(--muted); font-size: .8rem; }
    .pagination .icon-button:disabled { opacity: .45; cursor: not-allowed; }
    .empty, .loading { padding: 28px; background: #fff; color: var(--muted); text-align: center; }
    .admin-page { padding-top: 42px; }
    .admin-header { min-height: 108px; margin-bottom: 24px; padding: 0 0 22px; border-bottom: 1px solid var(--line); }
    .admin-header h1 { margin: 11px 0 0; font-size: 2.05rem; }
    .admin-label { color: #9a8c7c; font-size: .67rem; font-weight: 500; letter-spacing: .04em; }
    .exit-button { display: inline-flex; align-items: center; gap: 8px; min-height: 40px; padding: 0 13px; }
    .exit-button .material-symbols-outlined { font-size: 19px; }
    .admin-tabs { width: fit-content; gap: 5px; padding: 5px; border: 1px solid #e7dfd4; background: #f1ece5; }
    .admin-tabs button { min-width: 146px; justify-content: space-between; padding: 11px 13px; border: 0; color: #71685f; font-size: .86rem; }
    .admin-tabs button.active { background: var(--cocoa); color: #fff; }
    .admin-tabs button.active > span { color: #fff; }
    .admin-tabs .tab-count { display: inline-grid; min-width: 23px; height: 23px; place-items: center; border-radius: 50%; background: #e9e2d8; color: var(--cocoa); font-size: .72rem; }
    .admin-tabs button.active .tab-count { background: #ffffff26; color: #fff; }
    .section-heading { max-width: none; margin-top: 32px; padding-bottom: 17px; border-bottom: 1px solid var(--line); font: inherit; }
    .section-heading h2 { font-size: 1.65rem; }
    .section-heading p { margin-top: 5px; }
    .admin-search { position: relative; display: block; width: min(100%, 360px); margin-top: 14px; }
    .admin-search .material-symbols-outlined { position: absolute; top: 50%; left: 11px; color: var(--muted); font-size: 19px; transform: translateY(-50%); }
    .admin-search input { min-height: 38px; padding-left: 38px; background: #fff; }
    .section-heading .button { flex: 0 0 auto; padding-inline: 16px; font: 600 .9rem/1 var(--sans); white-space: nowrap; }
    .notice, .error-notice { display: flex; align-items: center; gap: 10px; padding: 13px 15px; }
    .notice .material-symbols-outlined, .error-notice .material-symbols-outlined { font-size: 20px; }
    .connection-state, .empty-state { display: flex; align-items: center; gap: 20px; margin-top: 28px; padding: 30px; border: 1px solid var(--line); background: #fff; }
    .connection-state { border-left: 4px solid #b65343; background: #fffaf8; }
    .connection-state > .material-symbols-outlined, .empty-state > .material-symbols-outlined { flex: 0 0 auto; color: #a9814b; font-size: 34px; }
    .connection-state > .material-symbols-outlined { color: #a43f32; }
    .connection-state h2, .empty-state h3 { margin: 0 0 7px; color: var(--cocoa); font: 600 1.2rem 'Aboreto', sans-serif; }
    .connection-state p, .empty-state p { margin: 4px 0 0; color: var(--muted); font-size: .88rem; line-height: 1.6; }
    .empty-state { min-height: 190px; }
    .empty-copy { min-width: 0; }
    .loading { display: flex; align-items: center; justify-content: center; gap: 9px; margin-top: 24px; }
    .loading .material-symbols-outlined { animation: spin 1.2s linear infinite; font-size: 20px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (max-width: 700px) {
      .admin-page { width: min(100% - 36px, 1240px); padding-top: 32px; }
      .admin-header h1 { font-size: 1.7rem; }
      .admin-header { min-height: 0; align-items: flex-end; }
      .admin-label { display: block; margin-top: 5px; }
      .admin-tabs { display: grid; width: 100%; grid-template-columns: 1fr 1fr; }
      .admin-tabs button { min-width: 0; }
      .section-heading { align-items: flex-start; flex-direction: column; }
      .form-grid { grid-template-columns: 1fr; }
      .span-two { grid-column: auto; }
      .size-fields { grid-template-columns: 1fr; }
      .category-list { grid-template-columns: 1fr; }
      .editor { padding: 16px; }
      .table-wrap table { min-width: 650px; }
      .form-actions { flex-direction: column-reverse; }
      .form-actions .button { width: 100%; }
      .connection-state, .empty-state { align-items: flex-start; flex-direction: column; gap: 12px; padding: 22px; }
    }
  `]
})
export class AdminComponent {
  private readonly admin = inject(AdminService);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private noticeTimeout?: ReturnType<typeof setTimeout>;
  @ViewChild('productEditor') private productEditor?: ElementRef<HTMLFormElement>;
  @ViewChild('categoryEditor') private categoryEditor?: ElementRef<HTMLFormElement>;
  protected readonly section = signal<'products' | 'categories'>('products');
  protected readonly products = signal<AdminProduct[]>([]);
  protected readonly categories = signal<AdminCategory[]>([]);
  protected readonly productPage = signal(1);
  protected readonly categoryPage = signal(1);
  protected readonly searchTerm = signal('');
  private readonly pageSize = 10;
  protected readonly tableProducts = computed(() => {
    const categoryOrder = new Map(this.categories().map((category, index) => [category.id, index]));
    return [...this.products()].sort((first, second) =>
      (categoryOrder.get(first.categoryId) ?? Number.MAX_SAFE_INTEGER)
        - (categoryOrder.get(second.categoryId) ?? Number.MAX_SAFE_INTEGER)
      || first.displayOrder - second.displayOrder
      || first.name.localeCompare(second.name)
    );
  });
  protected readonly filteredProducts = computed(() => {
    const term = this.searchTerm().trim().toLocaleLowerCase('pt-BR');
    if (!term) return this.tableProducts();
    return this.tableProducts().filter((product) => `${product.name} ${product.description} ${this.categoryName(product.categoryId)}`.toLocaleLowerCase('pt-BR').includes(term));
  });
  protected readonly productPageCount = computed(() => Math.max(1, Math.ceil(this.filteredProducts().length / this.pageSize)));
  protected readonly paginatedProducts = computed(() => {
    const start = (this.productPage() - 1) * this.pageSize;
    return this.filteredProducts().slice(start, start + this.pageSize);
  });
  protected readonly filteredCategories = computed(() => {
    const term = this.searchTerm().trim().toLocaleLowerCase('pt-BR');
    if (!term) return this.categories();
    return this.categories().filter((category) => category.name.toLocaleLowerCase('pt-BR').includes(term));
  });
  protected readonly categoryPageCount = computed(() => Math.max(1, Math.ceil(this.filteredCategories().length / this.pageSize)));
  protected readonly paginatedCategories = computed(() => {
    const start = (this.categoryPage() - 1) * this.pageSize;
    return this.filteredCategories().slice(start, start + this.pageSize);
  });
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly savingCategoryOrder = signal(false);
  protected readonly message = signal('');
  protected readonly error = signal('');
  protected readonly unavailable = signal(false);
  protected readonly editingProduct = signal(false);
  protected readonly editingCategory = signal(false);
  protected readonly productId = signal<number | undefined>(undefined);
  protected readonly categoryId = signal<number | undefined>(undefined);
  protected draft = emptyProduct();
  protected categoryDraft = emptyCategory();
  protected basePriceInput = '';
  protected sizePriceInputs: Partial<Record<ProductSize, string>> = {};
  protected readonly selectedSizes = signal<Set<ProductSize>>(new Set());
  protected readonly sizeOptions = [
    { key: 'pequeno', label: 'Pequeno' },
    { key: 'medio', label: 'Médio' },
    { key: 'grande', label: 'Grande' }
  ] as const;

  constructor() { this.refresh(); }

  protected updateSearch(value: string): void {
    this.searchTerm.set(value);
    this.productPage.set(1);
    this.categoryPage.set(1);
  }

  private refresh(): void {
    this.loading.set(true);
    this.unavailable.set(false);
    this.error.set('');
    this.admin.products().subscribe({
      next: (products) => { this.products.set(products); this.productPage.set(1); this.loading.set(false); },
      error: (error) => { this.showError(error); this.loading.set(false); }
    });
    this.admin.categories().subscribe({
      next: (categories) => { this.categories.set(categories); this.categoryPage.set(1); },
      error: (error) => this.showError(error)
    });
  }

  protected newProduct(): void { this.draft = { ...emptyProduct(), categoryId: this.categories()[0]?.id ?? 0 }; this.basePriceInput = ''; this.sizePriceInputs = {}; this.selectedSizes.set(new Set()); this.productId.set(undefined); this.editingProduct.set(true); this.clearNotices(); }
  protected editProduct(product: AdminProduct): void {
    this.draft = { ...product, sizePrices: { ...product.sizePrices } };
    this.basePriceInput = this.formatBasePrice(product.price);
    const selectedSizes = this.sizeOptions.filter((size) => typeof product.sizePrices?.[size.key] === 'number');
    this.selectedSizes.set(new Set(selectedSizes.map((size) => size.key)));
    this.sizePriceInputs = Object.fromEntries(selectedSizes.map((size) => [size.key, this.formatBasePrice(product.sizePrices![size.key]!)]));
    this.productId.set(product.id); this.editingProduct.set(true); this.clearNotices(); this.scrollToEditor();
  }
  protected cancelProduct(): void { this.editingProduct.set(false); this.productId.set(undefined); }
  protected categoryName(id: number): string {
    const name = this.categories().find((category) => category.id === id)?.name ?? '';
    return name ? name[0].toLocaleUpperCase('pt-BR') + name.slice(1) : '';
  }
  protected categoryAllowsSizes(): boolean { return this.categories().find((category) => category.id === Number(this.draft.categoryId))?.hasSizes ?? false; }
  protected isSizeSelected(size: ProductSize): boolean { return this.selectedSizes().has(size); }

  protected toggleSize(size: ProductSize, selected: boolean): void {
    const selectedSizes = new Set(this.selectedSizes());
    const sizePrices = { ...this.draft.sizePrices };
    const sizePriceInputs = { ...this.sizePriceInputs };
    if (selected) {
      selectedSizes.add(size);
      sizePrices[size] = this.draft.price;
      sizePriceInputs[size] = this.formatBasePrice(this.draft.price);
    } else {
      selectedSizes.delete(size);
      delete sizePrices[size];
      delete sizePriceInputs[size];
    }
    this.selectedSizes.set(selectedSizes);
    this.sizePriceInputs = sizePriceInputs;
    this.draft = { ...this.draft, sizePrices };
  }

  protected updateSizePrice(size: ProductSize, value: string, input: HTMLInputElement): void {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    const sizePrices = { ...this.draft.sizePrices };
    if (digits) sizePrices[size] = Number(digits) / 100;
    else delete sizePrices[size];
    this.draft = { ...this.draft, sizePrices };
    const formatted = digits ? this.formatBasePrice(Number(digits) / 100) : '';
    this.sizePriceInputs = { ...this.sizePriceInputs, [size]: formatted };
    input.value = formatted;
    requestAnimationFrame(() => input.setSelectionRange(formatted.length, formatted.length));
  }

  protected updateBasePrice(value: string): void {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    this.draft.price = digits ? Number(digits) / 100 : 0;
    this.basePriceInput = digits ? this.formatBasePrice(this.draft.price) : '';
  }

  private formatBasePrice(value: number): string {
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  }

  protected saveProduct(form: NgForm): void {
    if (this.saving()) return;
    if (!form.valid) {
      form.form.markAllAsTouched();
      const invalidFields = Object.entries(form.controls)
        .filter(([, control]) => control.invalid)
        .map(([name]) => name === 'categoryId' ? 'categoria' : name === 'image' ? 'imagem' : name === 'price' ? 'preço' : name)
        .join(', ');
      this.showNoticeError(`Revise os campos do produto: ${invalidFields || 'há campos inválidos'}.`);
      return;
    }
    this.saving.set(true); this.clearNotices();
    const sizePrices = this.categoryAllowsSizes()
      ? Object.fromEntries(Object.entries(this.draft.sizePrices ?? {}).filter(([, price]) => price !== null && price !== undefined && Number.isFinite(Number(price))).map(([size, price]) => [size, Number(price)]))
      : {};
    const payload = {
      ...this.draft,
      price: Number(this.draft.price),
      categoryId: Number(this.draft.categoryId),
      displayOrder: Number(this.draft.displayOrder) || 0,
      sizePrices
    } as ProductDraft;
    this.admin.saveProduct(payload as AdminProduct, this.productId()).subscribe({
      next: () => { this.showNotice('Produto salvo.'); this.saving.set(false); this.cancelProduct(); this.refresh(); },
      error: (error) => { this.showError(error); this.saving.set(false); }
    });
  }

  protected deleteProduct(product: AdminProduct): void {
    if (!confirm(`Excluir “${product.name}”? Esta ação não pode ser desfeita.`)) return;
    this.clearNotices();
    this.admin.deleteProduct(product.id).subscribe({
      next: () => { this.showNotice('Produto excluído.'); this.refresh(); },
      error: (error) => this.showError(error)
    });
  }

  protected newCategory(): void { this.categoryDraft = emptyCategory(); this.categoryId.set(undefined); this.editingCategory.set(true); this.clearNotices(); }
  protected editCategory(category: AdminCategory): void { this.categoryDraft = { name: category.name, hasSizes: category.hasSizes }; this.categoryId.set(category.id); this.editingCategory.set(true); this.clearNotices(); this.scrollToEditor(); }
  protected cancelCategory(): void { this.editingCategory.set(false); this.categoryId.set(undefined); }

  protected saveCategory(form: { valid: boolean | null }): void {
    if (this.saving()) return;
    if (!form.valid) { this.showNoticeError('Informe o nome da categoria antes de salvar.'); return; }
    this.saving.set(true); this.clearNotices();
    this.admin.saveCategory(this.categoryDraft as CategoryInput, this.categoryId()).subscribe({
      next: () => { this.showNotice('Categoria salva.'); this.saving.set(false); this.cancelCategory(); this.refresh(); },
      error: (error) => { this.showError(error); this.saving.set(false); }
    });
  }

  protected deleteCategory(category: AdminCategory): void {
    if (!confirm(`Excluir a categoria “${category.name}”? Categorias associadas a produtos não podem ser removidas.`)) return;
    this.clearNotices();
    this.admin.deleteCategory(category.id!).subscribe({
      next: () => { this.showNotice('Categoria excluída.'); this.refresh(); },
      error: (error) => this.showError(error)
    });
  }

  protected changeProductPage(direction: -1 | 1): void {
    this.productPage.update((page) => Math.max(1, Math.min(this.productPageCount(), page + direction)));
  }

  protected changeCategoryPage(direction: -1 | 1): void {
    this.categoryPage.update((page) => Math.max(1, Math.min(this.categoryPageCount(), page + direction)));
  }

  protected dropCategory(event: CdkDragDrop<AdminCategory[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    const reordered = [...this.categories()];
    moveItemInArray(reordered, event.previousIndex, event.currentIndex);
    this.saveCategoryOrder(reordered);
  }

  protected moveCategory(index: number, direction: -1 | 1): void {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= this.categories().length) return;
    const reordered = [...this.categories()];
    moveItemInArray(reordered, index, targetIndex);
    this.saveCategoryOrder(reordered);
  }

  private saveCategoryOrder(reordered: AdminCategory[]): void {
    const previous = this.categories();
    const categories = reordered.map((category, index) => ({ ...category, displayOrder: index + 1 }));
    this.categories.set(categories);
    this.savingCategoryOrder.set(true);
    this.clearNotices();
    this.admin.saveCategoryOrder(categories.map((category) => category.id)).subscribe({
      next: () => { this.savingCategoryOrder.set(false); this.showNotice('Ordem das categorias salva.'); },
      error: (error) => { this.categories.set(previous); this.savingCategoryOrder.set(false); this.showError(error); }
    });
  }

  protected logout(): void {
    this.admin.logout().subscribe({ next: () => void this.router.navigateByUrl('/admin/login'), error: () => void this.router.navigateByUrl('/admin/login') });
  }

  protected retry(): void { this.refresh(); }

  private scrollToEditor(): void {
    afterNextRender(() => {
      const editor = this.productEditor?.nativeElement ?? this.categoryEditor?.nativeElement;
      editor?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, { injector: this.injector });
  }

  private showError(error: HttpErrorResponse): void {
    if (error.status === 0 || error.status === 503) this.unavailable.set(true);
    this.showNoticeError(error.error?.error ?? 'Não foi possível concluir a operação.');
  }
  private showNotice(message: string): void {
    this.clearNoticeTimer();
    this.error.set('');
    this.message.set(message);
    this.noticeTimeout = setTimeout(() => this.message.set(''), 5000);
  }

  private showNoticeError(message: string): void {
    this.clearNoticeTimer();
    this.message.set('');
    this.error.set(message);
    this.noticeTimeout = setTimeout(() => this.error.set(''), 5000);
  }

  private clearNotices(): void {
    this.clearNoticeTimer();
    this.message.set('');
    this.error.set('');
  }

  private clearNoticeTimer(): void {
    if (this.noticeTimeout) clearTimeout(this.noticeTimeout);
    this.noticeTimeout = undefined;
  }
}