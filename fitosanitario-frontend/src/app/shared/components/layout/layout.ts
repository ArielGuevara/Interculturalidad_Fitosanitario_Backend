import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '../../../core/services/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, ButtonModule, TooltipModule],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout implements OnInit {
  authService = inject(AuthService);
  
  isCollapsed = signal(false);
  
  navItems = [
    { label: 'Dashboard', icon: 'pi pi-chart-bar', route: '/dashboard' },
    { label: 'Cultivos', icon: 'pi pi-map', route: '/cultivos' },
    { label: 'Plagas', icon: 'pi pi-shield', route: '/plagas' },
    { label: 'Productos', icon: 'pi pi-box', route: '/productos' },
    { label: 'Reportes', icon: 'pi pi-inbox', route: '/reportes' },
    { label: 'Tratamientos', icon: 'pi pi-file-check', route: '/tratamientos' },
    { label: 'Comunidad', icon: 'pi pi-comments', route: '/comunidad' },
  ];

  ngOnInit() {}

  toggleSidebar() {
    this.isCollapsed.update(v => !v);
  }

  onLogout() {
    this.authService.logout();
  }
}
