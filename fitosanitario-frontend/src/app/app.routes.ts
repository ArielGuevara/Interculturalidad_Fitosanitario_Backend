import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login/login').then(m => m.Login) },
  { path: 'forgot-password', loadComponent: () => import('./features/auth/forgot-password/forgot-password').then(m => m.ForgotPasswordComponent) },
  { path: 'verify-code', loadComponent: () => import('./features/auth/verify-code/verify-code').then(m => m.VerifyCodeComponent) },
  { path: 'reset-password', loadComponent: () => import('./features/auth/reset-password/reset-password').then(m => m.ResetPasswordComponent) },
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
      { path: 'comunidad', loadComponent: () => import('./features/comunidad/comunidad-moderacion/comunidad-moderacion').then(m => m.ComunidadModeracionComponent) },
      { path: 'zonas-alerta', loadComponent: () => import('./features/alertas/zona-list/zona-list').then(m => m.ZonaList) },
      { path: 'perfil', loadComponent: () => import('./features/perfil/perfil').then(m => m.Perfil) },
      { path: 'usuarios', loadComponent: () => import('./features/usuarios/usuarios-list').then(m => m.UsuariosList) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
