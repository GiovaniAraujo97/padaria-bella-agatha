import { AfterViewInit, Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { ProductSelection, ProductSize } from '../../core/interfaces/product.interface';
import { CategoryCardComponent } from '../../shared/components/category-card/category-card.component';
import { HeroBannerComponent } from '../../shared/components/hero-banner/hero-banner.component';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { RevealDirective } from '../../shared/directives/reveal.directive';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, MatSnackBarModule, HeroBannerComponent, CategoryCardComponent, ProductCardComponent, RevealDirective],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements AfterViewInit {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly productService = inject(ProductService);
  private readonly cart = inject(CartService);
  private readonly snackBar = inject(MatSnackBar);

  protected get categories() { return this.productService.getCategories(); }
  protected get products() { return this.productService.getFeaturedProducts(); }
  protected get catalogError() { return this.productService.error(); }
  protected readonly reviews = [
    { name: 'Mariana Costa', photo: 'photo-1534528741775-53994a69daeb', text: 'O pão de fermentação natural virou tradição de domingo aqui em casa. Dá para sentir o cuidado em cada detalhe.' },
    { name: 'Rafael Mendes', photo: 'photo-1500648767791-00dcc994a43e', text: 'Encomendei um bolo para o aniversário da minha filha e ficou perfeito. Bonito, fresquinho e delicioso.' },
    { name: 'Camila Nogueira', photo: 'photo-1531123897727-8f129e1688ce', text: 'Atendimento atencioso e produtos impecáveis. O croissant com café é meu ritual favorito da semana.' }
  ];
  protected readonly reviewIndex = signal(0);
  protected readonly firstLineOpacity = signal(0);
  protected readonly secondLineOpacity = signal(0);
  protected readonly firstLineOffset = signal(-56);
  protected readonly secondLineOffset = signal(-56);
  protected readonly featuredLineOpacity = signal(0);
  protected readonly featuredLineOffset = signal(-56);
  protected readonly storyTitleOpacity = signal(0);
  protected readonly storyTitleOffset = signal(16);
  protected readonly storyParagraphOpacity = signal(0);
  protected readonly storyParagraphDepth = signal(-140);
  protected readonly statisticOpacities = signal([0, 0, 0, 0]);
  protected readonly statisticOffsets = signal([24, 24, 24, 24]);
  protected readonly valuesLineOpacities = signal([0, 0]);
  protected readonly valuesLineOffsets = signal([-56, -56]);
  protected readonly valueContentOpacities = signal(Array(12).fill(0));
  protected readonly valueContentOffsets = signal(Array(12).fill(18));
  protected readonly reviewTitleOpacities = signal([0, 0]);
  protected readonly reviewTitleOffsets = signal([-56, -56]);
  protected readonly reviewContentOpacities = signal([0, 0, 0]);
  protected readonly reviewContentOffsets = signal([18, 18, 18]);
  protected readonly reviewArrowOpacities = signal([0, 0]);
  protected readonly reviewArrowOffsets = signal([-24, 24]);

  ngAfterViewInit(): void {
    if (typeof window !== 'undefined') this.onWindowScroll();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    const lines = this.host.nativeElement.querySelectorAll('.category-title-line') as NodeListOf<HTMLElement>;
    const featuredLine = this.host.nativeElement.querySelector('.featured-title-line') as HTMLElement | null;
    const storyLine = this.host.nativeElement.querySelector('.story-title-line') as HTMLElement | null;
    const storyParagraph = this.host.nativeElement.querySelector('.story-copy > p') as HTMLElement | null;
    const statistics = this.host.nativeElement.querySelectorAll('.story-copy .stats-grid > div') as NodeListOf<HTMLElement>;
    const valuesLines = this.host.nativeElement.querySelectorAll('.values-title-line') as NodeListOf<HTMLElement>;
    const reviewLines = this.host.nativeElement.querySelectorAll('.review-title-line') as NodeListOf<HTMLElement>;
    const reviewContents = this.host.nativeElement.querySelectorAll('.review-card > .review-stars, .review-card blockquote, .review-card .review-person') as NodeListOf<HTMLElement>;
    const reviewArrows = this.host.nativeElement.querySelectorAll('.review-arrow') as NodeListOf<HTMLElement>;
    const valueContents = this.host.nativeElement.querySelectorAll('.values-grid .material-symbols-outlined, .values-grid h3, .values-grid p') as NodeListOf<HTMLElement>;
    if (lines.length < 2 || !featuredLine || !storyLine || !storyParagraph || valuesLines.length < 2 || reviewLines.length < 2 || reviewContents.length < 3) return;

    const start = window.innerHeight * 0.92;
    const end = window.innerHeight * 0.58;
    const progressFor = (line: HTMLElement): number => Math.max(0, Math.min(1, (start - line.getBoundingClientRect().top) / (start - end)));
    const firstProgress = progressFor(lines[0]);
    const secondProgress = progressFor(lines[1]);
    const featuredProgress = progressFor(featuredLine);
    const storyProgress = progressFor(storyLine);
    const storyParagraphProgress = progressFor(storyParagraph);
    const valuesLineProgresses = Array.from(valuesLines, progressFor);
    const reviewLineProgresses = Array.from(reviewLines, progressFor);
    const reviewContentProgresses = Array.from(reviewContents, (content, index) => {
      const stageProgress = progressFor(content) * reviewContents.length;
      return Math.max(0, Math.min(1, stageProgress - index));
    });
    const statisticProgresses = Array.from(statistics, (statistic, index) => {
      const stageProgress = progressFor(statistic) * statistics.length;
      return Math.max(0, Math.min(1, stageProgress - index));
    });
    const valueContentProgresses = Array.from(valueContents, progressFor);

    this.firstLineOpacity.set(firstProgress);
    this.secondLineOpacity.set(secondProgress);
    this.firstLineOffset.set(-56 * (1 - firstProgress));
    this.secondLineOffset.set(-56 * (1 - secondProgress));
    this.featuredLineOpacity.set(featuredProgress);
    this.featuredLineOffset.set(-56 * (1 - featuredProgress));
    this.storyTitleOpacity.set(storyProgress);
    this.storyTitleOffset.set(16 * (1 - storyProgress));
    this.storyParagraphOpacity.set(storyParagraphProgress);
    this.storyParagraphDepth.set(-140 * (1 - storyParagraphProgress));
    this.statisticOpacities.set(statisticProgresses);
    this.statisticOffsets.set(statisticProgresses.map((progress) => 24 * (1 - progress)));
    this.valuesLineOpacities.set(valuesLineProgresses);
    this.valuesLineOffsets.set(valuesLineProgresses.map((progress) => -56 * (1 - progress)));
    this.valueContentOpacities.set(valueContentProgresses);
    this.valueContentOffsets.set(valueContentProgresses.map((progress) => 18 * (1 - progress)));
    this.reviewTitleOpacities.set(reviewLineProgresses);
    this.reviewTitleOffsets.set(reviewLineProgresses.map((progress) => -56 * (1 - progress)));
    this.reviewContentOpacities.set(reviewContentProgresses);
    this.reviewContentOffsets.set(reviewContentProgresses.map((progress) => 18 * (1 - progress)));
    const reviewArrowProgresses = Array.from(reviewArrows, (arrow) => progressFor(arrow));
    this.reviewArrowOpacities.set(reviewArrowProgresses);
    this.reviewArrowOffsets.set(reviewArrowProgresses.map((progress, index) => (index === 0 ? -24 : 24) * (1 - progress)));
  }

  protected addToCart(selection: ProductSelection): void {
    this.cart.add(selection.product, selection.size, selection.price);
    const size = selection.size ? ` (${this.sizeLabel(selection.size)})` : '';
    this.snackBar.open(`${selection.product.name}${size} adicionado ao carrinho`, '', { duration: 1800, horizontalPosition: 'end', verticalPosition: 'bottom' });
  }

  private sizeLabel(size: ProductSize): string { return size === 'medio' ? 'médio' : size; }

  protected changeReview(direction: number): void {
    this.reviewIndex.update((index) => (index + direction + this.reviews.length) % this.reviews.length);
  }
}