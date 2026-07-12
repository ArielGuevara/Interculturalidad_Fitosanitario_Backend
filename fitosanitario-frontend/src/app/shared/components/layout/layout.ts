import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';
import { AuthService } from '../../../core/services/auth';
import { NotificacionesService } from '../../../core/services/notificaciones';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, ButtonModule, TooltipModule, BadgeModule],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout implements OnInit {
  authService = inject(AuthService);
  notifService = inject(NotificacionesService);

  isCollapsed = signal(false);
  notificaciones = signal<any[]>([]);
  noLeidas = signal(0);
  notifOpen = signal(false);

  navItems = [
    { label: 'Dashboard', icon: 'pi pi-chart-bar', route: '/dashboard' },
    { label: 'Cultivos', icon: 'pi pi-map', route: '/cultivos' },
    { label: 'Plagas', icon: 'pi pi-shield', route: '/plagas' },
    { label: 'Productos', icon: 'pi pi-box', route: '/productos' },
    { label: 'Reportes', icon: 'pi pi-inbox', route: '/reportes' },
    { label: 'Tratamientos', icon: 'pi pi-file-check', route: '/tratamientos' },
    { label: 'Comunidad', icon: 'pi pi-comments', route: '/comunidad' },
    { label: 'Zonas Alerta', icon: 'pi pi-map-marker', route: '/zonas-alerta' },
    { label: 'Params. Alerta', icon: 'pi pi-cog', route: '/parametros-alerta' },
  ];

  ngOnInit() {
    this.cargarNotificaciones();
    setInterval(() => this.cargarNotificaciones(), 30000);
  }

  cargarNotificaciones() {
    this.notifService.findMine().subscribe((n) => {
      this.notificaciones.set(n);
      this.noLeidas.set(n.filter((x) => !x.leida).length);
    });
  }

  toggleNotif(ev: MouseEvent) {
    ev.stopPropagation();
    this.notifOpen.update((v) => !v);
  }

  closeNotif() {
    this.notifOpen.set(false);
  }

  marcarLeida(id: number) {
    this.notifService.marcarLeida(id).subscribe(() => this.cargarNotificaciones());
  }

  toggleSidebar() {
    this.isCollapsed.update((v) => !v);
  }

  onLogout() {
    this.authService.logout();
  }
}
