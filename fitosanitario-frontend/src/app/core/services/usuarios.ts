import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { Usuario } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/usuarios`;

  findAll(rol?: string): Observable<Usuario[]> {
    let params = new HttpParams();
    if (rol) params = params.set('rol', rol);
    return this.http.get<Usuario[]>(this.apiUrl, { params });
  }

  findById(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/${id}`);
  }

  createModerator(data: {
    nombre: string;
    email: string;
    telefono?: string;
    cargo?: string;
    permisos?: string[];
  }): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/moderador`, data);
  }

  update(id: number, data: Partial<{
    nombre: string;
    email: string;
    telefono: string | null;
    cargo: string | null;
    rol: string;
    permisos: string[];
    activo: boolean;
  }>): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.apiUrl}/${id}`, data);
  }

  remove(id: number): Observable<Usuario> {
    return this.http.delete<Usuario>(`${this.apiUrl}/${id}`);
  }

  restore(id: number): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/${id}/restore`, {});
  }

  suspender(id: number, data: { motivo: string; tipoDuracion: 'TIEMPO' | 'DIAS'; duracion: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/suspender`, data);
  }

  reactivar(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/reactivar`, {});
  }

  getSuspensionActiva(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}/suspension/activa`);
  }

  getSuspensionesActivas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/suspensiones-activas`);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/me/password`, { currentPassword, newPassword });
  }
}
