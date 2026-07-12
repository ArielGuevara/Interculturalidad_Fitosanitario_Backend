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
import { MultiSelectModule } from 'primeng/multiselect';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PlagasService, CultivoRef } from '../../../core/services/plagas';
import { CultivosService } from '../../../core/services/cultivos';
import { MultimediaService } from '../../../core/services/multimedia';
import { Plaga, CreatePlagaDto, TipoPlaga } from '../../../core/models/plaga.model';
import { TagModule } from 'primeng/tag';
import { FileUploadModule } from 'primeng/fileupload';
import { TooltipModule } from 'primeng/tooltip';

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
    MultiSelectModule,
    TagModule,
    FileUploadModule,
    TooltipModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './plaga-list.html',
  styleUrl: './plaga-list.css',
})
export class PlagaList implements OnInit {
  private plagasService = inject(PlagasService);
  private cultivosService = inject(CultivosService);
  private multimediaService = inject(MultimediaService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  plagas = signal<Plaga[]>([]);
  cultivos = signal<CultivoRef[]>([]);
  loading = signal<boolean>(false);
  uploading = signal<boolean>(false);
  isDragging = signal<boolean>(false);
  
  displayDialog = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  
  previewVisible = signal<boolean>(false);
  previewImage = signal<string>('');

  searchQuery = signal<string>('');
  selectedCultivoFilter = signal<number | undefined>(undefined);

  selectedPlaga: Plaga & { cultivoIds?: number[] } = this.defaultPlaga();

  tiposOptions = [
    { label: 'Plaga', value: 'PLAGA' },
    { label: 'Enfermedad', value: 'ENFERMEDAD' },
    { label: 'Maleza', value: 'MALEZA' }
  ];

  ngOnInit() {
    this.loadCultivos();
    this.loadPlagas();
  }

  onSearchInput(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value);
    this.loadPlagas();
  }

  onCultivoFilterChange() {
    this.loadPlagas();
  }

  loadCultivos() {
    this.cultivosService.findAll().subscribe({
      next: (data) => this.cultivos.set(data),
    });
  }

  showPreview(url: string | undefined | null) {
    if (url && url.length > 10) {
      this.previewImage.set(url);
      this.previewVisible.set(true);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  onFileSelect(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      this.processFile(file);
    }
  }

  private processFile(file: File) {
    if (!file.type.startsWith('image/')) {
        this.messageService.add({ severity: 'warn', summary: 'Archivo inválido', detail: 'Solo imágenes' });
        return;
    }

    this.uploading.set(true);
    this.multimediaService.uploadImage(file).subscribe({
      next: (res) => {
        this.selectedPlaga.imagenUrl = res.urls[0];
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Imagen cargada' });
        this.uploading.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Fallo al subir' });
        this.uploading.set(false);
      }
    });
  }

  loadPlagas() {
    this.loading.set(true);
    this.plagasService.findAll(this.searchQuery() || undefined, this.selectedCultivoFilter()).subscribe({
      next: (data) => {
        const fixedData = data.map(p => ({
            ...p,
            imagenUrl: this.multimediaService.fixMinioUrl(p.imagenUrl)
        }));
        this.plagas.set(fixedData);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar' });
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
    this.selectedPlaga = { ...plaga, imagenUrl: plaga.imagenUrl || undefined, cultivoIds: [] };
    this.isEditMode.set(true);
    this.displayDialog.set(true);
    this.plagasService.findCultivos(plaga.id!).subscribe({
      next: (cultivos) => {
        this.selectedPlaga.cultivoIds = cultivos.map(c => c.id);
      }
    });
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

    const cultivoIds = this.selectedPlaga.cultivoIds || [];
    const plagaData = { ...this.selectedPlaga, cultivoIds };

    const request = this.isEditMode()
      ? this.plagasService.update(this.selectedPlaga.id!, plagaData)
      : this.plagasService.create(plagaData as CreatePlagaDto);

    request.subscribe({
      next: () => {
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Éxito', 
          detail: `Ficha ${this.isEditMode() ? 'actualizada' : 'creada'}` 
        });
        this.displayDialog.set(false);
        this.loadPlagas();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al procesar solicitud' });
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

  private defaultPlaga(): Plaga & { cultivoIds?: number[] } {
    return { nombre: '', tipo: 'PLAGA', descripcion: '', imagenUrl: undefined, cultivoIds: [] };
  }
}
