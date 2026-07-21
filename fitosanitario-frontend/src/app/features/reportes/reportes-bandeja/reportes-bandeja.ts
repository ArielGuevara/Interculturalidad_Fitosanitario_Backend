import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';
import { ReportesService } from '../../../core/services/reportes';
import { CultivosService } from '../../../core/services/cultivos';
import { PlagasService } from '../../../core/services/plagas';
import { EstadoReporte, Reporte } from '../../../core/models/reporte.model';

@Component({
  selector: 'app-reportes-bandeja',
  standalone: true,
  imports: [
    CommonModule, FormsModule, DatePipe,
    ButtonModule, TableModule, TagModule, ToastModule,
    InputTextModule, SelectModule, DatePickerModule,
  ],
  providers: [MessageService],
  templateUrl: './reportes-bandeja.html',
  styleUrl: './reportes-bandeja.css'
})
export class ReportesBandeja implements OnInit {
  private reportesService = inject(ReportesService);
  private cultivosService = inject(CultivosService);
  private plagasService = inject(PlagasService);
  private messageService = inject(MessageService);
  private router = inject(Router);

  reportes = signal<Reporte[]>([]);
  loading = signal(false);
  cultivosMap = signal<Record<number, string>>({});
  plagasMap = signal<Record<number, string>>({});
  cultivos = signal<any[]>([]);

  filtroCultivo: number | null = null;
  filtroQ = '';
  filtroFechaInicio: Date | null = null;
  filtroFechaFin: Date | null = null;

  ngOnInit() {
    this.loadCatalogMaps();
    this.loadReportes();
  }

  loadReportes() {
    this.loading.set(true);
    const params: any = {};
    if (this.filtroCultivo) params.cultivoId = this.filtroCultivo;
    if (this.filtroQ?.trim()) params.q = this.filtroQ.trim();
    if (this.filtroFechaInicio) params.fechaInicio = this.filtroFechaInicio.toISOString();
    if (this.filtroFechaFin) params.fechaFin = this.filtroFechaFin.toISOString();
    this.reportesService.findAll(params).subscribe({
      next: data => {
        this.reportes.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la bandeja de reportes.' });
        this.loading.set(false);
      }
    });
  }

  revisar(reporte: Reporte) {
    this.router.navigate(['/reportes', reporte.id]);
  }

  cultivoNombre(id: number) {
    return this.cultivosMap()[id] ?? `Cultivo #${id}`;
  }

  plagaNombre(id?: number | null) {
    return id ? this.plagasMap()[id] ?? `Plaga #${id}` : 'Sin diagnóstico';
  }

  estadoLabel(estado: EstadoReporte): string {
    const map: Record<EstadoReporte, string> = {
      PENDIENTE: 'Pendiente',
      COMUNIDAD: 'En comunidad',
      VALIDADO: 'Validado',
      RECHAZADO: 'Rechazado',
      VOLVER_A_REPORTAR: 'Devuelto'
    };
    return map[estado] ?? estado;
  }

  estadoSeverity(estado: EstadoReporte): 'warn' | 'info' | 'success' | 'danger' | 'secondary' | 'contrast' {
    const map: Record<EstadoReporte, 'warn' | 'info' | 'success' | 'danger' | 'contrast'> = {
      PENDIENTE: 'warn',
      COMUNIDAD: 'info',
      VALIDADO: 'success',
      RECHAZADO: 'danger',
      VOLVER_A_REPORTAR: 'contrast'
    };
    return map[estado] ?? 'secondary';
  }

  agricultorNombre(reporte: any): string {
    return reporte.usuario?.nombre || `Usuario #${reporte.usuarioId}`;
  }

  private loadCatalogMaps() {
    this.cultivosService.findAll().subscribe({
      next: data => {
        this.cultivos.set(data);
        this.cultivosMap.set(Object.fromEntries(data.map(c => [c.id!, c.nombre])));
      }
    });
    this.plagasService.findAll().subscribe({
      next: data => this.plagasMap.set(Object.fromEntries(data.map(p => [p.id!, p.nombre])))
    });
  }
}
