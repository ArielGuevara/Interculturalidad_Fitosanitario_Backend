import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
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
    SelectModule,
    TextareaModule,
    ToggleSwitchModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './tratamiento-form.html',
  styleUrl: './tratamiento-form.css'
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
  @Input() submitLabel = 'Registrar Tratamiento';

  @Output() saved = new EventEmitter<TratamientoOficial>();
  @Output() cancelled = new EventEmitter<void>();

  cultivos = signal<Cultivo[]>([]);
  plagas = signal<Plaga[]>([]);
  productos = signal<Producto[]>([]);
  loadingCatalogos = signal(false);
  saving = signal(false);

  metodos: { label: string; value: MetodoAplicacion }[] = [
    { label: 'Foliar', value: 'FOLIAR' },
    { label: 'Suelo', value: 'SUELO' },
    { label: 'Riego', value: 'RIEGO' }
  ];

  form: CreateTratamientoDto = this.defaultForm();

  ngOnInit() {
    this.applyContext();
    this.loadCatalogos();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['reporteId'] || changes['recomendacionOrigenId'] || changes['cultivoId'] || changes['plagaId']) {
      this.applyContext();
    }
  }

  loadCatalogos() {
    this.loadingCatalogos.set(true);
    this.cultivosService.findAll().subscribe({
      next: data => this.cultivos.set(data),
      error: () => this.showCatalogError('cultivos')
    });
    this.plagasService.findAll().subscribe({
      next: data => this.plagas.set(data),
      error: () => this.showCatalogError('plagas')
    });
    this.productosService.findAll().subscribe({
      next: data => {
        this.productos.set(data);
        this.loadingCatalogos.set(false);
      },
      error: () => {
        this.loadingCatalogos.set(false);
        this.showCatalogError('productos');
      }
    });
  }

  save() {
    const validationError = this.getValidationError();
    if (validationError) {
      this.messageService.add({ severity: 'warn', summary: 'Revise el formulario', detail: validationError });
      return;
    }

    this.saving.set(true);
    this.tratamientosService.create(this.normalizePayload()).subscribe({
      next: tratamiento => {
        this.messageService.add({ severity: 'success', summary: 'Tratamiento creado', detail: 'La receta oficial fue registrada.' });
        this.saving.set(false);
        this.saved.emit(tratamiento);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo registrar el tratamiento.' });
        this.saving.set(false);
      }
    });
  }

  reset() {
    this.form = this.defaultForm();
    this.applyContext();
  }

  private applyContext() {
    this.form = {
      ...this.form,
      reporteId: this.reporteId,
      recomendacionOrigenId: this.recomendacionOrigenId,
      cultivoId: this.cultivoId ?? this.form.cultivoId,
      plagaId: this.plagaId ?? this.form.plagaId
    };
  }

  private defaultForm(): CreateTratamientoDto {
    return {
      cultivoId: 0,
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
      enEnciclopedia: false
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
      condicionesAplicacion: this.form.condicionesAplicacion || undefined
    };
  }

  private getValidationError() {
    if (!this.form.cultivoId) return 'Seleccione el cultivo tratado.';
    if (!this.form.plagaId) return 'Seleccione la plaga o enfermedad a tratar.';
    if (!this.form.productoId) return 'Seleccione el producto fitosanitario.';
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
