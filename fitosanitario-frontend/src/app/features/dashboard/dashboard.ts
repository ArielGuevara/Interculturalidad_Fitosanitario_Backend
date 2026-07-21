import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { CultivosService } from '../../core/services/cultivos';
import { PlagasService } from '../../core/services/plagas';
import { ProductosService } from '../../core/services/productos';
import { ReportesService } from '../../core/services/reportes';
import { InformesService } from '../../core/services/informes';
import { forkJoin } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, ButtonModule, DialogModule, SelectModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private cultivosService = inject(CultivosService);
  private plagasService = inject(PlagasService);
  private productosService = inject(ProductosService);
  private reportesService = inject(ReportesService);
  private informesService = inject(InformesService);
  private router = inject(Router);

  stats = signal<any[]>([]);
  reportesStats = signal<any>({ total: 0, pendientes: 0, validados: 0, rechazados: 0 });

  reportesBarPct = computed(() => {
    const s = this.reportesStats();
    const max = Math.max(s.pendientes, s.validados, s.rechazados, 1);
    return {
      pendientes: (s.pendientes / max) * 100,
      validados: (s.validados / max) * 100,
      rechazados: (s.rechazados / max) * 100,
    };
  });

  // Diálogos
  dialogoCultivos = false;
  dialogoPlagas = false;
  dialogoUsuarios = false;
  dialogoProductos = false;
  dialogoTratamientos = false;

  // Filtros
  filtroCultivoId: number | null = null;
  filtroRol: string | null = null;
  filtroTipoProducto: string | null = null;
  cargando = false;
  cargandoPreview = false;

  cultivosList: any[] = [];
  rolesOptions = [
    { label: 'Agricultores', value: 'AGRICULTOR' },
    { label: 'Moderadores', value: 'MODERADOR' },
    { label: 'Administradores', value: 'ADMIN' },
  ];
  tipoProductoOptions = [
    { label: 'Insecticida', value: 'INSECTICIDA' },
    { label: 'Fungicida', value: 'FUNGICIDA' },
    { label: 'Herbicida', value: 'HERBICIDA' },
    { label: 'Biológico', value: 'BIOLOGICO' },
  ];

  ngOnInit() {
    this.loadStats();
    this.cargarCultivos();
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  cargarCultivos() {
    this.cultivosService.findAll().subscribe(data => {
      this.cultivosList = data;
    });
  }

  loadStats() {
    forkJoin({
      cultivos: this.cultivosService.findAll(),
      plagas: this.plagasService.findAll(),
      productos: this.productosService.findAll(),
      reportes: this.reportesService.findAll(),
      pendientes: this.reportesService.findPendientes(),
    }).subscribe(data => {
      const totalReportes = data.reportes.length;
      const pendientes = data.pendientes.length;
      const validados = data.reportes.filter(r => r.estado === 'VALIDADO').length;
      const rechazados = data.reportes.filter(r => r.estado === 'RECHAZADO').length;

      this.stats.set([
        { label: 'Cultivos', value: data.cultivos.length, icon: 'pi pi-map', color: 'bg-green-100 text-green-700', trend: 'Catálogo de plantas', route: '/cultivos' },
        { label: 'Plagas/Enf.', value: data.plagas.length, icon: 'pi pi-exclamation-triangle', color: 'bg-orange-100 text-orange-700', trend: 'Amenazas registradas', route: '/plagas' },
        { label: 'Productos', value: data.productos.length, icon: 'pi pi-box', color: 'bg-blue-100 text-blue-700', trend: 'Insumos registrados', route: '/productos' },
        { label: 'Reportes', value: totalReportes, icon: 'pi pi-inbox', color: 'bg-indigo-100 text-indigo-700', trend: `${pendientes} pendientes`, route: '/reportes' },
      ]);

      this.reportesStats.set({ total: totalReportes, pendientes, validados, rechazados });
    });
  }

  generarInforme(tipo: string) {
    this.cargando = true;
    this._generarYDescargar(tipo, true);
  }

  previsualizarInforme(tipo: string) {
    this.cargandoPreview = true;
    const filtros = this._buildFiltros(tipo);

    this.informesService.generar(tipo, filtros).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        this.cargandoPreview = false;
      },
      error: () => {
        this.cargandoPreview = false;
      },
    });
  }

  private _buildFiltros(tipo: string): any {
    const filtros: any = {};
    if (tipo === 'plagas' || tipo === 'tratamientos') {
      if (this.filtroCultivoId) filtros.cultivoId = this.filtroCultivoId;
    }
    if (tipo === 'usuarios' && this.filtroRol) {
      filtros.rol = this.filtroRol;
    }
    if (tipo === 'productos' && this.filtroTipoProducto) {
      filtros.tipoProducto = this.filtroTipoProducto;
    }
    return filtros;
  }

  private _generarYDescargar(tipo: string, cerrarDialogo: boolean) {
    const filtros = this._buildFiltros(tipo);

    this.informesService.generar(tipo, filtros).subscribe({
      next: (blob) => {
        this.downloadPdf(blob, `informe_${tipo}.pdf`);
        if (cerrarDialogo) this.cerrarDialogos();
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
      },
    });
  }

  private downloadPdf(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  resetFiltros() {
    this.filtroCultivoId = null;
    this.filtroRol = null;
    this.filtroTipoProducto = null;
  }

  private cerrarDialogos() {
    this.dialogoCultivos = false;
    this.dialogoPlagas = false;
    this.dialogoUsuarios = false;
    this.dialogoProductos = false;
    this.dialogoTratamientos = false;
    this.resetFiltros();
  }
}
