import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-forgot-password',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, InputTextModule, ButtonModule, ToastModule],
    providers: [MessageService],
    template: `
    <p-toast></p-toast>
    <div class="auth-wrapper">
      <div class="auth-card">
        <div class="auth-header">
          <i class="pi pi-lock" style="font-size:3rem;color:#16a34a"></i>
          <h2>Recuperar contraseña</h2>
          <p class="text-slate-500">Ingresa tu número de celular para recibir un código de verificación.</p>
        </div>
        <div class="auth-body">
          <div class="field">
            <label>Número de celular</label>
            <input pInputText type="tel" [(ngModel)]="telefono" placeholder="+593999999999" class="w-full" />
          </div>
          @if (error) {
            <small class="field-error block mb-2">{{error}}</small>
          }
          <p-button label="Enviar código" [loading]="cargando" (click)="enviar()" styleClass="w-full p-button-success"></p-button>
        </div>
        <div class="auth-footer">
          <a routerLink="/login">Volver al inicio de sesión</a>
        </div>
      </div>
    </div>
    `,
    styles: [`
      .auth-wrapper { display:flex; align-items:center; justify-content:center; min-height:100vh; background:#f0fdf4; padding:1rem; }
      .auth-card { background:white; border-radius:24px; padding:2.5rem; width:100%; max-width:420px; box-shadow:0 4px 24px rgba(0,0,0,.08); }
      .auth-header { text-align:center; margin-bottom:2rem; }
      .auth-header h2 { margin:1rem 0 .5rem; color:#1e293b; font-size:1.5rem; font-weight:700; }
      .field { margin-bottom:1.5rem; }
      .field label { display:block; font-weight:600; margin-bottom:.5rem; color:#334155; }
      .auth-footer { text-align:center; margin-top:1.5rem; }
      .auth-footer a { color:#16a34a; text-decoration:none; font-weight:500; }
    `]
})
export class ForgotPasswordComponent {
    private http = inject(HttpClient);
    private router = inject(Router);
    private messageService = inject(MessageService);
    telefono = '';
    error = '';
    cargando = false;

    enviar() {
        if (!this.telefono.trim()) { this.error = 'Ingrese su número de celular'; return; }
        this.error = '';
        this.cargando = true;
        this.http.post(`${environment.apiUrl}/auth/forgot-password`, { telefono: this.telefono.trim() }).subscribe({
            next: () => {
                this.cargando = false;
                this.messageService.add({ severity: 'success', summary: 'Código enviado', detail: 'Revise su WhatsApp para obtener el código.' });
                setTimeout(() => this.router.navigate(['/verify-code'], { queryParams: { telefono: this.telefono.trim() } }), 1500);
            },
            error: (err: any) => {
                this.cargando = false;
                this.error = err?.error?.message || 'Error al enviar código. Verifique el número.';
            },
        });
    }
}
