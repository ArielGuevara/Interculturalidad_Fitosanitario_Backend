import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../core/services/auth';
import { UsuariosService } from '../../core/services/usuarios';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, PasswordModule, ToastModule],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>

    <div class="page-header flex flex-column md:flex-row justify-content-between align-items-end gap-4">
      <div>
        <h2 class="title m-0">Mi Perfil</h2>
        <p class="subtitle m-0">Información de tu cuenta.</p>
      </div>
    </div>

    <div class="profile-card">
      <div class="profile-avatar">
        <i class="pi pi-user" style="font-size: 3rem"></i>
      </div>
      <div class="profile-info">
        <div class="info-row">
          <span class="info-label">Nombre</span>
          <span class="info-value">{{ user()?.nombre }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Email</span>
          <span class="info-value">{{ user()?.email }}</span>
        </div>
        @if (user()?.cargo) {
          <div class="info-row">
            <span class="info-label">Cargo</span>
            <span class="info-value">{{ user()?.cargo }}</span>
          </div>
        }
        <div class="info-row">
          <span class="info-label">Rol</span>
          <span class="info-value">
            <span class="role-badge" [class.text-green-600]="user()?.rol === 'AGRICULTOR'" [class.text-blue-600]="user()?.rol === 'MODERADOR'" [class.text-purple-600]="user()?.rol === 'ADMIN'">
              {{ user()?.rol === 'AGRICULTOR' ? 'Agricultor' : user()?.rol === 'MODERADOR' ? 'Moderador' : 'Administrador' }}
            </span>
          </span>
        </div>
      </div>
    </div>

    <div class="password-card">
      <h3 class="text-lg font-black text-900 mb-3">Cambiar contraseña</h3>
      <div class="flex flex-column gap-3" style="max-width: 400px">
        <div>
          <label class="block font-bold mb-1">Contraseña actual</label>
          <p-password [(ngModel)]="passwordForm.current" [feedback]="false" [toggleMask]="true" class="w-full" inputStyleClass="w-full" styleClass="w-full"></p-password>
        </div>
        <div>
          <label class="block font-bold mb-1">Nueva contraseña</label>
          <p-password [(ngModel)]="passwordForm.newPassword" [toggleMask]="true" class="w-full" inputStyleClass="w-full" styleClass="w-full"></p-password>
        </div>
        <div>
          <label class="block font-bold mb-1">Confirmar nueva contraseña</label>
          <p-password [(ngModel)]="passwordForm.confirm" [feedback]="false" [toggleMask]="true" class="w-full" inputStyleClass="w-full" styleClass="w-full"></p-password>
        </div>
        <p-button label="Actualizar contraseña" [disabled]="!passwordForm.current || !passwordForm.newPassword || !passwordForm.confirm || passwordForm.newPassword !== passwordForm.confirm || savingPassword()" (onClick)="changePassword()"></p-button>
      </div>
    </div>
  `,
  styles: [`
    .profile-card {
      background: white;
      border-radius: 28px;
      padding: 2.5rem;
      box-shadow: 0 20px 40px -24px rgba(15, 23, 42, 0.22);
      display: flex;
      gap: 2rem;
      align-items: flex-start;
      max-width: 600px;
    }
    .password-card {
      background: white;
      border-radius: 28px;
      padding: 2.5rem;
      box-shadow: 0 20px 40px -24px rgba(15, 23, 42, 0.22);
      max-width: 600px;
      margin-top: 1.5rem;
    }
    .profile-avatar {
      width: 100px;
      height: 100px;
      background: #ecfdf5;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #059669;
      flex-shrink: 0;
    }
    .profile-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .info-row {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .info-label {
      font-size: 0.72rem;
      font-weight: 900;
      color: var(--slate-400);
      text-transform: uppercase;
      letter-spacing: 0.12em;
    }
    .info-value {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--slate-900);
    }
    @media (max-width: 600px) {
      .profile-card {
        flex-direction: column;
        align-items: center;
        text-align: center;
      }
    }
  `]
})
export class Perfil {
  authService = inject(AuthService);
  usuariosService = inject(UsuariosService);
  messageService = inject(MessageService);

  user = this.authService.currentUser;
  savingPassword = signal(false);

  passwordForm = { current: '', newPassword: '', confirm: '' };

  changePassword() {
    if (this.passwordForm.newPassword !== this.passwordForm.confirm) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Las contraseñas no coinciden' });
      return;
    }
    if (this.passwordForm.newPassword.length < 6) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }
    this.savingPassword.set(true);
    this.usuariosService.changePassword(this.passwordForm.current, this.passwordForm.newPassword).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Actualizada', detail: 'Contraseña cambiada correctamente' });
        this.passwordForm = { current: '', newPassword: '', confirm: '' };
        this.savingPassword.set(false);
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al cambiar contraseña' });
        this.savingPassword.set(false);
      },
    });
  }
}
