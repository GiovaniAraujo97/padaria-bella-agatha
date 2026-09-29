import { Component } from '@angular/core';
import { RevealDirective } from '../../shared/directives/reveal.directive';

@Component({
  selector: 'app-contact', standalone: true, imports: [RevealDirective],
  template: `
    <section class="contact-intro" appReveal><div class="container"><span class="eyebrow">Vai ser um prazer</span><h1>Vamos conversar?</h1><p>Encomendas, dúvidas ou só um oi. A gente está por aqui.</p></div></section>
    <section class="section contact-section"><div class="container contact-layout">
      <div class="contact-details" appReveal><span class="eyebrow">Fale com a Bella</span><h2 class="section-heading">Sua próxima delícia começa com uma mensagem.</h2>
        <a class="contact-item" href="tel:+551130303030"><span class="material-symbols-outlined">call</span><span><small>Telefone</small><strong>(11) 3030-3030</strong></span><span class="material-symbols-outlined contact-arrow">arrow_outward</span></a>
        <a class="contact-item" href="https://wa.me/5511999999999" target="_blank" rel="noopener"><span class="material-symbols-outlined">chat</span><span><small>WhatsApp</small><strong>(11) 99999-9999</strong></span><span class="material-symbols-outlined contact-arrow">arrow_outward</span></a>
        <a class="contact-item" href="mailto:oi@bellaagatha.com.br"><span class="material-symbols-outlined">mail</span><span><small>E-mail</small><strong>oi&#64;bellaagatha.com.br</strong></span><span class="material-symbols-outlined contact-arrow">arrow_outward</span></a>
        <div class="contact-item address"><span class="material-symbols-outlined">location_on</span><span><small>Endereço</small><strong>Rua das Flores, 128<br>Jardim Paulista, São Paulo · SP</strong></span></div>
      </div>
      <div class="map-column" appReveal><div class="fake-map" role="img" aria-label="Mapa ilustrativo mostrando a localização da Padaria Bella Agatha no Jardim Paulista"><div class="map-block block-a"></div><div class="map-block block-b"></div><div class="map-block block-c"></div><div class="map-road road-a"></div><div class="map-road road-b"></div><div class="map-road road-c"></div><div class="map-park"><span>Praça das Flores</span></div><div class="map-pin"><span class="material-symbols-outlined">bakery_dining</span></div><span class="map-label">Bella Agatha</span><div class="map-zoom"><span>+</span><span>−</span></div><small class="map-credit">Mapa ilustrativo · Jardim Paulista</small></div><div class="hours-card"><span class="material-symbols-outlined">schedule</span><div><strong>Estamos esperando você</strong><p>Segunda a sábado, 7h às 20h · Domingo, 8h às 14h</p></div></div></div>
    </div></section>
  `,
  styles: [`
    .contact-intro { padding: 70px 0 54px; background: #f0ebe3; }
    .contact-intro h1 { margin: 15px 0 8px; color: var(--cocoa); font: 600 clamp(2.6rem, 6vw, 4rem)/1.1 var(--serif); }
    .contact-intro h1 { font-family: 'Aboreto', sans-serif; }
    .contact-intro p { margin: 0; color: #756a60; }
    .contact-layout { display: grid; grid-template-columns: .85fr 1.15fr; gap: 72px; }
    .contact-details .section-heading { font: 600 2.2rem/1.15 'Aboreto', sans-serif; }
    .contact-item { display: flex; align-items: center; gap: 15px; min-height: 76px; border-bottom: 1px solid var(--line); color: var(--cocoa); }
    .contact-item > .material-symbols-outlined:first-child { color: #a77f4c; font-size: 23px; }
    .contact-item small, .contact-item strong { display: block; }
    .contact-item small { margin-bottom: 5px; color: #91867b; font-size: .7rem; }
    .contact-item strong { font-size: .9rem; font-weight: 600; }
    .contact-arrow { margin-left: auto; opacity: 0; transition: opacity .2s; }
    a.contact-item:hover .contact-arrow { opacity: 1; }
    .map-column { padding-top: 24px; }
    .fake-map { position: relative; overflow: hidden; height: 340px; background-color: #e9e5d9; background-image: linear-gradient(27deg, transparent 48%, #fff9 49%, #fff9 51%, transparent 52%), linear-gradient(110deg, transparent 46%, #fff9 47%, #fff9 50%, transparent 51%); background-size: 180px 150px, 210px 170px; }
    .map-block { position: absolute; width: 22%; height: 26%; background: #d7dfcf; }
    .block-a { top: 12%; left: 8%; } .block-b { top: 62%; left: 61%; } .block-c { top: 9%; right: 9%; background: #e1d8c8; }
    .map-road { position: absolute; height: 8px; background: #fff; transform: rotate(-22deg); }
    .road-a { top: 48%; left: -5%; width: 115%; } .road-b { top: 52%; left: 24%; width: 90%; transform: rotate(66deg); } .road-c { top: 8%; left: 68%; width: 55%; transform: rotate(73deg); }
    .map-park { position: absolute; top: 10%; left: 9%; display: grid; width: 22%; height: 28%; place-items: center; color: #6f8263; font-size: .61rem; }
    .map-pin { position: absolute; top: 46%; left: 51%; display: grid; width: 43px; height: 43px; place-items: center; border: 3px solid #fff; border-radius: 50% 50% 50% 0; background: var(--cocoa); color: #fff; box-shadow: 0 4px 12px #0003; transform: rotate(-45deg); }
    .map-pin .material-symbols-outlined { font-size: 21px; transform: rotate(45deg); }
    .map-label { position: absolute; top: 62%; left: 54%; padding: 5px 8px; background: #fff; color: var(--cocoa); font-size: .7rem; box-shadow: 0 2px 6px #0002; }
    .map-zoom { position: absolute; top: 12px; right: 12px; display: grid; background: #fff; box-shadow: 0 1px 5px #0002; }
    .map-zoom span { display: grid; width: 31px; height: 31px; place-items: center; color: #51483e; }
    .map-zoom span + span { border-top: 1px solid var(--line); }
    .map-credit { position: absolute; right: 7px; bottom: 6px; color: #6f675e; font-size: .56rem; }
    .hours-card { display: flex; align-items: center; gap: 13px; padding: 17px 20px; border: 1px solid var(--line); border-top: 0; background: #fff; color: var(--cocoa); }
    .hours-card > .material-symbols-outlined { color: #aa814f; }
    .hours-card strong { font-size: .82rem; }
    .hours-card p { margin: 5px 0 0; color: #81776d; font-size: .72rem; }
    @media (max-width: 800px) { .contact-layout { grid-template-columns: 1fr; gap: 38px; } .contact-details .section-heading { max-width: 500px; } .map-column { padding-top: 0; } }
  `]
})
export class ContactComponent {}