import { Component, inject, signal, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { environment } from '../../../../environments/environment';
import { RecomendacionesService } from '../../../core/services/recomendaciones';
import { CultivosService } from '../../../core/services/cultivos';
import { PlagasService } from '../../../core/services/plagas';
import { AuthService } from '../../../core/services/auth';
import { MultimediaService } from '../../../core/services/multimedia';
import type { RecomendacionComunidad, ComentarioForo } from '../../../core/models/recomendacion.model';
import type { Cultivo } from '../../../core/models/cultivo.model';
import type { Plaga } from '../../../core/models/plaga.model';
interface InteraccionesResponse {
    comentarios: ComentarioForo[];
    valoraciones: {
        id: number;
        puntuacion: number;
        comentario?: string;
        createdAt: string;
        usuario?: { id: number; nombre: string };
    }[];
}

interface SaberAncestralFilter {
    q?: string;
    estado?: string;
    cultivoId?: number;
    plagaId?: number;
}

@Component({
    selector: 'app-comunidad-moderacion',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        InputTextModule,
        InputNumberModule,
        TextareaModule,
        TagModule,
        SelectModule,
        TooltipModule,
        ToastModule,
        ConfirmDialogModule,
        DialogModule,
    ],
    templateUrl: './comunidad-moderacion.html',
    styleUrl: './comunidad-moderacion.css',
    providers: [MessageService, ConfirmationService],
})
export class ComunidadModeracionComponent {
    private recomendacionesService = inject(RecomendacionesService);
    private cultivosService = inject(CultivosService);
    private plagasService = inject(PlagasService);
    private authService = inject(AuthService);
    private multimediaService = inject(MultimediaService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);
    private router = inject(Router);
    private ngZone = inject(NgZone);

    // Tab
    tabActivo = signal<'foro' | 'saberes'>('foro');

    // Foro
    recomendaciones = signal<RecomendacionComunidad[]>([]);
    loading = signal(false);
    filtroTipoForo = '';
    tiposForo = [
        { label: 'Recomendaciones', value: 'RECOMENDACION' },
        { label: 'Consultas', value: 'CONSULTA' },
    ];

    // Saberes
    saberes = signal<RecomendacionComunidad[]>([]);
    loadingSaberes = signal(false);
    filtroQ = '';
    filtroEstado = '';
    filtroCultivoId: number | undefined;
    filtroPlagaId: number | undefined;
    estadosOptions = [
        { label: 'Pendiente', value: 'pendientes' },
        { label: 'Publicado', value: 'publicados' },
        { label: 'Rechazado', value: 'rechazados' },
        { label: 'Expirado', value: 'expirados' },
    ];
    cultivosList: Cultivo[] = [];
    plagasList: Plaga[] = [];

    // Diálogos Saber Ancestral
    selectedSaber = signal<RecomendacionComunidad | null>(null);
    dialogAceptar = false;
    dialogRechazar = false;
    dialogRevisar = false;
    dialogPromover = false;
    dialogEditar = false;
    duracionDias = 30;
    duracionDiasError = false;
    motivoRechazo = '';
    motivoRechazoError = false;
    cargandoAceptar = false;
    cargandoRechazar = false;
    cargandoPromover = false;
    cargandoEditar = false;

    // Interacciones
    interacciones = signal<InteraccionesResponse>({ comentarios: [], valoraciones: [] });
    cargandoInteracciones = signal(false);
    selectedComentario = signal<ComentarioForo | null>(null);

    // Promover
    comentarioModeradorPromover = '';

    // Editar
    editData = signal<{
        comentarioModerador: string;
        activo: boolean;
        fechaExpiracion: string | null;
    } | null>(null);
    editarDuracionExtra = 0;

    // Ver Foro dialog
    verForoDialog = false;
    selectedForoVer = signal<RecomendacionComunidad | null>(null);
    comentarios = signal<ComentarioForo[]>([]);
    loadingComentarios = signal(false);

    // Editar Foro dialog
    dialogEditarForo = false;
    selectedForoEditar = signal<RecomendacionComunidad | null>(null);
    foroEditActivo = true;
    foroEditDuracionExtra = 0;
    cargandoEditarForo = false;

    // Chat Ver Foro
    nuevoComentarioForo = '';
    enviandoComentarioForo = false;
    replyToForo: { id: number; username: string; contenido: string; tipoMedia?: string } | null = null;
    grabandoAudio = false;
    pausaGrabacion = false;
    audioUriForo: string | null = null;
    currentUserId: number | null = null;
    imagenForoFile: File | null = null;
    imagenForoPreview: string | null = null;
    // Recording timer
    tiempoGrabacion = 0;
    grabacionTimer: any = null;
    // Audio preview seek
    audioPreviewDuration = 0;
    audioPreviewCurrentTime = 0;
    previewAudioInterval: any = null;
    // Bubble audio tracking
    audioBubbleStates = new Map<number, { currentTime: number; duration: number }>();

    constructor() {
        this.currentUserId = this.authService.currentUser()?.id ?? null;
        this.loadCultivos();
        this.loadPlagas();
        this.loadRecomendaciones();
    }

    // ── Tab switching ──
    switchTab(tab: 'foro' | 'saberes') {
        this.tabActivo.set(tab);
        if (tab === 'foro' && this.recomendaciones().length === 0) {
            this.loadRecomendaciones();
        } else if (tab === 'saberes' && this.saberes().length === 0) {
            this.loadSaberes();
        }
    }

    // ── Helpers ──
    tipoLabel(tipo: string): string {
        const map: Record<string, string> = { RECOMENDACION: 'Recomendación', CONSULTA: 'Consulta', CONOCIMIENTO_ANCESTRAL: 'Saber Ancestral' };
        return map[tipo] || tipo;
    }

    pasoFecha(fecha: string): boolean {
        return new Date(fecha) < new Date();
    }

    // ── Load lists ──
    private loadCultivos() {
        this.cultivosService.findAll().subscribe((res: any) => {
            this.cultivosList = res?.data || res || [];
        });
    }

    private loadPlagas() {
        this.plagasService.findAll().subscribe((res: any) => {
            this.plagasList = res?.data || res || [];
        });
    }

    // ── Load foro ──
    loadRecomendaciones() {
        this.loading.set(true);
        const params: any = {};
        if (this.filtroTipoForo) params.tipo = this.filtroTipoForo;
        this.recomendacionesService.findAll(params).subscribe({
            next: (res: any) => {
                this.recomendaciones.set(res?.data || res || []);
                this.loading.set(false);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las publicaciones.' });
                this.loading.set(false);
            },
        });
    }

    // ── Load saberes ──
    loadSaberes() {
        this.loadingSaberes.set(true);
        const filtros: SaberAncestralFilter = {};
        if (this.filtroQ) filtros.q = this.filtroQ;
        if (this.filtroEstado) filtros.estado = this.filtroEstado;
        if (this.filtroCultivoId) filtros.cultivoId = this.filtroCultivoId;
        if (this.filtroPlagaId) filtros.plagaId = this.filtroPlagaId;
        this.recomendacionesService.findAllSaberes(filtros).subscribe({
            next: (res: any) => {
                this.ngZone.runOutsideAngular(() => {
                    this.saberes.set(res?.data || res || []);
                    this.loadingSaberes.set(false);
                });
            },
            error: () => {
                this.ngZone.runOutsideAngular(() => this.loadingSaberes.set(false));
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los saberes ancestrales.' });
            },
        });
    }

    // Foro moderation dialogs
    selectedForo = signal<RecomendacionComunidad | null>(null);
    dialogAprobarForo = false;
    dialogRechazarForo = false;
    duracionDiasForo = 30;
    foroDuracionDiasError = false;
    motivoRechazoForo = '';
    foroMotivoRechazoError = false;
    cargandoAprobarForo = false;
    cargandoRechazarForo = false;

    // ── Aprobar (Foro) ──
    abrirAprobarForo(rec: RecomendacionComunidad) {
        this.selectedForo.set(rec);
        this.duracionDiasForo = 30;
        this.foroDuracionDiasError = false;
        this.dialogAprobarForo = true;
    }

    aprobarForo() {
        const foro = this.selectedForo();
        if (!foro) return;
        if (!this.duracionDiasForo || this.duracionDiasForo < 1) {
            this.foroDuracionDiasError = true;
            return;
        }
        this.foroDuracionDiasError = false;
        this.cargandoAprobarForo = true;
        this.recomendacionesService.moderarConDuracion(foro.id, { moderado: true, duracionDias: this.duracionDiasForo }).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Publicado', detail: `Foro publicado por ${this.duracionDiasForo} días hábiles.` });
                this.dialogAprobarForo = false;
                this.cargandoAprobarForo = false;
                this.loadRecomendaciones();
            },
            error: (err: any) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo publicar.' });
                this.cargandoAprobarForo = false;
            },
        });
    }

    // ── Rechazar (Foro) ──
    abrirRechazarForo(rec: RecomendacionComunidad) {
        this.selectedForo.set(rec);
        this.motivoRechazoForo = '';
        this.foroMotivoRechazoError = false;
        this.dialogRechazarForo = true;
    }

    rechazarForo() {
        const foro = this.selectedForo();
        if (!foro) return;
        if (!this.motivoRechazoForo?.trim()) {
            this.foroMotivoRechazoError = true;
            return;
        }
        this.foroMotivoRechazoError = false;
        this.cargandoRechazarForo = true;
        this.recomendacionesService.moderarConDuracion(foro.id, { moderado: false, motivoRechazo: this.motivoRechazoForo }).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Rechazado', detail: 'Foro rechazado.' });
                this.dialogRechazarForo = false;
                this.cargandoRechazarForo = false;
                this.loadRecomendaciones();
            },
            error: (err: any) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo rechazar.' });
                this.cargandoRechazarForo = false;
            },
        });
    }

    // ── Ver Foro ──
    verForo(rec: RecomendacionComunidad) {
        this.selectedForoVer.set(rec);
        this.verForoDialog = true;
        this.loadingComentarios.set(true);
        this.comentarios.set([]);
        this.recomendacionesService.getInteracciones(rec.id).subscribe({
            next: (res: any) => {
                this.ngZone.runOutsideAngular(() => {
                    const comentarios = (res?.comentarios || []).map((c: any) => this.fixComentarioUrls(c));
                    this.comentarios.set(comentarios);
                    this.loadingComentarios.set(false);
                    this.preloadAudioDurations(comentarios);
                });
            },
            error: () => {
                this.ngZone.runOutsideAngular(() => this.loadingComentarios.set(false));
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los comentarios.' });
            },
        });
        this.iniciarPollingForo(rec.id);
    }

    // ── Polling en vivo ──
    pollingInterval: any = null;

    iniciarPollingForo(foroId: number) {
        this.detenerPollingForo();
        this.pollingInterval = setInterval(() => {
            if (!this.verForoDialog) { this.detenerPollingForo(); return; }
            this.recomendacionesService.getInteracciones(foroId).subscribe({
                next: (res: any) => {
                    if (res?.comentarios) {
                        this.ngZone.runOutsideAngular(() => {
                            const comentarios = res.comentarios.map((c: any) => this.fixComentarioUrls(c));
                            this.comentarios.set(comentarios);
                            this.preloadAudioDurations(comentarios);
                        });
                    }
                },
                error: () => {},
            });
        }, 3000);
    }

    detenerPollingForo() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    // ── Editar Foro ──
    abrirEditarForo(rec: RecomendacionComunidad) {
        this.selectedForoEditar.set(rec);
        this.foroEditActivo = rec.activo ?? true;
        this.foroEditDuracionExtra = 0;
        this.dialogEditarForo = true;
    }

    guardarEdicionForo() {
        const foro = this.selectedForoEditar();
        if (!foro) return;
        this.cargandoEditarForo = true;
        const payload: any = {
            activo: this.foroEditActivo,
        };
        if (this.foroEditDuracionExtra && this.foroEditDuracionExtra > 0) {
            payload.duracionExtra = this.foroEditDuracionExtra;
        }
        this.recomendacionesService.update(foro.id, payload).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Foro actualizado.' });
                this.dialogEditarForo = false;
                this.cargandoEditarForo = false;
                this.loadRecomendaciones();
            },
            error: (err: any) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo guardar.' });
                this.cargandoEditarForo = false;
            },
        });
    }

    // ── Chat helpers ──
    onEnterKey(event: Event) {
        const kbEvent = event as KeyboardEvent;
        if (!kbEvent.shiftKey) {
            event.preventDefault();
            this.enviarComentarioForo();
        }
    }

    responderComentario(c: ComentarioForo) {
        let tipoMedia = '';
        if (c.audioUrl && !c.contenido) tipoMedia = 'audio';
        else if (c.imagenUrl && !c.contenido) tipoMedia = 'imagen';
        this.replyToForo = { id: c.id, username: c.usuario?.nombre || 'Anónimo', contenido: c.contenido?.slice(0, 80) || '', tipoMedia };
    }

    cancelarRespuestaForo() {
        this.replyToForo = null;
    }

    onImageSelected(event: any) {
        const file = event.target.files?.[0];
        if (!file) return;
        this.imagenForoFile = file;
        const reader = new FileReader();
        reader.onload = () => { this.imagenForoPreview = reader.result as string; };
        reader.readAsDataURL(file);
    }

    cancelarImagenForo() {
        this.imagenForoFile = null;
        this.imagenForoPreview = null;
    }

    // ── Eliminar (Foro / Saber) ──
    eliminar(rec: RecomendacionComunidad) {
        const esSaber = rec.tipo === 'CONOCIMIENTO_ANCESTRAL';
        this.confirmationService.confirm({
            message: esSaber
                ? `¿Eliminar físicamente "${rec.titulo}"? Esta acción no se puede deshacer.`
                : `¿Desactivar "${rec.titulo}"? Se ocultará de todos los usuarios.`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-trash',
            accept: () => {
                const obs = esSaber
                    ? this.recomendacionesService.hardRemove(rec.id)
                    : this.recomendacionesService.remove(rec.id);
                obs.subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: esSaber ? 'Eliminado' : 'Desactivado',
                            detail: esSaber ? 'Saber ancestral eliminado permanentemente.' : 'Publicación desactivada.',
                        });
                        this.tabActivo() === 'foro' ? this.loadRecomendaciones() : this.loadSaberes();
                    },
                    error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar.' }),
                });
            },
        });
    }

    // ════════════════════════════════════════
    //  SABER ANCESTRAL ACTIONS
    // ════════════════════════════════════════

    // ── Aceptar ──
    abrirAceptar(saber: RecomendacionComunidad) {
        this.selectedSaber.set(saber);
        this.duracionDias = 30;
        this.duracionDiasError = false;
        this.dialogAceptar = true;
    }

    aceptarSaber() {
        const saber = this.selectedSaber();
        if (!saber) return;
        if (!this.duracionDias || this.duracionDias < 1) {
            this.duracionDiasError = true;
            return;
        }
        this.duracionDiasError = false;
        this.cargandoAceptar = true;
        this.recomendacionesService.moderarConDuracion(saber.id, { moderado: true, duracionDias: this.duracionDias }).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Publicado', detail: `Saber ancestral publicado por ${this.duracionDias} días hábiles.` });
                this.dialogAceptar = false;
                this.cargandoAceptar = false;
                this.loadSaberes();
            },
            error: (err: any) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo publicar.' });
                this.cargandoAceptar = false;
            },
        });
    }

    // ── Rechazar ──
    abrirRechazar(saber: RecomendacionComunidad) {
        this.selectedSaber.set(saber);
        this.motivoRechazo = '';
        this.motivoRechazoError = false;
        this.dialogRechazar = true;
    }

    rechazarSaber() {
        const saber = this.selectedSaber();
        if (!saber) return;
        if (!this.motivoRechazo?.trim()) {
            this.motivoRechazoError = true;
            return;
        }
        this.motivoRechazoError = false;
        this.cargandoRechazar = true;
        this.recomendacionesService.moderarConDuracion(saber.id, { moderado: false, motivoRechazo: this.motivoRechazo }).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Rechazado', detail: 'Saber ancestral rechazado.' });
                this.dialogRechazar = false;
                this.cargandoRechazar = false;
                this.loadSaberes();
            },
            error: (err: any) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo rechazar.' });
                this.cargandoRechazar = false;
            },
        });
    }

    // ── Revisar Interacciones ──
    abrirRevisar(saber: RecomendacionComunidad) {
        this.selectedSaber.set(saber);
        this.dialogRevisar = true;
        this.cargandoInteracciones.set(true);
        this.interacciones.set({ comentarios: [], valoraciones: [] });
        this.recomendacionesService.getInteracciones(saber.id).subscribe({
            next: (res: any) => {
                this.ngZone.runOutsideAngular(() => {
                    this.interacciones.set(res);
                    this.cargandoInteracciones.set(false);
                });
            },
            error: () => {
                this.ngZone.runOutsideAngular(() => this.cargandoInteracciones.set(false));
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las interacciones.' });
            },
        });
    }

    // ── Editar ──
    abrirEditar(saber: RecomendacionComunidad) {
        this.selectedSaber.set(saber);
        this.editData.set({
            comentarioModerador: saber.comentarioModerador || '',
            activo: saber.activo ?? true,
            fechaExpiracion: saber.fechaExpiracion || null,
        });
        this.editarDuracionExtra = 0;
        this.dialogEditar = true;
    }

    valorarSaber(saber: RecomendacionComunidad, puntuacion: number) {
        this.recomendacionesService.valorar(saber.id, puntuacion).subscribe({
            next: (res: any) => {
                this.ngZone.runOutsideAngular(() => {
                    this.saberes.update(arr => arr.map(s =>
                        s.id === saber.id
                            ? { ...s, valoracionesBuenas: res.valoracionesBuenas ?? s.valoracionesBuenas, valoracionesMalas: res.valoracionesMalas ?? s.valoracionesMalas, miValoracion: res.miValoracion }
                            : s
                    ));
                });
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo valorar.' }),
        });
    }

    guardarEdicion() {
        const saber = this.selectedSaber();
        const ed = this.editData();
        if (!saber || !ed) return;
        this.cargandoEditar = true;
        const payload: any = {
            comentarioModerador: ed.comentarioModerador || undefined,
            activo: ed.activo,
        };
        if (this.editarDuracionExtra && this.editarDuracionExtra > 0) {
            payload.duracionExtra = this.editarDuracionExtra;
        }
        this.recomendacionesService.update(saber.id, payload).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Saber ancestral actualizado.' });
                this.dialogEditar = false;
                this.cargandoEditar = false;
                this.loadSaberes();
            },
            error: (err: any) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo guardar.' });
                this.cargandoEditar = false;
            },
        });
    }

    // ── Eliminar comentario ──
    eliminarComentario(comentario: ComentarioForo) {
        this.confirmationService.confirm({
            message: `¿Desactivar el comentario de ${comentario.usuario?.nombre || 'Anónimo'}?`,
            header: 'Confirmar',
            icon: 'pi pi-trash',
            accept: () => {
                this.recomendacionesService.removeComentario(comentario.id).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Desactivado', detail: 'Comentario desactivado.' });
                        // Reload current view
                        if (this.dialogRevisar && this.selectedSaber()) {
                            this.cargandoInteracciones.set(true);
                            this.recomendacionesService.getInteracciones(this.selectedSaber()!.id).subscribe({
                                next: (res: any) => { this.ngZone.runOutsideAngular(() => { this.interacciones.set(res); this.cargandoInteracciones.set(false); }); },
                                error: () => this.ngZone.runOutsideAngular(() => this.cargandoInteracciones.set(false)),
                            });
                        }
                        const foro = this.selectedForoVer();
                        if (foro) {
                            this.cargarComentariosForo(foro.id);
                        }
                    },
                    error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo desactivar el comentario.' }),
                });
            },
        });
    }

    // ── Cargar comentarios del foro (para polling y recarga) ──
    cargarComentariosForo(foroId: number) {
        this.recomendacionesService.getInteracciones(foroId).subscribe({
            next: (res: any) => {
                this.ngZone.runOutsideAngular(() => {
                    const comentarios = (res?.comentarios || []).map((c: any) => this.fixComentarioUrls(c));
                    this.comentarios.set(comentarios);
                    this.loadingComentarios.set(false);
                    this.preloadAudioDurations(comentarios);
                });
            },
            error: () => this.ngZone.runOutsideAngular(() => this.loadingComentarios.set(false)),
        });
    }

    private preloadAudioDurations(comentarios: any[]) {
        setTimeout(() => {
            for (const c of comentarios) {
                if (c.audioUrl && !this.audioBubbleStates.has(c.id)) {
                    const audio = new Audio(c.audioUrl);
                    audio.preload = 'metadata';
                    audio.addEventListener('loadedmetadata', () => {
                        this.audioBubbleStates.set(c.id, { currentTime: 0, duration: audio.duration });
                    });
                }
                if (c.respuestas) {
                    for (const r of c.respuestas) {
                        if (r.audioUrl && !this.audioBubbleStates.has(r.id)) {
                            const audio = new Audio(r.audioUrl);
                            audio.preload = 'metadata';
                            audio.addEventListener('loadedmetadata', () => {
                                this.audioBubbleStates.set(r.id, { currentTime: 0, duration: audio.duration });
                            });
                        }
                    }
                }
            }
        }, 0);
    }

    // ── Audio Recording (press-and-hold, estilo WhatsApp) ──
    mediaRecorder: any = null;
    audioChunks: Blob[] = [];
    audioBlobForo: Blob | null = null;

    iniciarGrabacion() {
        if (this.grabandoAudio) return;
        if (!navigator.mediaDevices?.getUserMedia) {
            this.messageService.add({ severity: 'warn', summary: 'No soportado', detail: 'Tu navegador no soporta grabación de audio.' });
            return;
        }
        this.grabandoAudio = true;
        this.audioChunks = [];
        this.audioBlobForo = null;
        this.audioUriForo = null;
        this.tiempoGrabacion = 0;
        this.iniciarTimerGrabacion();
        navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
            const recorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4' });
            this.mediaRecorder = recorder;
            recorder.ondataavailable = (e: any) => { if (e.data.size > 0) this.audioChunks.push(e.data); };
            recorder.onstop = () => {
                stream.getTracks().forEach((t) => t.stop());
                this.grabandoAudio = false;
                if (this.audioChunks.length === 0) return;
                const blob = new Blob(this.audioChunks, { type: recorder.mimeType });
                this.audioBlobForo = blob;
                this.audioUriForo = URL.createObjectURL(blob);
                this.audioPreviewDuration = 0;
                this.audioPreviewCurrentTime = 0;
                const tempAudio = new Audio(this.audioUriForo);
                tempAudio.addEventListener('loadedmetadata', () => {
                    this.audioPreviewDuration = tempAudio.duration;
                });
            };
            recorder.start();
        }).catch(() => {
            this.grabandoAudio = false;
            this.detenerTimerGrabacion();
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo acceder al micrófono.' });
        });
    }

    pausarGrabacion() {
        if (!this.mediaRecorder) return;
        if (this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.pause();
            this.pausaGrabacion = true;
            this.detenerTimerGrabacion();
        } else if (this.mediaRecorder.state === 'paused') {
            this.mediaRecorder.resume();
            this.pausaGrabacion = false;
            this.iniciarTimerGrabacion();
        }
    }

    detenerGrabacion() {
        if (!this.grabandoAudio) return;
        this.detenerTimerGrabacion();
        this.pausaGrabacion = false;
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
    }

    private iniciarTimerGrabacion() {
        this.detenerTimerGrabacion();
        this.grabacionTimer = setInterval(() => { this.tiempoGrabacion++; }, 1000);
    }

    private detenerTimerGrabacion() {
        if (this.grabacionTimer) {
            clearInterval(this.grabacionTimer);
            this.grabacionTimer = null;
        }
    }

    cancelarAudioForo() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stream?.getTracks().forEach((t: MediaStreamTrack) => t.stop());
            this.mediaRecorder.stop();
        }
        this.grabandoAudio = false;
        this.pausaGrabacion = false;
        this.detenerTimerGrabacion();
        this.detenerPreviewAudio();
        this.audioUriForo = null;
        this.audioBlobForo = null;
        this.audioChunks = [];
        this.audioPreviewDuration = 0;
        this.audioPreviewCurrentTime = 0;
    }

    // ── Audio preview playback (antes de enviar) ──
    audioForoRef: HTMLAudioElement | null = null;
    reproduciendoAudioForo = false;

    reproducirAudioForo() {
        if (!this.audioUriForo) return;
        if (this.reproduciendoAudioForo) {
            this.audioForoRef?.pause();
            this.reproduciendoAudioForo = false;
            this.detenerPreviewAudio();
            return;
        }
        if (!this.audioForoRef) {
            this.audioForoRef = new Audio();
        }
        this.audioForoRef.src = this.audioUriForo;
        this.audioForoRef.currentTime = this.audioPreviewCurrentTime;
        this.audioForoRef.onended = () => {
            this.reproduciendoAudioForo = false;
            this.audioPreviewCurrentTime = 0;
            this.detenerPreviewAudio();
        };
        this.audioForoRef.ontimeupdate = () => {
            this.audioPreviewCurrentTime = this.audioForoRef?.currentTime || 0;
        };
        this.audioForoRef.play().then(() => {
            this.reproduciendoAudioForo = true;
            this.previewAudioInterval = setInterval(() => {
                if (this.audioForoRef) {
                    this.audioPreviewCurrentTime = this.audioForoRef.currentTime;
                }
            }, 250);
        }).catch(() => {});
    }

    private detenerPreviewAudio() {
        if (this.previewAudioInterval) {
            clearInterval(this.previewAudioInterval);
            this.previewAudioInterval = null;
        }
    }

    seekAudioPreview(event: MouseEvent) {
        if (!this.audioUriForo || !this.audioPreviewDuration) return;
        const bar = event.currentTarget as HTMLElement;
        const rect = bar.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const ratio = Math.max(0, Math.min(1, x / rect.width));
        this.audioPreviewCurrentTime = ratio * this.audioPreviewDuration;
        if (this.audioForoRef) {
            this.audioForoRef.currentTime = this.audioPreviewCurrentTime;
        }
    }

    // ── Promover: add plaga/cultivo selectors ──
    promoverPlagaId: number | null = null;
    promoverCultivoId: number | null = null;

    abrirPromoverForo(comentario: ComentarioForo) {
        const foro = this.selectedForoVer();
        if (!foro) return;
        this.selectedSaber.set(foro as any);
        this.selectedComentario.set(comentario);
        this.comentarioModeradorPromover = '';
        this.promoverPlagaId = foro.plaga?.id || null;
        this.promoverCultivoId = foro.cultivo?.id || null;
        this.dialogPromover = true;
    }

    abrirPromover(comentario: ComentarioForo) {
        const saber = this.selectedSaber();
        this.selectedComentario.set(comentario);
        this.comentarioModeradorPromover = '';
        this.promoverPlagaId = saber?.plaga?.id || null;
        this.promoverCultivoId = saber?.cultivo?.id || null;
        this.dialogPromover = true;
    }

    promoverComentario() {
        const saber = this.selectedSaber();
        const comentario = this.selectedComentario();
        if (!saber || !comentario) return;
        this.cargandoPromover = true;
        const dto: any = { comentarioModerador: this.comentarioModeradorPromover || undefined };
        if (this.promoverPlagaId) dto.plagaId = this.promoverPlagaId;
        if (this.promoverCultivoId) dto.cultivoId = this.promoverCultivoId;
        this.recomendacionesService.promoverComentario(saber.id, comentario.id, dto).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Promovido', detail: 'Comentario promovido a Saber Ancestral.' });
                this.dialogPromover = false;
                this.cargandoPromover = false;
                if (this.dialogRevisar) {
                    this.cargandoInteracciones.set(true);
                    this.recomendacionesService.getInteracciones(saber.id).subscribe({
                        next: (res: any) => { this.ngZone.runOutsideAngular(() => { this.interacciones.set(res); this.cargandoInteracciones.set(false); }); },
                        error: () => this.ngZone.runOutsideAngular(() => this.cargandoInteracciones.set(false)),
                    });
                }
                this.loadSaberes();
            },
            error: (err: any) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo promover.' });
                this.cargandoPromover = false;
            },
        });
    }

    // ── Enviar comentario con audio/imagen ──
    enviarComentarioForo() {
        const foro = this.selectedForoVer();
        let texto = this.nuevoComentarioForo.trim();
        if (!foro || (!texto && !this.audioBlobForo && !this.imagenForoFile)) return;
        this.enviandoComentarioForo = true;
        let obs;
        if (this.audioBlobForo) {
            obs = this.recomendacionesService.createComentarioWithAudio(foro.id, texto, this.audioBlobForo, this.replyToForo?.id);
        } else if (this.imagenForoFile) {
            obs = this.recomendacionesService.createComentarioWithImage(foro.id, texto, this.imagenForoFile, this.replyToForo?.id);
        } else {
            obs = this.recomendacionesService.createComentario(foro.id, texto, this.replyToForo?.id);
        }
        obs.subscribe({
            next: () => {
                this.nuevoComentarioForo = '';
                this.cancelarAudioForo();
                this.cancelarImagenForo();
                this.enviandoComentarioForo = false;
                this.loadingComentarios.set(true);
                this.cargarComentariosForo(foro.id);
            },
            error: (err: any) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo enviar el comentario.' });
                this.enviandoComentarioForo = false;
            },
        });
    }

    // ── Audio player in bubbles (WhatsApp-style) ──
    audioBubbleRef: HTMLAudioElement | null = null;
    playingBubbleAudioId: number | null = null;

    toggleBubbleAudio(comentario: ComentarioForo) {
        if (!comentario.audioUrl) return;
        if (this.playingBubbleAudioId === comentario.id) {
            this.audioBubbleRef?.pause();
            this.playingBubbleAudioId = null;
            return;
        }
        if (this.audioBubbleRef) { this.audioBubbleRef.pause(); this.audioBubbleRef = null; }
        const audio = new Audio(comentario.audioUrl);
        this.audioBubbleRef = audio;
        this.playingBubbleAudioId = comentario.id;
        this.audioBubbleStates.set(comentario.id, { currentTime: 0, duration: 0 });

        audio.addEventListener('loadedmetadata', () => {
            this.audioBubbleStates.set(comentario.id, { currentTime: 0, duration: audio.duration });
            audio.play().catch(() => {});
        });
        audio.addEventListener('timeupdate', () => {
            const state = this.audioBubbleStates.get(comentario.id);
            if (state) {
                state.currentTime = audio.currentTime;
                state.duration = audio.duration || state.duration;
            }
        });
        audio.addEventListener('ended', () => {
            this.playingBubbleAudioId = null;
            const state = this.audioBubbleStates.get(comentario.id);
            if (state) state.currentTime = 0;
        });
    }

    seekBubbleAudio(event: MouseEvent, comentario: ComentarioForo) {
        if (!this.audioBubbleRef || this.playingBubbleAudioId !== comentario.id) return;
        const bar = event.currentTarget as HTMLElement;
        const rect = bar.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const state = this.audioBubbleStates.get(comentario.id);
        if (!state || !state.duration) return;
        const ratio = Math.max(0, Math.min(1, x / rect.width));
        this.audioBubbleRef.currentTime = ratio * state.duration;
    }

    getBubbleAudioTime(comentario: ComentarioForo): string {
        const state = this.audioBubbleStates.get(comentario.id);
        if (!state) return '0:00';
        const cur = this.formatDuracion(state.currentTime);
        if (this.playingBubbleAudioId === comentario.id && state.duration) {
            return `${cur}/${this.formatDuracion(state.duration)}`;
        }
        return cur;
    }

    getBubbleAudioDuration(comentario: ComentarioForo): string {
        const state = this.audioBubbleStates.get(comentario.id);
        if (!state || !state.duration) return '';
        return this.formatDuracion(state.duration);
    }

    getBubbleAudioProgress(comentario: ComentarioForo): number {
        const state = this.audioBubbleStates.get(comentario.id);
        if (!state || !state.duration) return 0;
        return (state.currentTime / state.duration) * 100;
    }

    formatDuracion(segundos: number): string {
        const m = Math.floor(segundos / 60);
        const s = Math.floor(segundos % 60);
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    private fixComentarioUrls(comentario: any): any {
        if (!comentario) return comentario;
        return {
            ...comentario,
            imagenUrl: this.multimediaService.fixMinioUrl(comentario.imagenUrl),
            audioUrl: comentario.audioUrl ? this.fixAudioUrl(comentario.audioUrl) : null,
            respuestas: (comentario.respuestas || []).map((r: any) => ({
                ...r,
                imagenUrl: this.multimediaService.fixMinioUrl(r.imagenUrl),
                audioUrl: r.audioUrl ? this.fixAudioUrl(r.audioUrl) : null,
            })),
        };
    }

    private fixAudioUrl(url: string): string {
        if (!url) return '';
        try {
            const urlObj = new URL(url);
            const apiUrl = new URL(environment.apiUrl);
            urlObj.hostname = apiUrl.hostname;
            urlObj.port = apiUrl.port;
            urlObj.protocol = apiUrl.protocol;
            return urlObj.toString();
        } catch { return url; }
    }

}
