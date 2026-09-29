import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RevealDirective } from '../../directives/reveal.directive';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, RevealDirective],
  template: `
    <footer class="site-footer" appReveal>
      <div class="container footer-main">
        <div class="footer-brand">
          <a class="brand" routerLink="/" aria-label="Bella Agatha, início"><img src="/logo-pba.png" alt="Padaria Bella Agatha"></a>
          <p>Feito com tempo, servido com afeto.<br>Desde 2004, fazendo parte dos seus melhores momentos.</p>
        </div>
        <nav class="footer-column" aria-label="Explore">
          <h3>Explore</h3>
          <ul class="footer-links"><li><a routerLink="/">Início</a></li><li><a routerLink="/sobre">Nossa história</a></li><li><a routerLink="/produtos">Nossos produtos</a></li><li><a routerLink="/contato">Contato</a></li></ul>
        </nav>
        <section class="footer-column" aria-label="Visite a gente">
          <h3>Visite a gente</h3>
          <p class="footer-detail"><span class="material-symbols-outlined" aria-hidden="true">location_on</span><span>Rua das Flores, 128<br>Jardim Paulista, São Paulo</span></p>
          <p class="footer-detail"><span class="material-symbols-outlined" aria-hidden="true">schedule</span><span>Seg a sáb · 7h às 20h<br>Dom · 8h às 14h</span></p>
        </section>
        <nav class="footer-column" aria-label="Encomendas">
          <h3>Encomendas</h3>
          <ul class="footer-links footer-order-links"><li><a href="tel:+551130303030"><span class="material-symbols-outlined" aria-hidden="true">call</span><span>(11) 3030-3030</span></a></li><li><a href="https://wa.me/5511999999999"><span class="material-symbols-outlined" aria-hidden="true">chat</span><span>WhatsApp</span></a></li><li><a href="https://instagram.com"><span class="material-symbols-outlined" aria-hidden="true">photo_camera</span><span>Instagram</span></a></li><li><a href="mailto:oi@bellaagatha.com.br"><span class="material-symbols-outlined" aria-hidden="true">mail</span><span>oi&#64;bellaagatha.com.br</span></a></li></ul>
        </nav>
      </div>
      <div class="footer-bottom"><div class="container"><span>© 2025 Padaria Bella Agatha. Feito com carinho.</span><span>São Paulo, SP · Brasil</span></div></div>
    </footer>
  `,
  styles: [`
    :host { display: block; }
    .site-footer { background: #38271d; color: #f9f5ef; }
    .footer-main { display: grid; grid-template-columns: minmax(220px, 1.45fr) repeat(3, minmax(0, 1fr)); gap: 38px; padding-block: 58px 50px; }
    .brand { display: inline-flex; align-items: center; }
    .brand img { width: 72px; height: 72px; object-fit: contain; }
    .footer-brand p { max-width: 290px; margin: 14px 0 0; color: #d0c2b4; font-size: .84rem; line-height: 1.8; }
    .footer-column { display: flex; min-width: 0; flex-direction: column; align-items: flex-start; gap: 15px; }
    .footer-column h3 { margin: 7px 0 2px; color: #dfbb83; font-size: .78rem; text-transform: uppercase; }
    .footer-links { display: grid; gap: 12px; margin: 0; padding: 0; list-style: none; }
    .footer-column a, .footer-detail { margin: 0; color: #d0c2b4; font-size: .84rem; line-height: 1.7; }
    .footer-column a { transition: color .2s; }
    .footer-column a:hover { color: #fff; }
    .footer-order-links a, .footer-detail { display: grid; grid-template-columns: 18px minmax(0, 1fr); align-items: start; gap: 10px; }
    .footer-order-links .material-symbols-outlined, .footer-detail .material-symbols-outlined { padding-top: 2px; color: #c9aa7b; font-size: 18px; }
    .footer-bottom { border-top: 1px solid #ffffff20; }
    .footer-bottom .container { display: flex; justify-content: space-between; gap: 14px; padding-block: 16px; color: #c2b2a3; font-size: .74rem; }
    @media (max-width: 950px) {
      .footer-main { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 38px 32px; }
      .footer-brand { grid-column: 1 / -1; }
      .footer-column[aria-label="Explore"] { order: 1; }
      .footer-column[aria-label="Visite a gente"] { order: 2; }
      .footer-column[aria-label="Encomendas"] { order: 3; }
    }
    @media (max-width: 560px) {
      .footer-main { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 30px 20px; padding-block: 42px; }
      .footer-brand, .footer-column[aria-label="Encomendas"] { grid-column: 1 / -1; }
      .footer-bottom .container { align-items: flex-start; flex-direction: column; gap: 7px; }
    }
  `]
})
export class FooterComponent {}