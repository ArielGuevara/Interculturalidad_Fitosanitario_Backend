import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-verify-code',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, InputTextModule, ButtonModule, ToastModule],
    providers: [MessageService],
    template: `
    <p-toast></p-toast>
    <div class="auth-wrapper">
      <div class="auth-card">
        <div class="auth-header">
          <i class="pi pi-shield" style="font-size:3rem;color:#16a34a"></i>
          <h2>Verificar código</h2>
          <p class="text-slate-500">Ingresa el código de 6 dígitos que recibiste por WhatsApp.</p>
        </div>
        <div class="auth-body">
          <div class="field">
            <label>Código de verificación</label>
            <input pInputText type="text" [(ngModel)]="codigo" placeholder="123456" maxlength="6" class="w-full text-center text-2xl" inputmode="numeric" />
          </div>
          @if (error) {
            <small class="field-error block mb-2">{{error}}</small>
          }
          <p-button label="Verificar código" [loading]="cargando" (click)="verificar()" styleClass="w-full p-button-success"></p-button>
        </div>
        <div class="auth-footer">
          <a routerLink="/forgot-password">Solicitar otro código</a>
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
export class VerifyCodeComponent implements OnInit {
    private http = inject(HttpClient);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private messageService = inject(MessageService);
    telefono = '';
    codigo = '';
    error = '';
    cargando = false;

    ngOnInit() {
        this.route.queryParams.subscribe(params => {
            this.telefono = params['telefono'] || '';
            if (!this.telefono) this.router.navigate(['/forgot-password']);
        });
    }

    verificar() {
        if (!this.codigo.trim() || this.codigo.trim().length < 4) { this.error = 'Ingrese el código completo'; return; }
        this.error = '';
        this.cargando = true;
        this.http.post(`${environment.apiUrl}/auth/verify-code`, { telefono: this.telefono, codigo: this.codigo.trim() }).subscribe({
            next: () => {
                this.cargando = false;
                this.router.navigate(['/reset-password'], { queryParams: { telefono: this.telefono, codigo: this.codigo.trim() } });
            },
            error: (err: any) => {
                this.cargando = false;
                this.error = err?.error?.message || 'Código incorrecto o expirado.';
            },
        });
    }
}
