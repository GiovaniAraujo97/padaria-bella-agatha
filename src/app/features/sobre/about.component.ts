import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RevealDirective } from '../../shared/directives/reveal.directive';

@Component({
  selector: 'app-about', standalone: true, imports: [RouterLink, RevealDirective],
  template: `
    <section class="about-hero" appReveal><div class="container about-hero-inner"><div><span class="eyebrow">Desde 2004, juntinho de você</span><h1>Uma padaria feita<br>de <em>bons encontros.</em></h1><p>O cheiro de pão quentinho, o café passado na hora e uma mesa sempre pronta. É assim que a Bella Agatha recebe você há mais de vinte anos.</p></div><img src="/img-sobre.png?v=2" alt="Pães artesanais feitos na cozinha Bella Agatha"></div></section>
    <section class="section"><div class="container about-story" appReveal><div><span class="eyebrow">Nossa história</span><h2 class="section-heading">Tudo começou com uma receita de família.</h2></div><div><p [style.opacity]="storyParagraphOpacities()[0]" [style.transform]="'perspective(800px) translateZ(' + storyParagraphDepths()[0] + 'px)'">Em 2004, Agatha abriu as portas de uma pequena padaria com uma ideia simples: fazer comida de verdade e tratar cada cliente como visita querida. O primeiro pão saía do forno ainda de madrugada, e o balcão logo virou ponto de encontro do bairro.</p><p [style.opacity]="storyParagraphOpacities()[1]" [style.transform]="'perspective(800px) translateZ(' + storyParagraphDepths()[1] + 'px)'">O espaço cresceu, as receitas ganharam novos capítulos e algumas coisas continuam exatamente iguais: o cuidado com os ingredientes, o respeito ao tempo de cada massa e a alegria de ver você voltar.</p><a routerLink="/produtos" class="button button--outline">Prove nossas receitas <span class="material-symbols-outlined">arrow_forward</span></a></div></div></section>
    <section class="about-stats" appReveal><div class="container stats-grid"><div><strong>20+</strong><span>anos de história</span></div><div><strong>5.000</strong><span>clientes felizes</span></div><div><strong>100</strong><span>receitas exclusivas</span></div><div><strong>50</strong><span>produtos por dia</span></div></div></section>
    <section class="section about-values" appReveal><div class="container"><span class="eyebrow">O que nunca muda</span><h2 class="section-heading">Nosso jeito de fazer.</h2><div class="about-value-grid"><article><span class="material-symbols-outlined">nutrition</span><h3>Ingredientes de verdade</h3><p>Frescos, bem escolhidos e sem atalhos.</p></article><article><span class="material-symbols-outlined">bakery_dining</span><h3>Tempo e cuidado</h3><p>Fermentação natural e produção em pequenas fornadas.</p></article><article><span class="material-symbols-outlined">favorite</span><h3>Feito com afeto</h3><p>Receitas de família, preparadas para compartilhar.</p></article></div></div></section>
  `,
  styles: [`
    .about-hero { padding: 54px 0 0; background-color: #f0ebe3; background-image: none; }
    .about-hero-inner { display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: 55px; }
    .about-hero h1 { margin: 18px 0; color: var(--cocoa); font: 600 clamp(2.3rem, 4.5vw, 3.7rem)/1.08 'Aboreto', sans-serif; }
    .about-hero h1 em { color: #ae8050; }
    .about-hero p { max-width: 480px; color: #756a60; line-height: 1.8; }
    .about-hero img { align-self: end; width: 100%; max-height: 430px; aspect-ratio: 1.2; background: #f0ebe3; object-fit: contain; }
    .about-story { display: grid; grid-template-columns: 1.2fr .8fr; gap: 40px; }
    .about-story > div:first-child { order: 2; }
    .about-story > div:last-child { order: 1; }
    .about-story .section-heading { margin: 6px 0 12px; font-family: 'Aboreto', sans-serif; }
    .about-story p { margin: 0 0 8px; color: #71675d; line-height: 1.85; }
    .about-stats { padding-block: 43px; background: var(--cocoa); color: #fff; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; text-align: center; }
    .stats-grid div { display: flex; flex-direction: column; gap: 7px; }
    .stats-grid strong { color: #e2c391; font: 600 2.5rem 'Nunito', sans-serif; }
    .stats-grid span { color: #e4d8cc; font-family: 'Nunito', sans-serif; font-size: .76rem; }
    .about-values { background: #fff; }
    .about-values .section-heading { font-family: 'Aboreto', sans-serif; }
    .about-value-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
    .about-value-grid article { padding: 25px; border: 1px solid var(--line); }
    .about-value-grid .material-symbols-outlined { color: #ae8050; font-size: 30px; }
    .about-value-grid h3 { margin: 18px 0 8px; color: var(--cocoa); font: 600 1.2rem var(--serif); }
    .about-value-grid p { margin: 0; color: var(--muted); font-size: .84rem; line-height: 1.7; }
    @media (max-width: 700px) { .about-hero-inner, .about-story { grid-template-columns: 1fr; gap: 28px; } .about-story { gap: 10px; } .about-story > div { order: initial; } .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 30px; } .about-value-grid { grid-template-columns: 1fr; } }
  `]
})
export class AboutComponent {
  private readonly host = inject(ElementRef<HTMLElement>);
  protected readonly storyParagraphOpacities = signal([0, 0]);
  protected readonly storyParagraphDepths = signal([-140, -140]);

  @HostListener('window:scroll')
  onWindowScroll(): void {
    const paragraphs = this.host.nativeElement.querySelectorAll('.about-story > div:last-child > p') as NodeListOf<HTMLElement>;
    if (paragraphs.length < 2) return;

    const start = window.innerHeight * 0.92;
    const end = window.innerHeight * 0.58;
    const progressFor = (paragraph: HTMLElement): number => Math.max(0, Math.min(1, (start - paragraph.getBoundingClientRect().top) / (start - end)));
    const progresses = Array.from(paragraphs, progressFor);
    this.storyParagraphOpacities.set(progresses);
    this.storyParagraphDepths.set(progresses.map((progress) => -140 * (1 - progress)));
  }
}