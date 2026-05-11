import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { CultivosService } from '../../core/services/cultivos';
import { PlagasService } from '../../core/services/plagas';
import { ProductosService } from '../../core/services/productos';
import { forkJoin } from 'rxjs';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private cultivosService = inject(CultivosService);
  private plagasService = inject(PlagasService);
  private productosService = inject(ProductosService);
  private router = inject(Router);

  stats = signal<any[]>([]);

  ngOnInit() {
    this.loadStats();
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  loadStats() {
    forkJoin({
      cultivos: this.cultivosService.findAll(),
      plagas: this.plagasService.findAll(),
      productos: this.productosService.findAll()
    }).subscribe(data => {
      this.stats.set([
        { label: 'Cultivos', value: data.cultivos.length, icon: 'pi pi-map', color: 'bg-green-100 text-green-700', trend: 'Catálogo de plantas' },
        { label: 'Plagas/Enf.', value: data.plagas.length, icon: 'pi pi-exclamation-triangle', color: 'bg-orange-100 text-orange-700', trend: 'Amenazas activas' },
        { label: 'Productos', value: data.productos.length, icon: 'pi pi-box', color: 'bg-blue-100 text-blue-700', trend: 'Insumos registrados' },
        { label: 'Alertas', value: '0', icon: 'pi pi-bell', color: 'bg-purple-100 text-purple-700', trend: 'Sin alertas hoy' }
      ]);
    });
  }
}
