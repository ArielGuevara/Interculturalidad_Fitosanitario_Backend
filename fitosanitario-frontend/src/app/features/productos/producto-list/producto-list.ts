import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectModule } from 'primeng/select';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ProductosService } from '../../../core/services/productos';
import { Producto, CreateProductoDto } from '../../../core/models/producto.model';

@Component({
  selector: 'app-producto-list',
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
    SelectModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './producto-list.html',
  styleUrl: './producto-list.css',
})
export class ProductoList implements OnInit {
  private productosService = inject(ProductosService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  productos = signal<Producto[]>([]);
  loading = signal<boolean>(false);
  
  displayDialog = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  
  selectedProducto: Producto = this.defaultProducto();

  tiposOptions = [
    { label: 'Insecticida', value: 'INSECTICIDA' },
    { label: 'Fungicida', value: 'FUNGICIDA' },
    { label: 'Herbicida', value: 'HERBICIDA' },
    { label: 'Biológico', value: 'BIOLOGICO' }
  ];

  ngOnInit() {
    this.loadProductos();
  }

  loadProductos() {
    this.loading.set(true);
    this.productosService.findAll().subscribe({
      next: (data) => {
        this.productos.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los productos' });
        this.loading.set(false);
      }
    });
  }

  openNew() {
    this.selectedProducto = this.defaultProducto();
    this.isEditMode.set(false);
    this.displayDialog.set(true);
  }

  editProducto(producto: Producto) {
    this.selectedProducto = { ...producto };
    this.isEditMode.set(true);
    this.displayDialog.set(true);
  }

  deleteProducto(producto: Producto) {
    this.confirmationService.confirm({
      message: `¿Estás seguro de eliminar el producto ${producto.nombreComercial}?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.productosService.delete(producto.id!).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Producto eliminado' });
            this.loadProductos();
          }
        });
      }
    });
  }

  saveProducto() {
    if (!this.selectedProducto.nombreComercial || !this.selectedProducto.tipo) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Complete los campos obligatorios' });
      return;
    }

    const request = this.isEditMode()
      ? this.productosService.update(this.selectedProducto.id!, this.selectedProducto)
      : this.productosService.create(this.selectedProducto as CreateProductoDto);

    request.subscribe({
      next: () => {
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Éxito', 
          detail: `Producto ${this.isEditMode() ? 'actualizado' : 'registrado'} correctamente` 
        });
        this.displayDialog.set(false);
        this.loadProductos();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al procesar la solicitud' });
      }
    });
  }

  private defaultProducto(): Producto {
    return { 
      nombreComercial: '', 
      ingredienteActivo: '', 
      tipo: 'INSECTICIDA', 
      unidadBase: 'Litros' 
    };
  }
}
