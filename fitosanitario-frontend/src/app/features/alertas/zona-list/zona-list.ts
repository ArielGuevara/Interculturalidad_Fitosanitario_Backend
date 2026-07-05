import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TagModule } from 'primeng/tag';
import { AlertasService } from '../../../core/services/alertas';
import { ZonaAlerta, CreateZonaAlertaDto } from '../../../core/models/alerta.model';

declare const L: any;

@Component({
  selector: 'app-zona-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule,
    InputTextModule, InputNumberModule, InputTextareaModule,
    DialogModule, ToastModule, ConfirmDialogModule, TagModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './zona-list.html',
  styleUrl: './zona-list.css',
})
export class ZonaList implements OnInit {
  private alertasService = inject(AlertasService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  zonas = signal<ZonaAlerta[]>([]);
  loading = signal(false);
  displayDialog = signal(false);
  isEditMode = signal(false);
  mapDialogVisible = signal(false);
  selectedZona: ZonaAlerta = this.defaultZona();
  mapLat = signal(0);
  mapLon = signal(0);

  ngOnInit() {
    this.loadZonas();
  }

  loadZonas() {
    this.loading.set(true);
    this.alertasService.findAllZonas().subscribe({
      next: (data) => { this.zonas.set(data); this.loading.set(false); },
      error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las zonas' }); this.loading.set(false); },
    });
  }

  openNew() {
    this.selectedZona = this.defaultZona();
    this.isEditMode.set(false);
    this.displayDialog.set(true);
  }

  editZona(zona: ZonaAlerta) {
    this.selectedZona = { ...zona };
    this.isEditMode.set(true);
    this.displayDialog.set(true);
  }

  deleteZona(zona: ZonaAlerta) {
    this.confirmationService.confirm({
      message: `¿Eliminar la zona ${zona.nombre}?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.alertasService.deleteZona(zona.id).subscribe({
          next: () => { this.messageService.add({ severity: 'success', summary: 'Eliminada', detail: 'Zona eliminada' }); this.loadZonas(); },
          error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar' }); },
        });
      },
    });
  }

  saveZona() {
    if (!this.selectedZona.nombre) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'El nombre es obligatorio' });
      return;
    }
    const dto: CreateZonaAlertaDto = {
      nombre: this.selectedZona.nombre,
      descripcion: this.selectedZona.descripcion || undefined,
      latitudCentro: this.selectedZona.latitudCentro,
      longitudCentro: this.selectedZona.longitudCentro,
      radioKm: this.selectedZona.radioKm,
    };
    const request = this.isEditMode()
      ? this.alertasService.updateZona(this.selectedZona.id, dto)
      : this.alertasService.createZona(dto);
    request.subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: `Zona ${this.isEditMode() ? 'actualizada' : 'creada'}` });
        this.displayDialog.set(false);
        this.loadZonas();
      },
      error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al guardar' }); },
    });
  }

  openMap(zona?: ZonaAlerta) {
    if (zona) {
      this.selectedZona = { ...zona };
      this.isEditMode.set(true);
    } else {
      this.selectedZona = this.defaultZona();
      this.isEditMode.set(false);
    }
    this.mapLat.set(this.selectedZona.latitudCentro || 0);
    this.mapLon.set(this.selectedZona.longitudCentro || 0);
    this.mapDialogVisible.set(true);
    setTimeout(() => this.initMap(), 200);
  }

  private initMap() {
    const el = document.getElementById('zona-map');
    if (!el) return;
    el.innerHTML = '';
    const map = L.map('zona-map').setView([this.mapLat(), this.mapLon()], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
    const marker = L.marker([this.mapLat(), this.mapLon()], { draggable: true }).addTo(map);
    const radius = this.selectedZona.radioKm || 10;
    const circle = L.circle([this.mapLat(), this.mapLon()], { radius: radius * 1000, color: '#059669', fillOpacity: 0.15 }).addTo(map);

    marker.on('dragend', (e: any) => {
      const pos = e.target.getLatLng();
      this.mapLat.set(pos.lat);
      this.mapLon.set(pos.lng);
      this.selectedZona.latitudCentro = pos.lat;
      this.selectedZona.longitudCentro = pos.lng;
      circle.setLatLng(pos);
    });

    setTimeout(() => map.invalidateSize(), 300);
    (window as any).__zonaMap = map;
  }

  confirmMapPosition() {
    this.selectedZona.latitudCentro = this.mapLat();
    this.selectedZona.longitudCentro = this.mapLon();
    this.mapDialogVisible.set(false);
    if (!this.isEditMode()) {
      this.displayDialog.set(true);
    }
    this.saveZona();
  }

  private defaultZona(): ZonaAlerta {
    return { nombre: '', descripcion: '', latitudCentro: 0, longitudCentro: 0, radioKm: 10, activo: true, createdAt: '', updatedAt: '' };
  }
}
