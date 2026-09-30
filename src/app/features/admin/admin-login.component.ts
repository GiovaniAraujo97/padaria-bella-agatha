import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminService } from '../../core/services/admin.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <main class="login-page">
      <section class="login-panel" aria-labelledby="login-title">
        <a routerLink="/" class="back-link"><span class="material-symbols-outlined" aria-hidden="true">arrow_back</span> Voltar à vitrine</a>
        <span class="eyebrow">Bella Agatha</span>
        <h1 id="login-title">Área administrativa</h1>
        <p>Acesse para atualizar o cardápio.</p>
        <form (ngSubmit)="submit()" #form="ngForm">
          <label for="admin-email">E-mail</label>
          <input id="admin-email" name="email" type="email" autocomplete="username" [(ngModel)]="email" required email>
          <label for="admin-password">Senha</label>
          <div class="password-field">
            <input id="admin-password" name="password" [type]="showPassword() ? 'text' : 'password'" autocomplete="current-password" [(ngModel)]="password" required>
            <button class="password-toggle" type="button" [attr.aria-label]="showPassword() ? 'Ocultar senha' : 'Mostrar senha'" [attr.aria-pressed]="showPassword()" (click)="showPassword.set(!showPassword())">
              <span class="material-symbols-outlined" aria-hidden="true">{{ showPassword() ? 'visibility_off' : 'visibility' }}</span>
            </button>
          </div>
          @if (error()) { <p class="form-error" role="alert">{{ error() }}</p> }
          <button class="button submit-button" type="submit" [disabled]="form.invalid || loading()">
            {{ loading() ? 'Verificando...' : 'Entrar' }}
          </button>
        </form>
      </section>
    </main>
  `,
  styles: [`
    .login-page { display: grid; min-height: calc(100vh - 92px); place-items: center; padding: 32px 18px; background: linear-gradient(115deg, #f0ebe3 0 48%, #faf8f4 48%); }
    .login-panel { width: min(100%, 440px); min-width: 0; max-width: 100%; padding: 38px; border: 1px solid var(--line); background: #fff; box-shadow: 0 16px 50px #39281912; }
    .back-link { display: inline-flex; align-items: center; gap: 6px; margin-bottom: 34px; color: var(--muted); font-size: .85rem; }
    .back-link .material-symbols-outlined { font-size: 19px; }
    h1 { margin: 12px 0 7px; color: var(--cocoa); font: 600 2rem/1.15 'Aboreto', sans-serif; }
    .login-panel > p { margin: 0 0 28px; color: var(--muted); }
    form { display: grid; gap: 9px; }
    label { margin-top: 9px; color: var(--cocoa); font-size: .85rem; font-weight: 700; }
    .password-field { position: relative; }
    input { width: 100%; min-height: 46px; padding: 10px 12px; border: 1px solid var(--line); background: var(--paper); color: var(--ink); font: inherit; }
    .password-field input { padding-right: 48px; }
    input:focus { outline: 2px solid var(--honey); outline-offset: 1px; }
    .password-toggle { position: absolute; top: 50%; right: 4px; display: grid; width: 38px; height: 38px; margin: 0; padding: 0; place-items: center; transform: translateY(-50%); border: 0; background: transparent; color: var(--muted); }
    .password-toggle:hover { color: var(--cocoa); }
    .password-toggle:focus-visible { outline: 2px solid var(--honey); outline-offset: -2px; }
    .password-toggle .material-symbols-outlined { font-size: 20px; }
    .form-error { margin: 5px 0; color: #a43f32; font-size: .85rem; }
    .submit-button { width: 100%; margin-top: 14px; }
    .submit-button:disabled { opacity: .6; cursor: wait; }
    @media (max-width: 500px) { .login-panel { padding: 28px 22px; } h1 { font-size: 1.65rem; overflow-wrap: anywhere; } }
  `]
})
export class AdminLoginComponent {
  private readonly admin = inject(AdminService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected email = '';
  protected password = '';
  protected readonly showPassword = signal(false);
  protected readonly loading = signal(false);
  protected readonly error = signal('');

  protected submit(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set('');
    this.admin.login(this.email.trim(), this.password).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        void this.router.navigateByUrl(returnUrl?.startsWith('/admin') ? returnUrl : '/admin');
      },
      error: (response: { message?: string }) => {
        this.error.set(response.message ?? 'Não foi possível acessar agora. Tente novamente.');
        this.loading.set(false);
      }
    });
  }
}