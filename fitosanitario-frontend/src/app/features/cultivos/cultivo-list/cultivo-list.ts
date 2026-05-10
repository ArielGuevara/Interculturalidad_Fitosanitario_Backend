import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CultivosService } from '../../../core/services/cultivos';
import { Cultivo, CreateCultivoDto } from '../../../core/models/cultivo.model';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-cultivo-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    DialogModule,
    ToastModule,
    ConfirmDialogModule,
    TagModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './cultivo-list.html',
  styleUrl: './cultivo-list.css',
})
export class CultivoList implements OnInit {
  private cultivosService = inject(CultivosService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  cultivos = signal<Cultivo[]>([]);
  loading = signal<boolean>(false);
  
  displayDialog = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  
  selectedCultivo: Cultivo = this.defaultCultivo();

  ngOnInit() {
    this.loadCultivos();
  }

  loadCultivos() {
    this.loading.set(true);
    this.cultivosService.findAll().subscribe({
      next: (data) => {
        this.cultivos.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los cultivos' });
        this.loading.set(false);
      }
    });
  }

  openNew() {
    this.selectedCultivo = this.defaultCultivo();
    this.isEditMode.set(false);
    this.displayDialog.set(true);
  }

  editCultivo(cultivo: Cultivo) {
    this.selectedCultivo = { ...cultivo };
    this.isEditMode.set(true);
    this.displayDialog.set(true);
  }

  deleteCultivo(cultivo: Cultivo) {
    this.confirmationService.confirm({
      message: `¿Estás seguro de eliminar el cultivo ${cultivo.nombre}?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.cultivosService.delete(cultivo.id!).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Cultivo eliminado' });
            this.loadCultivos();
          }
        });
      }
    });
  }

  saveCultivo() {
    if (!this.selectedCultivo.nombre || !this.selectedCultivo.descripcion) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Complete los campos obligatorios' });
      return;
    }

    const request = this.isEditMode()
      ? this.cultivosService.update(this.selectedCultivo.id!, this.selectedCultivo)
      : this.cultivosService.create(this.selectedCultivo as CreateCultivoDto);

    request.subscribe({
      next: () => {
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Éxito', 
          detail: `Cultivo ${this.isEditMode() ? 'actualizado' : 'creado'} correctamente` 
        });
        this.displayDialog.set(false);
        this.loadCultivos();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al procesar la solicitud' });
      }
    });
  }

  private defaultCultivo(): Cultivo {
    return { nombre: '', descripcion: '', imagenUrl: '' };
  }
}
