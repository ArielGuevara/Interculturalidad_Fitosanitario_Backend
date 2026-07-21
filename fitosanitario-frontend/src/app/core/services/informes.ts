import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class InformesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/informes`;

  generar(tipo: string, filtros?: { cultivoId?: number; rol?: string; tipoProducto?: string }): Observable<Blob> {
    const body: any = { tipo };
    if (filtros?.cultivoId) body.cultivoId = String(filtros.cultivoId);
    if (filtros?.rol) body.rol = filtros.rol;
    if (filtros?.tipoProducto) body.tipoProducto = filtros.tipoProducto;
    return this.http.post(`${this.apiUrl}/generar`, body, { responseType: 'blob' });
  }
}
