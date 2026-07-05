import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { AlertasService } from '../../../core/services/alertas';
import { CultivosService } from '../../../core/services/cultivos';
import { PlagasService } from '../../../core/services/plagas';
import { ParametroAlerta, CreateParametroAlertaDto } from '../../../core/models/alerta.model';
import { Cultivo } from '../../../core/models/cultivo.model';
import { Plaga } from '../../../core/models/plaga.model';

@Component({
  selector: 'app-parametro-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule,
    InputTextModule, InputNumberModule,
    DialogModule, ToastModule, ConfirmDialogModule, TagModule, SelectModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './parametro-list.html',
  styleUrl: './parametro-list.css',
})
export class ParametroList implements OnInit {
  private alertasService = inject(AlertasService);
  private cultivosService = inject(CultivosService);
  private plagasService = inject(PlagasService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  parametros = signal<ParametroAlerta[]>([]);
  cultivos = signal<Cultivo[]>([]);
  plagas = signal<Plaga[]>([]);
  loading = signal(false);
  displayDialog = signal(false);
  isEditMode = signal(false);
  selectedParametro: ParametroAlerta = this.defaultParametro();

  ngOnInit() {
    this.loadParametros();
    this.cultivosService.findAll().subscribe({ next: (d) => this.cultivos.set(d) });
    this.plagasService.findAll().subscribe({ next: (d) => this.plagas.set(d) });
  }

  loadParametros() {
    this.loading.set(true);
    this.alertasService.findAllParametros().subscribe({
      next: (data) => { this.parametros.set(data); this.loading.set(false); },
      error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los parámetros' }); this.loading.set(false); },
    });
  }

  openNew() {
    this.selectedParametro = this.defaultParametro();
    this.isEditMode.set(false);
    this.displayDialog.set(true);
  }

  editParametro(p: ParametroAlerta) {
    this.selectedParametro = { ...p };
    this.isEditMode.set(true);
    this.displayDialog.set(true);
  }

  deleteParametro(p: ParametroAlerta) {
    this.confirmationService.confirm({
      message: `¿Eliminar el parámetro ${p.nombre}?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.alertasService.deleteParametro(p.id).subscribe({
          next: () => { this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Parámetro eliminado' }); this.loadParametros(); },
          error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar' }); },
        });
      },
    });
  }

  saveParametro() {
    if (!this.selectedParametro.nombre) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'El nombre es obligatorio' });
      return;
    }
    const dto: CreateParametroAlertaDto = {
      nombre: this.selectedParametro.nombre,
      plagaId: this.selectedParametro.plagaId || undefined,
      cultivoId: this.selectedParametro.cultivoId || undefined,
      umbralReportes: this.selectedParametro.umbralReportes || 3,
      radioKm: this.selectedParametro.radioKm || 10,
      ventanaHoras: this.selectedParametro.ventanaHoras || 72,
    };
    const request = this.isEditMode()
      ? this.alertasService.updateParametro(this.selectedParametro.id, dto)
      : this.alertasService.createParametro(dto);
    request.subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: `Parámetro ${this.isEditMode() ? 'actualizado' : 'creado'}` });
        this.displayDialog.set(false);
        this.loadParametros();
      },
      error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al guardar' }); },
    });
  }

  private defaultParametro(): ParametroAlerta {
    return { nombre: '', umbralReportes: 3, radioKm: 10, ventanaHoras: 72, activo: true, createdAt: '' };
  }
}
