import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ImageModule } from 'primeng/image';
import { TagModule } from 'primeng/tag';
import { TimelineModule } from 'primeng/timeline';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ReportesService } from '../../../core/services/reportes';
import { MultimediaService } from '../../../core/services/multimedia';
import { CultivosService } from '../../../core/services/cultivos';
import { PlagasService } from '../../../core/services/plagas';
import { RecomendacionesService } from '../../../core/services/recomendaciones';
import { EstadoReporte, Reporte, ReporteHistorialEstado } from '../../../core/models/reporte.model';
import { TratamientoForm } from '../../tratamientos/tratamiento-form/tratamiento-form';
import { TratamientoOficial } from '../../../core/models/tratamiento.model';

@Component({
  selector: 'app-reporte-detail',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    ButtonModule,
    DialogModule,
    ImageModule,
    TagModule,
    TimelineModule,
    ToastModule,
    ConfirmDialogModule,
    TratamientoForm
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './reporte-detail.html',
  styleUrl: './reporte-detail.css'
})
export class ReporteDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);
  private reportesService = inject(ReportesService);
  private multimediaService = inject(MultimediaService);
  private cultivosService = inject(CultivosService);
  private plagasService = inject(PlagasService);
  private recomendacionesService = inject(RecomendacionesService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  reporte = signal<Reporte | null>(null);
  historial = signal<ReporteHistorialEstado[]>([]);
  loading = signal(false);
  treatmentDialog = signal(false);
  cultivosMap = signal<Record<number, string>>({});
  plagasMap = signal<Record<number, string>>({});

  fixedImages = computed(() => (this.reporte()?.imagenesUrls ?? []).map(url => this.multimediaService.fixMinioUrl(url)));
  fixedAudio = computed(() => this.multimediaService.fixMinioUrl(this.reporte()?.audioUrl));
  mapUrl = computed<SafeResourceUrl | null>(() => {
    const item = this.reporte();
    if (!item) return null;
    const delta = 0.01;
    const bbox = `${item.longitud - delta},${item.latitud - delta},${item.longitud + delta},${item.latitud + delta}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${item.latitud},${item.longitud}`);
  });

  ngOnInit() {
    this.loadCatalogMaps();
    this.loadReporte();
  }

  loadReporte() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) return;

    this.loading.set(true);
    this.reportesService.findById(id).subscribe({
      next: data => {
        this.reporte.set(data);
        this.loading.set(false);
        this.loadHistorial(id);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'No encontrado', detail: 'No se pudo cargar el reporte.' });
        this.loading.set(false);
      }
    });
  }

  loadHistorial(id: number) {
    this.reportesService.getHistorial(id).subscribe({
      next: data => this.historial.set(data),
      error: () => this.historial.set([])
    });
  }

  volver() {
    this.router.navigate(['/reportes']);
  }

  openMaps() {
    const item = this.reporte();
    if (!item) return;
    window.open(`https://www.google.com/maps?q=${item.latitud},${item.longitud}`, '_blank');
  }

  marcarComunidad() {
    const item = this.reporte();
    if (!item) return;

    this.confirmationService.confirm({
      message: 'Se creará una consulta comunitaria visible en el foro y el reporte pasará a estado COMUNIDAD.',
      header: 'Enviar a comunidad',
      icon: 'pi pi-comments',
      accept: () => this.crearConsultaComunitaria(item)
    });
  }

  rechazar() {
    const item = this.reporte();
    if (!item) return;
    this.confirmationService.confirm({
      message: '¿Seguro que deseas rechazar este reporte?',
      header: 'Confirmar rechazo',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.cambiarEstado(item.id, 'RECHAZADO', 'Reporte rechazado por moderación')
    });
  }

  onTratamientoSaved(_tratamiento: TratamientoOficial) {
    const item = this.reporte();
    this.treatmentDialog.set(false);
    if (!item) return;
    this.messageService.add({ severity: 'success', summary: 'Reporte validado', detail: 'El tratamiento oficial fue emitido correctamente.' });
    this.loadReporte();
  }

  cultivoNombre(id?: number) {
    return id ? this.cultivosMap()[id] ?? `Cultivo #${id}` : 'Sin cultivo';
  }

  plagaNombre(id?: number | null) {
    return id ? this.plagasMap()[id] ?? `Plaga #${id}` : 'Sin diagnóstico';
  }

  estadoSeverity(estado?: EstadoReporte): 'warn' | 'info' | 'success' | 'danger' | 'secondary' {
    if (!estado) return 'secondary';
    const map: Record<EstadoReporte, 'warn' | 'info' | 'success' | 'danger'> = {
      PENDIENTE: 'warn',
      COMUNIDAD: 'info',
      VALIDADO: 'success',
      RECHAZADO: 'danger'
    };
    return map[estado];
  }

  private cambiarEstado(id: number, estado: EstadoReporte, motivo: string) {
    this.reportesService.cambiarEstado(id, { estado, motivo }).subscribe({
      next: reporte => {
        this.reporte.set(reporte);
        this.loadHistorial(id);
        this.messageService.add({ severity: 'success', summary: 'Estado actualizado', detail: `Reporte marcado como ${estado}.` });
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el estado.' })
    });
  }

  private crearConsultaComunitaria(item: Reporte) {
    this.recomendacionesService.create({
      reporteId: item.id,
      cultivoId: item.cultivoId,
      plagaId: item.plagaId ?? undefined,
      titulo: `Consulta comunitaria: ${item.titulo}`,
      descripcion: item.descripcion || item.descripcionProblema || 'Reporte derivado a comunidad para recibir recomendaciones de agricultores.',
      tipo: 'CONSULTA'
    }).subscribe({
      next: () => this.cambiarEstado(item.id, 'COMUNIDAD', 'Derivado a revisión comunitaria'),
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo publicar el reporte en comunidad.' })
    });
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
