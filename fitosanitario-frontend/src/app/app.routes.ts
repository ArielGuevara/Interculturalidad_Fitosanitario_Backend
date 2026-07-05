import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login/login').then(m => m.Login) },
  {
    path: '',
    loadComponent: () => import('./shared/components/layout/layout').then(m => m.Layout),
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard').then(m => m.Dashboard) },
      { path: 'cultivos', loadComponent: () => import('./features/cultivos/cultivo-list/cultivo-list').then(m => m.CultivoList) },
      { path: 'plagas', loadComponent: () => import('./features/plagas/plaga-list/plaga-list').then(m => m.PlagaList) },
      { path: 'productos', loadComponent: () => import('./features/productos/producto-list/producto-list').then(m => m.ProductoList) },
      { path: 'reportes', loadComponent: () => import('./features/reportes/reportes-bandeja/reportes-bandeja').then(m => m.ReportesBandeja) },
      { path: 'reportes/:id', loadComponent: () => import('./features/reportes/reporte-detail/reporte-detail').then(m => m.ReporteDetail) },
      { path: 'tratamientos', loadComponent: () => import('./features/tratamientos/tratamiento-list/tratamiento-list').then(m => m.TratamientoList) },
      { path: 'comunidad', loadComponent: () => import('./features/comunidad/comunidad-moderacion/comunidad-moderacion').then(m => m.ComunidadModeracion) },
      { path: 'zonas-alerta', loadComponent: () => import('./features/alertas/zona-list/zona-list').then(m => m.ZonaList) },
      { path: 'parametros-alerta', loadComponent: () => import('./features/alertas/parametro-list/parametro-list').then(m => m.ParametroList) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
