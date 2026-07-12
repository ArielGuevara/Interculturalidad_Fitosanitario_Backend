import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { Notificacion } from '../models/notificacion.model';
import { AuthService } from './auth';

@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private readonly apiUrl = `${environment.apiUrl}`;

  findMine(): Observable<Notificacion[]> {
    return this.http.get<Notificacion[]>(`${this.apiUrl}/notificaciones`);
  }

  countNoLeidas(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/notificaciones/no-leidas`);
  }

  marcarLeida(id: number): Observable<Notificacion> {
    return this.http.patch<Notificacion>(`${this.apiUrl}/notificaciones/${id}/leida`, {});
  }
}
