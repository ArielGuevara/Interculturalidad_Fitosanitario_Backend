import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ImageModule } from 'primeng/image';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
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
    FormsModule,
    DatePipe,
    ButtonModule,
    DialogModule,
    ImageModule,
    TextareaModule,
    InputNumberModule,
    SelectModule,
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

  volverAReportarDialog = signal(false);
  volverMotivo = signal('');
  volverInputMode = signal<'texto' | 'audio'>('texto');
  volverAudioBlob = signal<Blob | null>(null);
  volverAudioUrl = signal('');
  isRecording = signal(false);
  mediaRecorderRef: MediaRecorder | null = null;
  audioChunks: Blob[] = [];

  suspenderDialog = signal(false);
  suspenderMotivo = signal('');
  suspenderTipo: 'TIEMPO' | 'DIAS' = 'TIEMPO';
  suspenderDuracion = 10;

  fixedImages = computed(() => (this.reporte()?.imagenesUrls ?? []).map(url => this.multimediaService.fixMinioUrl(url)));
  fixedAudio = computed(() => this.multimediaService.fixMinioUrl(this.reporte()?.audioUrl));
  fixedAudioRechazo = computed(() => this.multimediaService.fixMinioUrl(this.reporte()?.audioRechazoUrl));
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

  estadoSeverity(estado?: EstadoReporte): 'warn' | 'info' | 'success' | 'danger' | 'secondary' | 'contrast' {
    if (!estado) return 'secondary';
    const map: Record<EstadoReporte, 'warn' | 'info' | 'success' | 'danger'> = {
      PENDIENTE: 'warn',
      COMUNIDAD: 'info',
      VALIDADO: 'success',
      RECHAZADO: 'danger',
      VOLVER_A_REPORTAR: 'warn'
    };
    return map[estado];
  }

  estadoLabel(estado?: EstadoReporte): string {
    if (!estado) return '';
    const map: Record<EstadoReporte, string> = {
      PENDIENTE: 'Pendiente',
      COMUNIDAD: 'Comunidad',
      VALIDADO: 'Validado',
      RECHAZADO: 'Rechazado',
      VOLVER_A_REPORTAR: 'Volver a reportar'
    };
    return map[estado];
  }

  // ── Volver a reportar ──────────────────────────────────
  openVolverAReportar() {
    this.volverInputMode.set('texto');
    this.volverMotivo.set('');
    this.volverAudioBlob.set(null);
    this.volverAudioUrl.set('');
    this.audioChunks = [];
    this.volverAReportarDialog.set(true);
  }

  setVolverMode(mode: 'texto' | 'audio') {
    this.volverInputMode.set(mode);
    if (mode === 'audio') {
      this.volverMotivo.set('');
    } else {
      this.removeAudioRechazo();
      if (this.mediaRecorderRef && this.mediaRecorderRef.state !== 'inactive') {
        this.mediaRecorderRef.stop();
        this.isRecording.set(false);
      }
    }
  }

  async startRecordingAudio() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorderRef = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      this.audioChunks = [];

      this.mediaRecorderRef.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorderRef.onstop = () => {
        const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.volverAudioBlob.set(blob);
        this.volverAudioUrl.set(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };

      this.mediaRecorderRef.start();
      this.isRecording.set(true);
    } catch {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo acceder al micrófono.' });
    }
  }

  stopRecordingAudio() {
    if (this.mediaRecorderRef && this.mediaRecorderRef.state !== 'inactive') {
      this.mediaRecorderRef.stop();
      this.isRecording.set(false);
    }
  }

  removeAudioRechazo() {
    this.volverAudioBlob.set(null);
    this.volverAudioUrl.set('');
    this.audioChunks = [];
  }

  confirmVolverAReportar() {
    const item = this.reporte();
    if (!item) return;

    const formData = new FormData();
    if (this.volverInputMode() === 'texto') {
      if (!this.volverMotivo().trim()) {
        this.messageService.add({ severity: 'warn', summary: 'Requerido', detail: 'Debes escribir un motivo.' });
        return;
      }
      formData.append('motivo', this.volverMotivo());
    } else {
      if (!this.volverAudioBlob()) {
        this.messageService.add({ severity: 'warn', summary: 'Requerido', detail: 'Debes grabar un audio.' });
        return;
      }
      formData.append('audio', this.volverAudioBlob()!, 'rechazo.webm');
    }

    this.reportesService.volverAReportar(item.id, formData).subscribe({
      next: () => {
        this.volverAReportarDialog.set(false);
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Reporte devuelto para corrección.' });
        this.loadReporte();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo procesar.' })
    });
  }

  // ── Suspender cuenta ──────────────────────────────────
  openSuspender() {
    this.suspenderMotivo.set('');
    this.suspenderTipo = 'TIEMPO';
    this.suspenderDuracion = 10;
    this.suspenderDialog.set(true);
  }

  confirmSuspender() {
    const item = this.reporte();
    if (!item) return;
    if (!this.suspenderMotivo().trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Requerido', detail: 'Debes escribir una causa.' });
      return;
    }

    this.reportesService.suspenderUsuario(item.id, {
      motivo: this.suspenderMotivo(),
      tipoDuracion: this.suspenderTipo,
      duracion: Number(this.suspenderDuracion)
    }).subscribe({
      next: () => {
        this.suspenderDialog.set(false);
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Cuenta suspendida.' });
      },
      error: (err) => {
        const msg = err?.error?.message || err?.message || 'No se pudo suspender la cuenta.';
        this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
      }
    });
  }

  onTipoChange(tipo: string) {
    this.suspenderTipo = tipo as 'TIEMPO' | 'DIAS';
    this.suspenderDuracion = tipo === 'TIEMPO' ? 10 : 1;
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
