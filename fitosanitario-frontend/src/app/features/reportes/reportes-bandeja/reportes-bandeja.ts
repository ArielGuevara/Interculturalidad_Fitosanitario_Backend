import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ReportesService } from '../../../core/services/reportes';
import { CultivosService } from '../../../core/services/cultivos';
import { PlagasService } from '../../../core/services/plagas';
import { EstadoReporte, Reporte } from '../../../core/models/reporte.model';

@Component({
  selector: 'app-reportes-bandeja',
  standalone: true,
  imports: [CommonModule, DatePipe, ButtonModule, TableModule, TagModule, ToastModule],
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

  ngOnInit() {
    this.loadCatalogMaps();
    this.loadReportes();
  }

  loadReportes() {
    this.loading.set(true);
    this.reportesService.findPendientes().subscribe({
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

  estadoSeverity(estado: EstadoReporte): 'warn' | 'info' | 'success' | 'danger' | 'secondary' {
    const map: Record<EstadoReporte, 'warn' | 'info' | 'success' | 'danger'> = {
      PENDIENTE: 'warn',
      COMUNIDAD: 'info',
      VALIDADO: 'success',
      RECHAZADO: 'danger'
    };
    return map[estado] ?? 'secondary';
  }

  private loadCatalogMaps() {
    this.cultivosService.findAll().subscribe({
      next: data => this.cultivosMap.set(Object.fromEntries(data.map(c => [c.id!, c.nombre])))
    });
    this.plagasService.findAll().subscribe({
      next: data => this.plagasMap.set(Object.fromEntries(data.map(p => [p.id!, p.nombre])))
    });
  }
}
