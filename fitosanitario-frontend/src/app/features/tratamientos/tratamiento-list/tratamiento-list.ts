import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { TratamientosService } from '../../../core/services/tratamientos';
import { MetodoAplicacion, TratamientoOficial } from '../../../core/models/tratamiento.model';

@Component({
  selector: 'app-tratamiento-list',
  standalone: true,
  imports: [CommonModule, DatePipe, ButtonModule, DialogModule, TableModule, TagModule, ToastModule, InputTextModule],
  providers: [MessageService],
  templateUrl: './tratamiento-list.html',
  styleUrl: './tratamiento-list.css'
})
export class TratamientoList implements OnInit {
  private tratamientosService = inject(TratamientosService);
  private messageService = inject(MessageService);

  tratamientos = signal<TratamientoOficial[]>([]);
  selectedTratamiento = signal<TratamientoOficial | null>(null);
  loading = signal(false);
  detailDialog = signal(false);

  totalEnciclopedia = computed(() => this.tratamientos().filter(t => t.enEnciclopedia).length);
  totalCarenciaAlta = computed(() => this.tratamientos().filter(t => t.diasCarencia >= 14).length);

  ngOnInit() {
    this.loadTratamientos();
  }

  loadTratamientos() {
    this.loading.set(true);
    this.tratamientosService.findAll().subscribe({
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
