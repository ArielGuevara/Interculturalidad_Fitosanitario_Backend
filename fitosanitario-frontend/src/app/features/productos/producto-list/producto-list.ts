import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { Producto, TipoProducto } from '../../../core/models/producto.model';
import { Plaga } from '../../../core/models/plaga.model';
import { Cultivo } from '../../../core/models/cultivo.model';
import { ProductosService, PlagaCultivoPair } from '../../../core/services/productos';
import { PlagasService } from '../../../core/services/plagas';
import { CultivosService } from '../../../core/services/cultivos';

@Component({
  selector: 'app-producto-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule, DialogModule, SelectModule, CheckboxModule, TagModule, ConfirmDialogModule, ToastModule],
  templateUrl: './producto-list.html',
  styleUrls: ['./producto-list.css'],
  providers: [ConfirmationService, MessageService]
})
export class ProductoList implements OnInit {
  private productosService = inject(ProductosService);
  private plagasService = inject(PlagasService);
  private cultivosService = inject(CultivosService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  productos = signal<Producto[]>([]);
  searchQuery = signal('');
  selectedPlagaId = signal<number | undefined>(undefined);
  selectedCultivoId = signal<number | undefined>(undefined);

  plagas = signal<Plaga[]>([]);
  cultivos = signal<Cultivo[]>([]);
  asociaciones = signal<Map<number, PlagaCultivoPair[]>>(new Map());

  displayDialog = signal(false);
  editing = false;
  selectedProducto: Partial<Producto> = {};

  tiposOptions = [
    { label: 'Insecticida', value: 'INSECTICIDA' },
    { label: 'Fungicida', value: 'FUNGICIDA' },
    { label: 'Herbicida', value: 'HERBICIDA' },
    { label: 'Biológico', value: 'BIOLOGICO' },
  ];

  formPairs: { plagaId: number; cultivoId: number }[] = [];
  selectedPairPlagaId = signal<number | undefined>(undefined);
  availableCultivos = signal<{ id: number; nombre: string }[]>([]);

  loading = signal(false);

  ngOnInit() {
    this.loadPlagas();
    this.loadCultivos();
    this.loadProductos();
  }

  loadPlagas() {
    this.plagasService.findAll().subscribe((data) => this.plagas.set(data));
  }

  loadCultivos() {
    this.cultivosService.findAll().subscribe((data) => this.cultivos.set(data));
  }

  loadProductos() {
    this.loading.set(true);
    this.productosService
      .findAll(this.searchQuery() || undefined, this.selectedCultivoId(), this.selectedPlagaId())
      .subscribe({
        next: (data) => {
          this.productos.set(data);
          this.loadAsociaciones();
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  loadAsociaciones() {
    this.productosService.findAllAsociaciones().subscribe((data) => {
      const map = new Map<number, PlagaCultivoPair[]>();
      for (const item of data) {
        if (!map.has(item.productoId)) map.set(item.productoId, []);
        map.get(item.productoId)!.push({
          plagaId: item.plagaId,
          plagaNombre: item.plagaNombre,
          cultivoId: item.cultivoId,
          cultivoNombre: item.cultivoNombre,
        });
      }
      this.asociaciones.set(map);
    });
  }

  getPairs(productoId: number): PlagaCultivoPair[] {
    return this.asociaciones().get(productoId) || [];
  }

  onSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    this.loadProductos();
  }

  clearFilters() {
    this.searchQuery.set('');
    this.selectedPlagaId.set(undefined);
    this.selectedCultivoId.set(undefined);
    this.loadProductos();
  }

  isEditMode() {
    return this.editing;
  }

  openNew() {
    this.editing = false;
    this.selectedProducto = {};
    this.formPairs = [];
    this.selectedPairPlagaId.set(undefined);
    this.availableCultivos.set([]);
    this.displayDialog.set(true);
  }

  editProducto(producto: Producto) {
    this.editing = true;
    this.selectedProducto = { ...producto };
    this.productosService.findPlagasCultivos(producto.id!).subscribe((pairs) => {
      this.formPairs = pairs.map((p) => ({ plagaId: p.plagaId, cultivoId: p.cultivoId }));
    });
    this.displayDialog.set(true);
  }

  onPairPlagaChange(plagaId: number) {
    this.selectedPairPlagaId.set(plagaId);
    this.plagasService.findCultivos(plagaId).subscribe((data) => {
      this.availableCultivos.set(data);
    });
  }

  addPair() {
    const plagaId = this.selectedPairPlagaId();
    if (!plagaId) return;
    for (const c of this.availableCultivos()) {
      if (!this.formPairs.some((p) => p.plagaId === plagaId && p.cultivoId === c.id)) {
        this.formPairs.push({ plagaId, cultivoId: c.id });
      }
    }
    this.selectedPairPlagaId.set(undefined);
    this.availableCultivos.set([]);
  }

  removePair(plagaId: number, cultivoId: number) {
    this.formPairs = this.formPairs.filter((p) => !(p.plagaId === plagaId && p.cultivoId === cultivoId));
  }

  getPlagaNombre(id: number): string {
    return this.plagas().find((p) => p.id === id)?.nombre || '';
  }

  getCultivoNombre(id: number): string {
    return this.cultivos().find((c) => c.id === id)?.nombre || '';
  }

  plagaToOption(p: Plaga) { return { id: p.id!, nombre: p.nombre }; }
  cultivoToOption(c: Cultivo) { return { id: c.id!, nombre: c.nombre }; }

  saveProducto() {
    const dto: any = {
      nombreComercial: this.selectedProducto.nombreComercial,
      ingredienteActivo: this.selectedProducto.ingredienteActivo,
      tipo: this.selectedProducto.tipo,
      unidadBase: this.selectedProducto.unidadBase,
    };
    if (this.editing && this.selectedProducto.id) {
      this.productosService.update(this.selectedProducto.id, dto).subscribe({
        next: () => {
          if (this.selectedProducto.id && this.formPairs.length > 0) {
            this.productosService.setPlagasCultivos(this.selectedProducto.id!, this.formPairs).subscribe(() => {
              this.displayDialog.set(false);
              this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Producto actualizado' });
              this.loadProductos();
            });
          } else {
            this.displayDialog.set(false);
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Producto actualizado' });
            this.loadProductos();
          }
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar' }),
      });
    } else {
      this.productosService.create({ ...dto, pairs: this.formPairs.length > 0 ? this.formPairs : undefined }).subscribe({
        next: () => {
          this.displayDialog.set(false);
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Producto creado' });
          this.loadProductos();
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear' }),
      });
    }
  }

  deleteProducto(producto: Producto) {
    this.confirmationService.confirm({
      message: `¿Eliminar ${producto.nombreComercial}?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.productosService.delete(producto.id!).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Producto eliminado' });
            this.loadProductos();
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar' }),
        });
      },
    });
  }
}
