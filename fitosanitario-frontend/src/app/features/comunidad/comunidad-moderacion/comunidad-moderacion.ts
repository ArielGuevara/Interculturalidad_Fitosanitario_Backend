import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { RecomendacionesService } from '../../../core/services/recomendaciones';
import { ComentarioForo, RecomendacionComunidad, TipoRecomendacion } from '../../../core/models/recomendacion.model';
import { TratamientoForm } from '../../tratamientos/tratamiento-form/tratamiento-form';

@Component({
  selector: 'app-comunidad-moderacion',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
    ButtonModule,
    ConfirmDialogModule,
    DialogModule,
    SelectModule,
    TableModule,
    TagModule,
    ToastModule,
    TooltipModule,
    TratamientoForm
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './comunidad-moderacion.html',
  styleUrl: './comunidad-moderacion.css'
})
export class ComunidadModeracion implements OnInit {
  private recomendacionesService = inject(RecomendacionesService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  recomendaciones = signal<RecomendacionComunidad[]>([]);
  loading = signal(false);
  selectedTipo = signal<TipoRecomendacion | undefined>(undefined);
  selectedRecomendacion = signal<RecomendacionComunidad | null>(null);
  selectedComentariosRecomendacion = signal<RecomendacionComunidad | null>(null);
  comentarios = signal<ComentarioForo[]>([]);
  treatmentDialog = signal(false);
  commentsDialog = signal(false);
  loadingComentarios = signal(false);

  tipos: { label: string; value?: TipoRecomendacion }[] = [
    { label: 'Todos', value: undefined },
    { label: 'Recomendación', value: 'RECOMENDACION' },
    { label: 'Consulta', value: 'CONSULTA' },
    { label: 'Conocimiento ancestral', value: 'CONOCIMIENTO_ANCESTRAL' }
  ];

  ngOnInit() {
    this.loadRecomendaciones();
  }

  loadRecomendaciones() {
    this.loading.set(true);
    this.recomendacionesService.findAll({ tipo: this.selectedTipo() }).subscribe({
      next: data => {
        this.recomendaciones.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la comunidad.' });
        this.loading.set(false);
      }
    });
  }

  onTipoChange(value: TipoRecomendacion | undefined) {
    this.selectedTipo.set(value);
    this.loadRecomendaciones();
  }

  aprobar(rec: RecomendacionComunidad) {
    this.recomendacionesService.moderar(rec.id, true).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Moderada', detail: 'La recomendación fue marcada como revisada.' });
        this.loadRecomendaciones();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo moderar la recomendación.' })
    });
  }

  toggleActivo(rec: RecomendacionComunidad) {
    this.recomendacionesService.toggle(rec.id).subscribe({
      next: () => {
        const msg = rec.activo ? 'Foro deshabilitado — ya no se aceptan más mensajes' : 'Foro habilitado';
        this.messageService.add({ severity: 'success', summary: 'Estado cambiado', detail: msg });
        this.loadRecomendaciones();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cambiar el estado del foro.' })
    });
  }

  eliminar(rec: RecomendacionComunidad) {
    this.confirmationService.confirm({
      message: `¿Deseas desactivar la recomendación "${rec.titulo}"?`,
      header: 'Moderación de contenido',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.recomendacionesService.remove(rec.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Contenido desactivado', detail: 'La recomendación ya no estará visible.' });
            this.loadRecomendaciones();
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo desactivar la recomendación.' })
        });
      }
    });
  }

  verComentarios(rec: RecomendacionComunidad) {
    this.selectedComentariosRecomendacion.set(rec);
    this.commentsDialog.set(true);
    this.loadComentarios(rec.id);
  }

  loadComentarios(recomendacionId: number) {
    this.loadingComentarios.set(true);
    this.recomendacionesService.getComentarios(recomendacionId).subscribe({
      next: data => {
        this.comentarios.set(data);
        this.loadingComentarios.set(false);
      },
      error: () => {
        this.comentarios.set([]);
        this.loadingComentarios.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los comentarios.' });
      }
    });
  }

  eliminarComentario(comentario: ComentarioForo) {
    this.confirmationService.confirm({
      message: '¿Deseas desactivar este comentario del foro?',
      header: 'Moderación de comentario',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.recomendacionesService.removeComentario(comentario.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Comentario desactivado', detail: 'El comentario ya no estará visible en el foro.' });
            const rec = this.selectedComentariosRecomendacion();
            if (rec) this.loadComentarios(rec.id);
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo desactivar el comentario.' })
        });
      }
    });
  }

  usarComoTratamiento(rec: RecomendacionComunidad) {
    if (!rec.cultivo?.id || !rec.plaga?.id) {
      this.messageService.add({
        severity: 'info',
        summary: 'Complete el contexto',
        detail: 'Seleccione cultivo y plaga en el formulario antes de guardar el tratamiento.',
      });
    }
    this.selectedRecomendacion.set(rec);
    this.treatmentDialog.set(true);
  }

  onTratamientoSaved() {
    const rec = this.selectedRecomendacion();
    this.treatmentDialog.set(false);
    this.selectedRecomendacion.set(null);
    if (rec && !rec.moderado) {
      this.aprobar(rec);
    }
  }

  tipoLabel(tipo: TipoRecomendacion) {
    const labels: Record<TipoRecomendacion, string> = {
      RECOMENDACION: 'Recomendación',
      CONSULTA: 'Consulta',
      CONOCIMIENTO_ANCESTRAL: 'Ancestral'
    };
    return labels[tipo];
  }
}
