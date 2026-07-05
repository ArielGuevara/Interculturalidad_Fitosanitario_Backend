import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ZonaAlerta, CreateZonaAlertaDto,
  ParametroAlerta, CreateParametroAlertaDto,
  Alerta,
} from '../models/alerta.model';

@Injectable({ providedIn: 'root' })
export class AlertasService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ── Zonas ──
  findAllZonas(): Observable<ZonaAlerta[]> {
    return this.http.get<ZonaAlerta[]>(`${this.api}/zonas-alerta`);
  }

  findZonaById(id: number): Observable<ZonaAlerta> {
    return this.http.get<ZonaAlerta>(`${this.api}/zonas-alerta/${id}`);
  }

  createZona(dto: CreateZonaAlertaDto): Observable<ZonaAlerta> {
    return this.http.post<ZonaAlerta>(`${this.api}/zonas-alerta`, dto);
  }

  updateZona(id: number, dto: Partial<CreateZonaAlertaDto>): Observable<ZonaAlerta> {
    return this.http.patch<ZonaAlerta>(`${this.api}/zonas-alerta/${id}`, dto);
  }

  deleteZona(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/zonas-alerta/${id}`);
  }

  // ── Parámetros ──
  findAllParametros(): Observable<ParametroAlerta[]> {
    return this.http.get<ParametroAlerta[]>(`${this.api}/parametros-alerta`);
  }

  findParametroById(id: number): Observable<ParametroAlerta> {
    return this.http.get<ParametroAlerta>(`${this.api}/parametros-alerta/${id}`);
  }

  createParametro(dto: CreateParametroAlertaDto): Observable<ParametroAlerta> {
    return this.http.post<ParametroAlerta>(`${this.api}/parametros-alerta`, dto);
  }

  updateParametro(id: number, dto: Partial<CreateParametroAlertaDto>): Observable<ParametroAlerta> {
    return this.http.patch<ParametroAlerta>(`${this.api}/parametros-alerta/${id}`, dto);
  }

  deleteParametro(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/parametros-alerta/${id}`);
  }

  // ── Alertas ──
  findAllAlertas(): Observable<Alerta[]> {
    return this.http.get<Alerta[]>(`${this.api}/alertas`);
  }

  findAlertaById(id: number): Observable<Alerta> {
    return this.http.get<Alerta>(`${this.api}/alertas/${id}`);
  }

  detectarAlertas(): Observable<{ alertasCreadas: number; totalBrotes: number }> {
    return this.http.post<{ alertasCreadas: number; totalBrotes: number }>(`${this.api}/alertas/detectar`, {});
  }
}
