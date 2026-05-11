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
import { MultimediaService } from '../../../core/services/multimedia';
import { Cultivo, CreateCultivoDto } from '../../../core/models/cultivo.model';
import { TagModule } from 'primeng/tag';
import { FileUploadModule } from 'primeng/fileupload';
import { ImageModule } from 'primeng/image';
import { TooltipModule } from 'primeng/tooltip';

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
    TagModule,
    FileUploadModule,
    ImageModule,
    TooltipModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './cultivo-list.html',
  styleUrl: './cultivo-list.css',
})
export class CultivoList implements OnInit {
  private cultivosService = inject(CultivosService);
  private multimediaService = inject(MultimediaService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  cultivos = signal<Cultivo[]>([]);
  loading = signal<boolean>(false);
  uploading = signal<boolean>(false);
  isDragging = signal<boolean>(false);
  
  displayDialog = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  
  previewVisible = signal<boolean>(false);
  previewImage = signal<string>('');

  selectedCultivo: Cultivo = this.defaultCultivo();

  ngOnInit() {
    this.loadCultivos();
  }

  showPreview(url: string | undefined | null) {
    if (url && url.length > 5) {
      this.previewImage.set(url);
      this.previewVisible.set(true);
    } else {
        this.messageService.add({ severity: 'info', summary: 'Sin imagen', detail: 'Este cultivo no tiene fotografía asignada' });
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
    const file = event.target.files?.[0] || (event.files ? event.files[0] : null);
    if (file) {
      this.processFile(file);
    }
  }

  private processFile(file: File) {
    if (!file.type.startsWith('image/')) {
        this.messageService.add({ severity: 'warn', summary: 'Archivo inválido', detail: 'Solo se permiten imágenes' });
        return;
    }

    this.uploading.set(true);
    this.multimediaService.uploadImage(file).subscribe({
      next: (res) => {
        if (res && res.urls && res.urls.length > 0) {
            this.selectedCultivo.imagenUrl = res.urls[0];
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Imagen cargada' });
        }
        this.uploading.set(false);
      },
      error: (err) => {
        console.error('Error subiendo imagen:', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Fallo al subir imagen al servidor' });
        this.uploading.set(false);
      }
    });
  }

  loadCultivos() {
    this.loading.set(true);
    this.cultivosService.findAll().subscribe({
      next: (data) => {
        // Corregimos todas las URLs de MinIO al vuelo para evitar 'localhost'
        const fixedData = data.map(c => ({
            ...c,
            imagenUrl: this.multimediaService.fixMinioUrl(c.imagenUrl)
        }));
        this.cultivos.set(fixedData);
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
    // Clonación profunda básica para evitar mutaciones directas
    this.selectedCultivo = { ...cultivo, imagenUrl: cultivo.imagenUrl || undefined };
    this.isEditMode.set(true);
    this.displayDialog.set(true);
  }

  deleteCultivo(cultivo: Cultivo) {
    this.confirmationService.confirm({
      message: `¿Estás seguro de eliminar el cultivo ${cultivo.nombre}?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.cultivosService.delete(cultivo.id!).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Cultivo eliminado' });
            this.loadCultivos();
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Bloqueado', detail: 'Este cultivo tiene reportes asociados.' });
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
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: `Ficha ${this.isEditMode() ? 'actualizada' : 'creada'} correctamente` });
        this.displayDialog.set(false);
        this.loadCultivos();
      },
      error: (err) => {
        console.error('Error al guardar cultivo:', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al procesar la solicitud' });
      }
    });
  }

  private defaultCultivo(): Cultivo {
    return { nombre: '', descripcion: '', imagenUrl: undefined };
  }
}
