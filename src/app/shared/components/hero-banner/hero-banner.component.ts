import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-hero-banner',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="hero" [style.opacity]="heroOpacity()">
      <div class="hero-grain"></div>
      <div class="container hero-inner">
        <div class="hero-copy">
          <span class="eyebrow">Padaria artesanal · desde 2004</span>
          <h1>Sabor e tradição<br>em cada <em>receita</em></h1>
          <p>Há mais de 20 anos produzindo pães, bolos, tortas e doces artesanais com ingredientes selecionados.</p>
          <div class="hero-actions"><a routerLink="/produtos" class="button">Faça seu pedido <span class="material-symbols-outlined">arrow_forward</span></a><a routerLink="/sobre" class="text-link">Conheça nossa história <span class="material-symbols-outlined">arrow_outward</span></a></div>
          <div class="hero-note"><span class="material-symbols-outlined">schedule</span><span>Fermentação natural, sem pressa.<br><b>Feito fresco todos os dias.</b></span></div>
        </div>
        <div class="hero-visual">
          <div class="hero-image"><img src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=90" alt="Bolo artesanal de chocolate decorado com frutas" fetchpriority="high"></div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .hero { position: relative; overflow: hidden; min-height: 620px; padding: 54px 0 0; background: #f2ece2; }
    .hero::before { position: absolute; top: -260px; left: -210px; width: 620px; height: 620px; border: 1px solid #b9966624; border-radius: 50%; content: ''; }
    .hero::after { position: absolute; top: -190px; left: -140px; width: 480px; height: 480px; border: 1px solid #b996661f; border-radius: 50%; content: ''; }
    .hero-grain { position: absolute; right: -180px; bottom: 30px; width: 560px; height: 560px; border: 1px solid #b9966624; border-radius: 50%; }
    .hero-inner { position: relative; z-index: 1; display: grid; grid-template-columns: .92fr 1.08fr; min-height: 510px; align-items: center; gap: 60px; }
    .hero-copy { padding-block: 40px 55px; animation: rise-in .75s both; }
    .hero h1 { margin: 20px 0 17px; color: var(--cocoa); font: 700 clamp(2.7rem, 5vw, 4.5rem)/1.06 'Aboreto', sans-serif; transform: scaleX(1.04); transform-origin: left center; }
    .hero h1 em { color: #ae8050; font-style: normal; font-weight: inherit; }
    .hero-copy > .eyebrow, .hero-copy > p { font-family: 'Nunito', sans-serif; font-weight: 600; }
    .hero-copy > p { max-width: 440px; margin: 0; color: #675d53; font-size: .98rem; line-height: 1.85; }
    .hero-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 23px; margin-top: 28px; }
    .text-link { display: inline-flex; align-items: center; gap: 6px; color: var(--cocoa); font-size: .84rem; font-weight: 600; }
    .text-link .material-symbols-outlined { font-size: 17px; }
    .hero-note { display: flex; align-items: center; gap: 12px; margin-top: 39px; color: #756a5f; font-size: .76rem; line-height: 1.65; }
    .hero-note > .material-symbols-outlined { display: grid; width: 39px; height: 39px; place-items: center; border: 1px solid #a87b4a60; border-radius: 50%; color: var(--cocoa); }
    .hero-note b { color: var(--cocoa); }
    .hero-visual { position: relative; justify-self: end; width: min(100%, 560px); padding: 22px 30px 36px 0; animation: rise-in .85s .12s both; }
    .hero-image { overflow: hidden; width: 100%; aspect-ratio: .95; border-radius: 48% 48% 2px 2px; background: #d9c8b5; }
    .hero-image img { width: 100%; height: 100%; object-fit: cover; }
    @keyframes rise-in { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
    @media (max-width: 850px) { .hero-inner { grid-template-columns: 1fr 1fr; gap: 28px; } .hero h1 { font-size: clamp(2.4rem, 6vw, 3.8rem); } .hero { min-height: 560px; } }
    @media (max-width: 700px) {
      .hero { min-height: 0; }
      .hero { padding-top: 12px; }
      .hero-inner { grid-template-columns: 1fr; min-height: 0; gap: 4px; }
      .hero-copy { padding: 32px 0 8px; }
      .hero h1 { margin-block: 15px; font-size: 2.5rem; }
      .hero-copy > p { max-width: 480px; font-size: .9rem; }
      .hero-note { margin-top: 23px; }
      .hero-visual { justify-self: center; width: min(84%, 370px); padding: 8px 15px 30px 0; }
    }
    @media (max-width: 390px) { .hero h1 { font-size: 2.1rem; } }
    @media (max-width: 350px) { .hero h1 { font-size: 1.9rem; } }
    @media (max-width: 700px) {
      .hero-actions { align-items: stretch; flex-direction: column; gap: 8px; }
      .hero-actions > * { width: 100%; }
      .hero-actions .button, .hero-actions .text-link { min-height: 44px; justify-content: center; text-align: center; }
    }
    `]
})
export class HeroBannerComponent {
  
  private readonly host = inject(ElementRef<HTMLElement>);
  protected readonly heroOpacity = signal(1);

  @HostListener('window:scroll')
  onWindowScroll(): void {
    const heroBottom = this.host.nativeElement.getBoundingClientRect().bottom + window.scrollY;
    this.heroOpacity.set(Math.max(0, 1 - window.scrollY / heroBottom));
  }
}