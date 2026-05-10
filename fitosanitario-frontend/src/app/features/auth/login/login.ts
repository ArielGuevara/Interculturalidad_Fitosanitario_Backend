import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    InputTextModule,
    ButtonModule,
    PasswordModule,
    ToastModule,
    CheckboxModule
  ],
  providers: [MessageService],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  email: string = '';
  password: string = '';
  loading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService
  ) {}

  onLogin() {
    if (!this.email || !this.password) {
      this.messageService.add({ 
        severity: 'warn', 
        summary: 'Atención', 
        detail: 'Por favor complete todos los campos' 
      });
      return;
    }

    this.loading = true;
    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        if (res.usuario.rol !== 'MODERADOR') {
          this.messageService.add({ 
            severity: 'error', 
            summary: 'Acceso Denegado', 
            detail: 'Esta plataforma es exclusiva para moderadores' 
          });
          this.authService.logout();
        } else {
          this.router.navigate(['/dashboard']);
        }
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error de Login:', err); // Depuración para el desarrollador
        
        let detail = 'Ha ocurrido un problema inesperado';
        let summary = 'Error del Sistema';

        // Lógica de detección de error mejorada
        if (err.status === 401) {
          summary = 'Credenciales Incorrectas';
          detail = 'El correo o la contraseña no son válidos';
        } else if (err.status === 403) {
          summary = 'Acceso Prohibido';
          detail = 'No tienes permisos para acceder a este recurso';
        } else if (err.status === 404) {
          summary = 'No Encontrado';
          detail = 'El endpoint de autenticación no existe';
        } else if (err.status === 0) {
          summary = 'Sin Conexión';
          detail = 'No hay respuesta del servidor. Verifique su conexión o si el backend está encendido';
        } else if (err.status >= 500) {
          summary = 'Error de Servidor';
          detail = 'El servidor encontró un error interno. Reintente más tarde';
        }

        this.messageService.add({ 
          severity: 'error', 
          summary: summary, 
          detail: detail,
          life: 5000 // Más tiempo para leer el error
        });
        
        this.loading = false;
      }
    });
  }
}
