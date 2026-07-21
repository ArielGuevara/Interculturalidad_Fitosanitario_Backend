import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { CultivosService } from '../../../core/services/cultivos';
import { PlagasService } from '../../../core/services/plagas';
import { ProductosService } from '../../../core/services/productos';
import { TratamientosService } from '../../../core/services/tratamientos';
import { Cultivo } from '../../../core/models/cultivo.model';
import { Plaga } from '../../../core/models/plaga.model';
import { Producto } from '../../../core/models/producto.model';
import { CreateTratamientoDto, MetodoAplicacion, TratamientoOficial } from '../../../core/models/tratamiento.model';

@Component({
  selector: 'app-tratamiento-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    MultiSelectModule,
    SelectModule,
    TextareaModule,
    ToggleSwitchModule,
    InputGroupModule,
    InputGroupAddonModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './tratamiento-form.html',
  styleUrl: './tratamiento-form.css',
})
export class TratamientoForm implements OnInit, OnChanges {
  private cultivosService = inject(CultivosService);
  private plagasService = inject(PlagasService);
  private productosService = inject(ProductosService);
  private tratamientosService = inject(TratamientosService);
  private messageService = inject(MessageService);

  @Input() reporteId?: number;
  @Input() recomendacionOrigenId?: number;
  @Input() cultivoId?: number;
  @Input() plagaId?: number;
  @Input() tratamientoExistente?: TratamientoOficial | null;
  @Input() submitLabel = 'Guardar tratamiento';

  @Output() saved = new EventEmitter<TratamientoOficial>();
  @Output() cancelled = new EventEmitter<void>();

  cultivos = signal<Cultivo[]>([]);
  plagas = signal<Plaga[]>([]);
  productos = signal<Producto[]>([]);
  loadingCatalogos = signal(false);
  saving = signal(false);

  isEditMode = computed(() => !!this.tratamientoExistente);

  touched: Record<string, boolean> = {};

  metodos: { label: string; value: MetodoAplicacion }[] = [
    { label: 'Foliar', value: 'FOLIAR' },
    { label: 'Suelo', value: 'SUELO' },
    { label: 'Riego', value: 'RIEGO' },
  ];

  etapas = [
    { label: '🌱 Germinación / Emergencia', value: 'Germinación' },
    { label: '🌿 Crecimiento vegetativo', value: 'Crecimiento vegetativo' },
    { label: '🌸 Floración', value: 'Floración' },
    { label: '🍎 Fructificación', value: 'Fructificación' },
    { label: '🌾 Maduración', value: 'Maduración' },
    { label: '⏸️ Reposo / Dormancia', value: 'Reposo' },
  ];

  form: CreateTratamientoDto = this.defaultForm();

  fieldErrors = computed(() => ({
    cultivoIds: this.getError('cultivoIds', !this.form.cultivoIds || this.form.cultivoIds.length === 0, 'Seleccione al menos un cultivo.'),
    plagaId: this.getError('plagaId', !this.form.plagaId, 'Seleccione la plaga.'),
    productoId: this.getError('productoId', !this.form.productoId, 'Seleccione el producto.'),
    dosis: this.getError('dosis', !this.form.dosis || this.form.dosis <= 0, 'Debe ser mayor a 0.'),
    unidadDosis: this.getError('unidadDosis', !this.form.unidadDosis?.trim(), 'Campo requerido.'),
    metodoAplicacion: this.getError('metodoAplicacion', !this.form.metodoAplicacion, 'Seleccione un método.'),
    intervaloDias: this.getError('intervaloDias', !this.form.intervaloDias || this.form.intervaloDias < 1, 'Mínimo 1 día.'),
    numeroAplicaciones: this.getError('numeroAplicaciones', !this.form.numeroAplicaciones || this.form.numeroAplicaciones < 1, 'Mínimo 1.'),
    duracionTotalDias: this.getError('duracionTotalDias', !this.form.duracionTotalDias || this.form.duracionTotalDias < 1, 'Mínimo 1 día.'),
    diasCarencia: this.getError('diasCarencia', this.form.diasCarencia === undefined || this.form.diasCarencia < 0, 'No puede ser negativo.'),
    periodoReingresoHoras: this.getError('periodoReingresoHoras', this.form.periodoReingresoHoras !== undefined && this.form.periodoReingresoHoras < 0, 'No puede ser negativo.'),
    volumenAgua: this.getError('volumenAgua', this.form.volumenAgua !== undefined && this.form.volumenAgua < 0, 'No puede ser negativo.'),
  }));

  private getError(field: string, condition: boolean, msg: string): string | null {
    return this.touched[field] && condition ? msg : null;
  }

  markTouched(field: string) {
    this.touched[field] = true;
  }

  ngOnInit() {
    this.applyContext();
    this.loadCatalogos();
    if (this.tratamientoExistente) {
      this.populateForm(this.tratamientoExistente);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['reporteId'] || changes['recomendacionOrigenId'] || changes['cultivoId'] || changes['plagaId']) {
      this.applyContext();
    }
    if (changes['tratamientoExistente'] && this.tratamientoExistente) {
      this.populateForm(this.tratamientoExistente);
    }
  }

  loadCatalogos() {
    this.loadingCatalogos.set(true);
    this.cultivosService.findAll().subscribe({
      next: (data) => this.cultivos.set(data),
      error: () => this.showCatalogError('cultivos'),
    });
    this.plagasService.findAll().subscribe({
      next: (data) => this.plagas.set(data),
      error: () => this.showCatalogError('plagas'),
    });
    this.productosService.findAll().subscribe({
      next: (data) => {
        this.productos.set(data);
        this.loadingCatalogos.set(false);
      },
      error: () => {
        this.loadingCatalogos.set(false);
        this.showCatalogError('productos');
      },
    });
  }

  save() {
    Object.keys(this.form).forEach((k) => (this.touched[k] = true));
    const validationError = this.getValidationError();
    if (validationError) {
      this.messageService.add({ severity: 'warn', summary: 'Revise el formulario', detail: validationError });
      return;
    }

    this.saving.set(true);
    const payload = this.normalizePayload();

    if (this.isEditMode() && this.tratamientoExistente?.id) {
      this.tratamientosService.update(this.tratamientoExistente.id, payload).subscribe({
        next: (tratamiento) => {
          this.messageService.add({ severity: 'success', summary: 'Tratamiento actualizado', detail: 'La receta oficial fue actualizada.' });
          this.saving.set(false);
          this.saved.emit(tratamiento);
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el tratamiento.' });
          this.saving.set(false);
        },
      });
    } else {
      this.tratamientosService.create(payload).subscribe({
        next: (tratamiento) => {
          this.messageService.add({ severity: 'success', summary: 'Tratamiento creado', detail: 'La receta oficial fue registrada.' });
          this.saving.set(false);
          this.saved.emit(tratamiento);
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo registrar el tratamiento.' });
          this.saving.set(false);
        },
      });
    }
  }

  reset() {
    this.form = this.defaultForm();
    this.touched = {};
    this.applyContext();
  }

  private populateForm(t: TratamientoOficial) {
    const cultivoIds = t.cultivos?.map((c) => c.id) ?? (t.cultivoId ? [t.cultivoId] : []);
    this.form = {
      cultivoIds,
      plagaId: t.plagaId,
      productoId: t.productoId,
      dosis: t.dosis,
      unidadDosis: t.unidadDosis,
      volumenAgua: t.volumenAgua ?? undefined,
      unidadVolumen: t.unidadVolumen ?? '',
      metodoAplicacion: t.metodoAplicacion,
      intervaloDias: t.intervaloDias,
      numeroAplicaciones: t.numeroAplicaciones,
      duracionTotalDias: t.duracionTotalDias,
      diasCarencia: t.diasCarencia,
      periodoReingresoHoras: t.periodoReingresoHoras ?? undefined,
      etapaCultivo: t.etapaCultivo ?? '',
      condicionesAplicacion: t.condicionesAplicacion ?? '',
      nombre: t.nombre ?? '',
      descripcion: t.descripcion ?? '',
      enEnciclopedia: t.enEnciclopedia ?? false,
      reporteId: this.reporteId,
      recomendacionOrigenId: this.recomendacionOrigenId,
    };
  }

  private applyContext() {
    const cultivoIds = this.cultivoId ? [this.cultivoId] : this.form.cultivoIds ?? [];
    this.form = {
      ...this.form,
      reporteId: this.reporteId,
      recomendacionOrigenId: this.recomendacionOrigenId,
      cultivoIds,
      plagaId: this.plagaId ?? this.form.plagaId,
    };
  }

  private defaultForm(): CreateTratamientoDto {
    return {
      cultivoIds: [],
      plagaId: 0,
      productoId: 0,
      dosis: 0,
      unidadDosis: '',
      volumenAgua: undefined,
      unidadVolumen: '',
      metodoAplicacion: 'FOLIAR',
      intervaloDias: 1,
      numeroAplicaciones: 1,
      duracionTotalDias: 1,
      diasCarencia: 0,
      periodoReingresoHoras: undefined,
      etapaCultivo: '',
      condicionesAplicacion: '',
      nombre: '',
      descripcion: '',
      enEnciclopedia: false,
    };
  }

  private normalizePayload(): CreateTratamientoDto {
    return {
      ...this.form,
      reporteId: this.reporteId,
      recomendacionOrigenId: this.recomendacionOrigenId,
      volumenAgua: this.form.volumenAgua || undefined,
      periodoReingresoHoras: this.form.periodoReingresoHoras || undefined,
      unidadVolumen: this.form.unidadVolumen || undefined,
      etapaCultivo: this.form.etapaCultivo || undefined,
      condicionesAplicacion: this.form.condicionesAplicacion || undefined,
      nombre: this.form.nombre || undefined,
      descripcion: this.form.descripcion || undefined,
    };
  }

  private getValidationError() {
    if (!this.form.cultivoIds || this.form.cultivoIds.length === 0) return 'Seleccione al menos un cultivo.';
    if (!this.form.plagaId || this.form.plagaId <= 0) return 'Seleccione la plaga o enfermedad a tratar.';
    if (!this.form.productoId || this.form.productoId <= 0) return 'Seleccione el producto fitosanitario.';
    if (!this.form.dosis || this.form.dosis <= 0) return 'Ingrese una dosis mayor a cero.';
    if (!this.form.unidadDosis?.trim()) return 'Ingrese la unidad de dosis.';
    if (!this.form.metodoAplicacion) return 'Seleccione el método de aplicación.';
    if (!this.form.intervaloDias || this.form.intervaloDias < 1) return 'El intervalo debe ser de al menos 1 día.';
    if (!this.form.numeroAplicaciones || this.form.numeroAplicaciones < 1) return 'Debe existir al menos 1 aplicación.';
    if (!this.form.duracionTotalDias || this.form.duracionTotalDias < 1) return 'La duración total debe ser de al menos 1 día.';
    if (this.form.diasCarencia === undefined || this.form.diasCarencia < 0) return 'Los días de carencia no pueden ser negativos.';
    if (this.form.volumenAgua !== undefined && this.form.volumenAgua < 0) return 'El volumen de agua no puede ser negativo.';
    if (this.form.periodoReingresoHoras !== undefined && this.form.periodoReingresoHoras < 0) return 'El periodo de reingreso no puede ser negativo.';
    return null;
  }

  private showCatalogError(nombre: string) {
    this.messageService.add({ severity: 'error', summary: 'Catálogo no disponible', detail: `No se pudo cargar ${nombre}.` });
  }
}
