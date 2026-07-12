import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Plaga, CreatePlagaDto, UpdatePlagaDto } from '../models/plaga.model';
import { Observable } from 'rxjs';

export interface CultivoRef {
  id: number;
  nombre: string;
}

@Injectable({
  providedIn: 'root'
})
export class PlagasService {
  private readonly apiUrl = `${environment.apiUrl}/plagas`;

  constructor(private http: HttpClient) {}

  findAll(search?: string, cultivoId?: number): Observable<Plaga[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (cultivoId) params = params.set('cultivoId', cultivoId);
    return this.http.get<Plaga[]>(this.apiUrl, { params });
  }

  findById(id: number): Observable<Plaga> {
    return this.http.get<Plaga>(`${this.apiUrl}/${id}`);
  }

  findCultivos(id: number): Observable<CultivoRef[]> {
    return this.http.get<CultivoRef[]>(`${this.apiUrl}/${id}/cultivos`);
  }

  setCultivos(id: number, cultivoIds: number[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/cultivos`, { cultivoIds });
  }

  create(dto: CreatePlagaDto): Observable<Plaga> {
    return this.http.post<Plaga>(this.apiUrl, dto);
  }

  update(id: number, dto: UpdatePlagaDto): Observable<Plaga> {
    return this.http.patch<Plaga>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<Plaga> {
    return this.http.delete<Plaga>(`${this.apiUrl}/${id}`);
  }
}
