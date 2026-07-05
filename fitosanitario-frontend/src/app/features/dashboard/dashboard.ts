import { Component, inject, OnInit, signal, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { CultivosService } from '../../core/services/cultivos';
import { PlagasService } from '../../core/services/plagas';
import { ProductosService } from '../../core/services/productos';
import { ReportesService } from '../../core/services/reportes';
import { AlertasService } from '../../core/services/alertas';
import { forkJoin } from 'rxjs';
import { Router, RouterModule } from '@angular/router';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, AfterViewInit {
  private cultivosService = inject(CultivosService);
  private plagasService = inject(PlagasService);
  private productosService = inject(ProductosService);
  private reportesService = inject(ReportesService);
  private alertasService = inject(AlertasService);
  private router = inject(Router);

  stats = signal<any[]>([]);
  reportesStats = signal<any>({ total: 0, pendientes: 0, validados: 0, rechazados: 0 });
  plagasChartData = signal<{ nombre: string; count: number }[]>([]);

  ngOnInit() {
    this.loadStats();
  }

  ngAfterViewInit() {
    setTimeout(() => this.initCharts(), 500);
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  loadStats() {
    forkJoin({
      cultivos: this.cultivosService.findAll(),
      plagas: this.plagasService.findAll(),
      productos: this.productosService.findAll(),
      reportes: this.reportesService.findAll(),
      pendientes: this.reportesService.findPendientes(),
      alertas: this.alertasService.findAllAlertas(),
    }).subscribe(data => {
      const totalReportes = data.reportes.length;
      const pendientes = data.pendientes.length;
      const validados = data.reportes.filter(r => r.estado === 'VALIDADO').length;
      const rechazados = data.reportes.filter(r => r.estado === 'RECHAZADO').length;
      const alertasActivas = data.alertas.filter(a => !a.leida).length;

      this.stats.set([
        { label: 'Cultivos', value: data.cultivos.length, icon: 'pi pi-map', color: 'bg-green-100 text-green-700', trend: 'Catálogo de plantas', route: '/cultivos' },
        { label: 'Plagas/Enf.', value: data.plagas.length, icon: 'pi pi-exclamation-triangle', color: 'bg-orange-100 text-orange-700', trend: 'Amenazas registradas', route: '/plagas' },
        { label: 'Productos', value: data.productos.length, icon: 'pi pi-box', color: 'bg-blue-100 text-blue-700', trend: 'Insumos registrados', route: '/productos' },
        { label: 'Reportes', value: totalReportes, icon: 'pi pi-inbox', color: 'bg-indigo-100 text-indigo-700', trend: `${pendientes} pendientes`, route: '/reportes' },
        { label: 'Alertas', value: alertasActivas, icon: 'pi pi-bell', color: 'bg-purple-100 text-purple-700', trend: alertasActivas > 0 ? `${alertasActivas} activas` : 'Sin alertas', route: '/zonas-alerta' },
      ]);

      this.reportesStats.set({ total: totalReportes, pendientes, validados, rechazados });

      // Count reports by pest for the chart
      const plagaCount: Record<string, number> = {};
      for (const r of data.reportes) {
        if (r.plagaId) {
          const plaga = data.plagas.find(p => p.id === r.plagaId);
          const name = plaga?.nombre || `Plaga #${r.plagaId}`;
          plagaCount[name] = (plagaCount[name] || 0) + 1;
        }
      }
      const sorted = Object.entries(plagaCount)
        .map(([nombre, count]) => ({ nombre, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);
      this.plagasChartData.set(sorted);
      setTimeout(() => this.initCharts(), 200);
    });
  }

  private initCharts() {
    this.initReportesChart();
    this.initPlagasChart();
  }

  private initReportesChart() {
    const el = document.getElementById('reportes-chart') as HTMLCanvasElement;
    if (!el) return;
    const ctx = el.getContext('2d');
    if (!ctx) return;
    const s = this.reportesStats();
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Pendientes', 'Validados', 'Rechazados', 'Comunidad'],
        datasets: [{
          data: [s.pendientes, s.validados, s.rechazados, s.total - s.pendientes - s.validados - s.rechazados],
          backgroundColor: ['#f59e0b', '#10b981', '#ef4444', '#6366f1'],
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
      },
    });
  }

  private initPlagasChart() {
    const el = document.getElementById('plagas-chart') as HTMLCanvasElement;
    if (!el) return;
    const ctx = el.getContext('2d');
    if (!ctx) return;
    const data = this.plagasChartData();
    if (data.length === 0) return;
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => d.nombre),
        datasets: [{
          label: 'Reportes',
          data: data.map(d => d.count),
          backgroundColor: '#10b981',
          borderRadius: 8,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true, ticks: { stepSize: 1 } },
          y: { ticks: { font: { size: 11 } } },
        },
      },
    });
  }
}
