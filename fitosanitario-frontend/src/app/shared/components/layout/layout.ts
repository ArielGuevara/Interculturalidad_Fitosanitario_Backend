import { Component, OnInit, inject, signal, computed, HostListener } from '@angular/core';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';
import { AuthService } from '../../../core/services/auth';
import { NotificacionesService } from '../../../core/services/notificaciones';
import { Notificacion } from '../../../core/models/notificacion.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, ButtonModule, TooltipModule, BadgeModule],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout implements OnInit {
  private router = inject(Router);
  authService = inject(AuthService);
  notifService = inject(NotificacionesService);

  isCollapsed = signal(false);
  isMobileOpen = signal(false);
  notificaciones = signal<Notificacion[]>([]);
  noLeidas = signal(0);
  notifOpen = signal(false);

  baseNavItems = [
    { label: 'Inicio', icon: 'pi pi-chart-bar', route: '/dashboard' },
    { label: 'Cultivos', icon: 'pi pi-map', route: '/cultivos' },
    { label: 'Plagas', icon: 'pi pi-shield', route: '/plagas' },
    { label: 'Productos', icon: 'pi pi-th-large', route: '/productos' },
    { label: 'Reportes', icon: 'pi pi-inbox', route: '/reportes' },
    { label: 'Tratamientos', icon: 'pi pi-file-check', route: '/tratamientos' },
    { label: 'Foro', icon: 'pi pi-comments', route: '/comunidad' },
    { label: 'Zonas Alerta', icon: 'pi pi-map-marker', route: '/zonas-alerta' },
  ];

  navItems = computed(() => {
    const user = this.authService.currentUser();
    const items = [...this.baseNavItems];
    if (user && (user.rol === 'ADMIN' || (user.permisos && user.permisos.includes('usuarios')))) {
      items.splice(1, 0, { label: 'Usuarios', icon: 'pi pi-users', route: '/usuarios' });
    }
    return items;
  });

  isMobile = signal(false);

  ngOnInit() {
    this.checkMobile();
    this.cargarNotificaciones();
    setInterval(() => this.cargarNotificaciones(), 30000);
  }

  @HostListener('window:resize')
  checkMobile() {
    this.isMobile.set(window.innerWidth <= 1024);
    if (!this.isMobile()) {
      this.isMobileOpen.set(false);
    }
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

  clickNotificacion(n: Notificacion) {
    this.closeNotif();
    if (!n.leida) {
      this.notifService.marcarLeida(n.id).subscribe(() => this.cargarNotificaciones());
    }

    const tipo = n.tipo;
    let parsedData: Record<string, any> | null = null;
    try {
      parsedData = n.data ? JSON.parse(n.data) : null;
    } catch {}

    const reporteId = parsedData?.['reporteId'] ?? null;
    const alertaId = n.alertaId ?? parsedData?.['alertaId'] ?? null;

    if (tipo?.startsWith('tratamiento') || tipo === 'cambio_estado') {
      if (reporteId) {
        this.router.navigate(['/reportes', reporteId]);
      } else {
        this.router.navigate(['/reportes']);
      }
    } else if (tipo === 'nuevo_comentario' || tipo === 'nuevo_foro_publicado' || tipo === 'nuevo_foro_pendiente' || tipo === 'foro_aprobado' || tipo === 'foro_rechazado') {
      this.router.navigate(['/comunidad']);
    } else if (tipo === 'comentario_promovido' || tipo === 'saber_ancestral_aprobado') {
      this.router.navigate(['/comunidad']);
    } else if (alertaId) {
      this.router.navigate(['/zonas-alerta']);
    }
  }

  toggleSidebar() {
    this.isCollapsed.update((v) => !v);
  }

  toggleMobileMenu() {
    this.isMobileOpen.update((v) => !v);
  }

  closeMobileMenu() {
    if (this.isMobile()) {
      this.isMobileOpen.set(false);
    }
  }

  onLogout() {
    this.authService.logout();
  }
}
