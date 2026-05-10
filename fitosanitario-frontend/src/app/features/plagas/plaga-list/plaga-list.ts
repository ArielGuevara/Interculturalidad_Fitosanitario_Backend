import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SelectModule } from 'primeng/select';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PlagasService } from '../../../core/services/plagas';
import { Plaga, CreatePlagaDto, TipoPlaga } from '../../../core/models/plaga.model';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-plaga-list',
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
    SelectButtonModule,
    SelectModule,
    TagModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './plaga-list.html',
  styleUrl: './plaga-list.css',
})
export class PlagaList implements OnInit {
  private plagasService = inject(PlagasService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  plagas = signal<Plaga[]>([]);
  loading = signal<boolean>(false);
  
  displayDialog = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  
  selectedPlaga: Plaga = this.defaultPlaga();

  tiposOptions = [
    { label: 'Plaga', value: 'PLAGA' },
    { label: 'Enfermedad', value: 'ENFERMEDAD' },
    { label: 'Maleza', value: 'MALEZA' }
  ];

  ngOnInit() {
    this.loadPlagas();
  }

  loadPlagas() {
    this.loading.set(true);
    this.plagasService.findAll().subscribe({
      next: (data) => {
        this.plagas.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las plagas' });
        this.loading.set(false);
      }
    });
  }

  openNew() {
    this.selectedPlaga = this.defaultPlaga();
    this.isEditMode.set(false);
    this.displayDialog.set(true);
  }

  editPlaga(plaga: Plaga) {
    this.selectedPlaga = { ...plaga };
    this.isEditMode.set(true);
    this.displayDialog.set(true);
  }

  deletePlaga(plaga: Plaga) {
    this.confirmationService.confirm({
      message: `¿Estás seguro de eliminar ${plaga.nombre}?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.plagasService.delete(plaga.id!).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Registro eliminado' });
            this.loadPlagas();
          }
        });
      }
    });
  }

  savePlaga() {
    if (!this.selectedPlaga.nombre || !this.selectedPlaga.tipo) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Complete los campos obligatorios' });
      return;
    }

    const request = this.isEditMode()
      ? this.plagasService.update(this.selectedPlaga.id!, this.selectedPlaga)
      : this.plagasService.create(this.selectedPlaga as CreatePlagaDto);

    request.subscribe({
      next: () => {
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Éxito', 
          detail: `Registro ${this.isEditMode() ? 'actualizado' : 'creado'} correctamente` 
        });
        this.displayDialog.set(false);
        this.loadPlagas();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al procesar la solicitud' });
      }
    });
  }

  getSeverity(tipo: TipoPlaga) {
    switch (tipo) {
      case 'PLAGA': return 'danger';
      case 'ENFERMEDAD': return 'warn';
      case 'MALEZA': return 'info';
      default: return 'secondary';
    }
  }

  private defaultPlaga(): Plaga {
    return { nombre: '', tipo: 'PLAGA', descripcion: '', imagenUrl: '' };
  }
}
