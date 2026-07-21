import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { UsuariosService } from '../../core/services/usuarios';
import { Usuario } from '../../core/models/auth.model';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-usuarios-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, InputTextModule, SelectModule,
    TableModule, TagModule, DialogModule, TextareaModule, CheckboxModule,
    ToastModule, ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <div class="page-header flex flex-column md:flex-row justify-content-between align-items-end gap-4">
      <div>
        <h2 class="title m-0">Usuarios</h2>
        <p class="subtitle m-0">Gestiona los usuarios del sistema.</p>
      </div>
      <div class="flex gap-2">
        <p-button label="Nuevo moderador" icon="pi pi-user-plus" (onClick)="openCreateDialog()"></p-button>
      </div>
    </div>

    <p-toast></p-toast>
    <p-confirmdialog></p-confirmdialog>

    <div class="card">
      <div class="flex flex-wrap gap-3 mb-4 align-items-center">
        <span class="p-input-icon-left" style="max-width:300px;width:100%">
          <i class="pi pi-search"></i>
          <input type="text" pInputText [(ngModel)]="filtro" (input)="onFilter()" placeholder="Buscar por nombre o email..." class="w-full" />
        </span>
      </div>

      <p-table [value]="filteredUsers()" [rows]="20" [paginator]="true" [loading]="loading()" [globalFilterFields]="['nombre','email','rol','cargo']">
        <ng-template pTemplate="header">
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Cargo</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-u>
          <tr [class.opacity-50]="!u.activo">
            <td class="font-bold">{{ u.nombre }}</td>
            <td>{{ u.email }}</td>
            <td>
              <p-tag [value]="u.rol" [severity]="u.rol === 'ADMIN' ? 'danger' : u.rol === 'MODERADOR' ? 'info' : 'success'"></p-tag>
            </td>
            <td>{{ u.cargo || '-' }}</td>
            <td>
              <div class="flex gap-2 align-items-center flex-wrap">
                <p-tag [value]="u.activo ? 'Activo' : 'Inactivo'" [severity]="u.activo ? 'success' : 'danger'"></p-tag>
                @if (suspensionesMap()[u.id]) {
                  <p-tag value="Suspendido" severity="warn" styleClass="ml-1"></p-tag>
                }
              </div>
            </td>
            <td>
              <div class="flex gap-2">
                <p-button icon="pi pi-pencil" pTooltip="Editar" styleClass="p-button-rounded p-button-text p-button-sm" (onClick)="openEditDialog(u)"></p-button>
                <ng-container *ngIf="u.rol !== 'ADMIN'">
                  @if (u.activo) {
                    @if (suspensionesMap()[u.id]) {
                      <p-button icon="pi pi-check-circle" pTooltip="Reactivar (quitar suspensión)" styleClass="p-button-rounded p-button-text p-button-sm" severity="help" (onClick)="openReactivarDialog(u)"></p-button>
                    } @else {
                      <p-button icon="pi pi-ban" pTooltip="Suspender" styleClass="p-button-rounded p-button-text p-button-sm" severity="warn" (onClick)="openSuspendDialog(u)"></p-button>
                    }
                    <p-button icon="pi pi-trash" pTooltip="Desactivar" styleClass="p-button-rounded p-button-text p-button-sm" severity="danger" (onClick)="confirmDelete(u)"></p-button>
                  } @else {
                    <p-button icon="pi pi-refresh" pTooltip="Habilitar" styleClass="p-button-rounded p-button-text p-button-sm p-button-success" (onClick)="restoreUser(u)"></p-button>
                  }
                </ng-container>
              </div>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr><td colspan="6" class="text-center p-4">No hay usuarios registrados</td></tr>
        </ng-template>
      </p-table>
    </div>

    <!-- Create/Edit Dialog -->
    <p-dialog [(visible)]="dialogVisible" [header]="editMode ? 'Editar moderador' : 'Nuevo moderador'" [modal]="true" [style]="{width:'520px'}" (onHide)="resetDialog()">
      <div class="flex flex-column gap-3 p-2">
        <div>
          <label class="block font-bold mb-1">Nombre *</label>
          <input type="text" pInputText [(ngModel)]="form.nombre" class="w-full" required />
        </div>
        <div>
          <label class="block font-bold mb-1">Email *</label>
          <input type="email" pInputText [(ngModel)]="form.email" class="w-full" required />
        </div>
        <div>
          <label class="block font-bold mb-1">Teléfono</label>
          <input type="text" pInputText [(ngModel)]="form.telefono" class="w-full" />
        </div>
        <div>
          <label class="block font-bold mb-1">Cargo / Título</label>
          <input type="text" pInputText [(ngModel)]="form.cargo" class="w-full" placeholder="Ej: Agrónomo, Ing. Ambiental, Biotecnólogo" />
        </div>
        <div>
          <label class="block font-bold mb-2">Permisos</label>
          <div class="flex flex-column gap-2">
            <div *ngFor="let perm of permisosDisponibles" class="flex align-items-center gap-2">
              <p-checkbox [(ngModel)]="form.permisos" [value]="perm.value" [inputId]="perm.value"></p-checkbox>
              <label [for]="perm.value" class="cursor-pointer">{{ perm.label }}</label>
            </div>
          </div>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <p-button label="Cancelar" styleClass="p-button-text" (onClick)="dialogVisible = false"></p-button>
        <p-button [label]="editMode ? 'Guardar cambios' : 'Crear moderador'" [disabled]="!form.nombre || !form.email" (onClick)="save()"></p-button>
      </ng-template>
    </p-dialog>

    <!-- Suspend Dialog -->
    <p-dialog [(visible)]="suspendDialogVisible" header="Suspender usuario" [modal]="true" [style]="{width:'450px'}">
      <div class="flex flex-column gap-3 p-2">
        <div>
          <label class="block font-bold mb-1">Motivo *</label>
          <textarea pTextarea [(ngModel)]="suspendForm.motivo" rows="3" class="w-full" required></textarea>
        </div>
        <div>
          <label class="block font-bold mb-1">Tipo de duración</label>
          <p-select [(ngModel)]="suspendForm.tipoDuracion" [options]="[{label:'Días',value:'DIAS'},{label:'Tiempo (segundos)',value:'TIEMPO'}]" optionLabel="label" optionValue="value" class="w-full"></p-select>
        </div>
        <div>
          <label class="block font-bold mb-1">Duración</label>
          <input type="number" pInputText [(ngModel)]="suspendForm.duracion" class="w-full" min="1" required />
        </div>
      </div>
      <ng-template pTemplate="footer">
        <p-button label="Cancelar" styleClass="p-button-text" (onClick)="suspendDialogVisible = false"></p-button>
        <p-button label="Suspender" severity="warn" [disabled]="!suspendForm.motivo || !suspendForm.duracion" (onClick)="suspendUser()"></p-button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .card { background: white; border-radius: 28px; padding: 1.5rem; box-shadow: 0 20px 40px -24px rgba(15,23,42,0.22); }
  `]
})
export class UsuariosList implements OnInit {
  private usuariosService = inject(UsuariosService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  users = signal<Usuario[]>([]);
  filteredUsers = signal<Usuario[]>([]);
  loading = signal(false);
  filtro = '';
  suspensionesMap = signal<Record<number, any>>({});

  dialogVisible = false;
  editMode = false;
  editingUserId: number | null = null;

  form: { nombre: string; email: string; telefono: string; cargo: string; permisos: string[] } = {
    nombre: '', email: '', telefono: '', cargo: '', permisos: [],
  };

  permisosDisponibles = [
    { label: 'Acceso a Usuarios', value: 'usuarios' },
  ];

  suspendDialogVisible = false;
  suspendUserId: number | null = null;
  suspendForm: { motivo: string; tipoDuracion: 'TIEMPO' | 'DIAS'; duracion: number } = {
    motivo: '', tipoDuracion: 'DIAS', duracion: 1,
  };

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading.set(true);
    this.usuariosService.findAll().subscribe({
      next: (users) => {
        this.users.set(users);
        this.applyFilter();
        this.loading.set(false);
        this.loadSuspensiones();
      },
      error: () => this.loading.set(false),
    });
  }

  loadSuspensiones() {
    this.usuariosService.getSuspensionesActivas().subscribe({
      next: (suspensiones) => {
        const map: Record<number, any> = {};
        for (const s of suspensiones) {
          map[s.usuarioId] = s;
        }
        this.suspensionesMap.set(map);
      },
    });
  }

  onFilter() {
    this.applyFilter();
  }

  applyFilter() {
    const q = this.filtro.toLowerCase();
    if (!q) {
      this.filteredUsers.set(this.users());
    } else {
      this.filteredUsers.set(
        this.users().filter(u =>
          u.nombre.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.cargo && u.cargo.toLowerCase().includes(q))
        )
      );
    }
  }

  openCreateDialog() {
    this.editMode = false;
    this.editingUserId = null;
    this.form = { nombre: '', email: '', telefono: '', cargo: '', permisos: [] };
    this.dialogVisible = true;
  }

  openEditDialog(user: Usuario) {
    this.editMode = true;
    this.editingUserId = user.id;
    this.form = {
      nombre: user.nombre,
      email: user.email,
      telefono: user.telefono || '',
      cargo: user.cargo || '',
      permisos: [...(user.permisos || [])],
    };
    this.dialogVisible = true;
  }

  resetDialog() {
    this.dialogVisible = false;
    this.editMode = false;
    this.editingUserId = null;
  }

  save() {
    if (this.editMode && this.editingUserId) {
      this.usuariosService.update(this.editingUserId, {
        nombre: this.form.nombre,
        email: this.form.email,
        telefono: this.form.telefono || null,
        cargo: this.form.cargo || null,
        permisos: this.form.permisos,
      }).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Usuario actualizado correctamente' });
          this.dialogVisible = false;
          this.loadUsers();
        },
        error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al actualizar' }),
      });
    } else {
      this.usuariosService.createModerator({
        nombre: this.form.nombre,
        email: this.form.email,
        telefono: this.form.telefono || undefined,
        cargo: this.form.cargo || undefined,
        permisos: this.form.permisos,
      }).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Creado', detail: 'Moderador creado correctamente. Contraseña: Moderador123' });
          this.dialogVisible = false;
          this.loadUsers();
        },
        error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al crear' }),
      });
    }
  }

  openSuspendDialog(user: Usuario) {
    this.suspendUserId = user.id;
    this.suspendForm = { motivo: '', tipoDuracion: 'DIAS', duracion: 1 };
    this.suspendDialogVisible = true;
  }

  suspendUser() {
    if (!this.suspendUserId) return;
    this.usuariosService.suspender(this.suspendUserId, this.suspendForm).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Suspendido', detail: 'Usuario suspendido correctamente' });
        this.suspendDialogVisible = false;
        this.loadUsers();
      },
      error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al suspender' }),
    });
  }

  confirmDelete(user: Usuario) {
    this.confirmationService.confirm({
      message: `¿Desactivar a ${user.nombre}? Podrás restaurarlo después.`,
      header: 'Desactivar usuario',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Desactivar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.usuariosService.remove(user.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Desactivado', detail: 'Usuario desactivado' });
            this.loadUsers();
          },
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error' }),
        });
      },
    });
  }

  restoreUser(user: Usuario) {
    this.usuariosService.restore(user.id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Habilitado', detail: 'Usuario activado nuevamente' });
        this.loadUsers();
      },
      error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error' }),
    });
  }

  openReactivarDialog(user: Usuario) {
    this.confirmationService.confirm({
      message: `¿Reactivar a ${user.nombre}? Se eliminará la suspensión activa.`,
      header: 'Reactivar cuenta',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Reactivar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.usuariosService.reactivar(user.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Reactivado', detail: 'Suspensión eliminada, usuario activo nuevamente' });
            this.loadUsers();
          },
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || err.error?.message || 'No hay suspensión activa' }),
        });
      },
    });
  }
}
