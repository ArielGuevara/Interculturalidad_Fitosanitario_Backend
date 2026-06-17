import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Layout } from './shared/components/layout/layout';
import { Dashboard } from './features/dashboard/dashboard';
import { CultivoList } from './features/cultivos/cultivo-list/cultivo-list';
import { PlagaList } from './features/plagas/plaga-list/plaga-list';
import { ProductoList } from './features/productos/producto-list/producto-list';
import { authGuard } from './core/guards/auth-guard';
import { ReportesBandeja } from './features/reportes/reportes-bandeja/reportes-bandeja';
import { ReporteDetail } from './features/reportes/reporte-detail/reporte-detail';
import { ComunidadModeracion } from './features/comunidad/comunidad-moderacion/comunidad-moderacion';
import { TratamientoList } from './features/tratamientos/tratamiento-list/tratamiento-list';

export const routes: Routes = [
  { path: 'login', component: Login },
  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'cultivos', component: CultivoList },
      { path: 'plagas', component: PlagaList },
      { path: 'productos', component: ProductoList },
      { path: 'reportes', component: ReportesBandeja },
      { path: 'reportes/:id', component: ReporteDetail },
      { path: 'tratamientos', component: TratamientoList },
      { path: 'comunidad', component: ComunidadModeracion },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
