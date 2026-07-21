import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TratamientosService } from '../../../core/services/tratamientos';
import { MetodoAplicacion, TratamientoOficial } from '../../../core/models/tratamiento.model';
import { TratamientoForm } from '../tratamiento-form/tratamiento-form';

@Component({
  selector: 'app-tratamiento-list',
  standalone: true,
  imports: [CommonModule, DatePipe, ButtonModule, DialogModule, TableModule, TagModule, ToastModule, InputTextModule, ConfirmDialogModule, TratamientoForm],
  providers: [MessageService, ConfirmationService],
  templateUrl: './tratamiento-list.html',
  styleUrl: './tratamiento-list.css'
})
export class TratamientoList implements OnInit {
  private tratamientosService = inject(TratamientosService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  tratamientos = signal<TratamientoOficial[]>([]);
  selectedTratamiento = signal<TratamientoOficial | null>(null);
  loading = signal(false);
  detailDialog = signal(false);
  searchQuery = signal<string>('');
  showForm = signal(false);
  editando = signal<TratamientoOficial | null>(null);

  totalEnciclopedia = computed(() => this.tratamientos().filter(t => t.enEnciclopedia).length);
  totalCarenciaAlta = computed(() => this.tratamientos().filter(t => t.diasCarencia >= 14).length);

  ngOnInit() {
    this.loadTratamientos();
  }

  onSearchInput(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value);
    this.loadTratamientos();
  }

  openNewForm() {
    this.editando.set(null);
    this.showForm.set(true);
  }

  loadTratamientos() {
    this.loading.set(true);
    this.tratamientosService.findAll(this.searchQuery() || undefined).subscribe({
      next: data => {
        this.tratamientos.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los tratamientos oficiales.' });
      }
    });
  }

  openDetail(tratamiento: TratamientoOficial) {
    this.selectedTratamiento.set(tratamiento);
    this.detailDialog.set(true);
  }

  confirmDelete(tratamiento: TratamientoOficial) {
    this.confirmationService.confirm({
      message: `¿Eliminar el tratamiento #${tratamiento.id} para ${tratamiento.producto?.nombreComercial || 'este producto'}? Esta acción no se puede deshacer.`,
      header: 'Eliminar tratamiento',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteTratamiento(tratamiento.id),
    });
  }

  private deleteTratamiento(id: number) {
    this.tratamientosService.delete(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'El tratamiento fue eliminado correctamente.' });
        this.loadTratamientos();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el tratamiento.' });
      }
    });
  }

  openEditForm(tratamiento: TratamientoOficial) {
    this.editando.set(tratamiento);
    this.showForm.set(true);
  }

  onTratamientoGuardado(tratamiento: TratamientoOficial) {
    const fueEdit = !!this.editando();
    this.showForm.set(false);
    this.editando.set(null);
    this.messageService.add({
      severity: 'success',
      summary: fueEdit ? 'Actualizado' : 'Creado',
      detail: fueEdit ? 'Tratamiento oficial actualizado correctamente.' : 'Tratamiento oficial registrado correctamente.',
    });
    this.loadTratamientos();
  }

  onFormCancelado() {
    this.showForm.set(false);
    this.editando.set(null);
  }

  metodoLabel(metodo: MetodoAplicacion) {
    const labels: Record<MetodoAplicacion, string> = {
      FOLIAR: 'Foliar',
      SUELO: 'Suelo',
      RIEGO: 'Riego'
    };
    return labels[metodo] ?? metodo;
  }

  metodoSeverity(metodo: MetodoAplicacion): 'success' | 'info' | 'warn' | 'secondary' {
    const map: Record<MetodoAplicacion, 'success' | 'info' | 'warn'> = {
      FOLIAR: 'success',
      SUELO: 'warn',
      RIEGO: 'info'
    };
    return map[metodo] ?? 'secondary';
  }
}
