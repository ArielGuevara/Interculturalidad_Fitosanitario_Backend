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
    selector: 'app-reset-password',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, InputTextModule, ButtonModule, ToastModule],
    providers: [MessageService],
    template: `
    <p-toast></p-toast>
    <div class="auth-wrapper">
      <div class="auth-card">
        <div class="auth-header">
          <i class="pi pi-check-circle" style="font-size:3rem;color:#16a34a"></i>
          <h2>Nueva contraseña</h2>
          <p class="text-slate-500">Ingresa tu nueva contraseña.</p>
        </div>
        <div class="auth-body">
          <div class="field">
            <label>Nueva contraseña</label>
            <input pInputText type="password" [(ngModel)]="nuevaPassword" placeholder="Mínimo 6 caracteres" class="w-full" />
          </div>
          <div class="field">
            <label>Confirmar contraseña</label>
            <input pInputText type="password" [(ngModel)]="confirmarPassword" placeholder="Repite la contraseña" class="w-full" />
          </div>
          @if (error) {
            <small class="field-error block mb-2">{{error}}</small>
          }
          <p-button label="Restablecer contraseña" [loading]="cargando" (click)="resetear()" styleClass="w-full p-button-success"></p-button>
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
export class ResetPasswordComponent implements OnInit {
    private http = inject(HttpClient);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private messageService = inject(MessageService);
    telefono = '';
    codigo = '';
    nuevaPassword = '';
    confirmarPassword = '';
    error = '';
    cargando = false;

    ngOnInit() {
        this.route.queryParams.subscribe(params => {
            this.telefono = params['telefono'] || '';
            this.codigo = params['codigo'] || '';
            if (!this.telefono || !this.codigo) this.router.navigate(['/forgot-password']);
        });
    }

    resetear() {
        if (!this.nuevaPassword || this.nuevaPassword.length < 6) { this.error = 'La contraseña debe tener al menos 6 caracteres'; return; }
        if (this.nuevaPassword !== this.confirmarPassword) { this.error = 'Las contraseñas no coinciden'; return; }
        this.error = '';
        this.cargando = true;
        this.http.post(`${environment.apiUrl}/auth/reset-password`, {
            telefono: this.telefono,
            codigo: this.codigo,
            nuevaPassword: this.nuevaPassword,
        }).subscribe({
            next: () => {
                this.cargando = false;
                this.messageService.add({ severity: 'success', summary: 'Contraseña restablecida', detail: 'Ya puedes iniciar sesión con tu nueva contraseña.' });
                setTimeout(() => this.router.navigate(['/login']), 2000);
            },
            error: (err: any) => {
                this.cargando = false;
                this.error = err?.error?.message || 'Error al restablecer la contraseña.';
            },
        });
    }
}
