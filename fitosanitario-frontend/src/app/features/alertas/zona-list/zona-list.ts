import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface NotificacionGlobal {
  id?: number;
  titulo: string;
  cuerpo: string;
  tipo: 'PELIGRO' | 'INFORMATIVO';
  createdAt?: string;
}

@Component({
  selector: 'app-zona-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, DatePipe,
    TableModule, ButtonModule, InputTextModule, TextareaModule,
    DialogModule, ToastModule, ConfirmDialogModule,
    TagModule, SelectModule, DatePickerModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './zona-list.html',
  styleUrl: './zona-list.css',
})
export class ZonaList implements OnInit {
  private http = inject(HttpClient);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  notificaciones = signal<NotificacionGlobal[]>([]);
  loading = signal(false);
  displayDialog = signal(false);
  isEditMode = signal(false);

  form: NotificacionGlobal = this.defaultForm();
  filtroQ = '';
  filtroFechaInicio: Date | null = null;
  filtroFechaFin: Date | null = null;
  filtroTipo: string | null = null;
  hoy = new Date();
  tipoFilterOptions = [
    { label: 'Peligro', value: 'PELIGRO' },
    { label: 'Informativo', value: 'INFORMATIVO' },
  ];

  ngOnInit() {
    this.loadNotificaciones();
  }

  loadNotificaciones() {
    this.loading.set(true);
    this.http.get<any[]>(`${environment.apiUrl}/notificaciones/globales`).subscribe({
      next: (data) => {
        this.notificaciones.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las notificaciones.' });
        this.loading.set(false);
      },
    });
  }

  get filteredNotificaciones() {
    let items = this.notificaciones();
    if (this.filtroQ?.trim()) {
      const q = this.filtroQ.toLowerCase();
      items = items.filter(n => n.titulo.toLowerCase().includes(q) || n.cuerpo.toLowerCase().includes(q));
    }
    if (this.filtroTipo) {
      items = items.filter(n => n.tipo === this.filtroTipo);
    }
    if (this.filtroFechaInicio) {
      items = items.filter(n => n.createdAt && new Date(n.createdAt) >= this.filtroFechaInicio!);
    }
    if (this.filtroFechaFin) {
      items = items.filter(n => n.createdAt && new Date(n.createdAt) <= this.filtroFechaFin!);
    }
    return items;
  }

  openNew() {
    this.form = this.defaultForm();
    this.isEditMode.set(false);
    this.displayDialog.set(true);
  }

  editItem(item: NotificacionGlobal) {
    this.form = { ...item };
    this.isEditMode.set(true);
    this.displayDialog.set(true);
  }

  deleteItem(item: NotificacionGlobal) {
    if (!item.id) return;
    this.confirmationService.confirm({
      message: `¿Eliminar la notificación "${item.titulo}"?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.http.delete(`${environment.apiUrl}/notificaciones/${item.id}`).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Eliminada', detail: 'Notificación eliminada.' });
            this.loadNotificaciones();
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar.' }),
        });
      },
    });
  }

  resetForm() {
    this.form = this.defaultForm();
  }

  saveAndSend() {
    if (!this.form.titulo?.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'El título es obligatorio.' });
      return;
    }
    if (!this.form.cuerpo?.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'La descripción es obligatoria.' });
      return;
    }

    this.http.post(`${environment.apiUrl}/push/broadcast`, {
      titulo: this.form.titulo,
      cuerpo: this.form.cuerpo,
      tipo: this.form.tipo,
    }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Enviada', detail: 'Notificación global enviada correctamente.' });
        this.displayDialog.set(false);
        this.loadNotificaciones();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo enviar la notificación.' }),
    });
  }

  saveChanges() {
    if (!this.form.titulo?.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'El título es obligatorio.' });
      return;
    }
    if (!this.form.cuerpo?.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'La descripción es obligatoria.' });
      return;
    }

    this.http.patch(`${environment.apiUrl}/notificaciones/${this.form.id}`, {
      titulo: this.form.titulo,
      cuerpo: this.form.cuerpo,
    }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Actualizada', detail: 'Notificación actualizada.' });
        this.displayDialog.set(false);
        this.loadNotificaciones();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar.' }),
    });
  }

  saveAndResend() {
    this.saveAndSend();
  }

  private defaultForm(): NotificacionGlobal {
    return { titulo: '', cuerpo: '', tipo: 'INFORMATIVO' };
  }
}
