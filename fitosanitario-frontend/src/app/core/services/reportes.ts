import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CambiarEstadoReporteDto, Reporte, ReporteHistorialEstado } from '../models/reporte.model';

@Injectable({
  providedIn: 'root'
})
export class ReportesService {
  private readonly apiUrl = `${environment.apiUrl}/reportes`;

  constructor(private http: HttpClient) {}

  findAll(): Observable<Reporte[]> {
    return this.http.get<Reporte[]>(this.apiUrl);
  }

  findPendientes(): Observable<Reporte[]> {
    return this.http.get<Reporte[]>(`${this.apiUrl}/pendientes`);
  }

  findById(id: number): Observable<Reporte> {
    return this.http.get<Reporte>(`${this.apiUrl}/${id}`);
  }

  getHistorial(id: number): Observable<ReporteHistorialEstado[]> {
    return this.http.get<ReporteHistorialEstado[]>(`${this.apiUrl}/${id}/historial`);
  }

  cambiarEstado(id: number, dto: CambiarEstadoReporteDto): Observable<Reporte> {
    return this.http.patch<Reporte>(`${this.apiUrl}/${id}/estado`, dto);
  }
}
