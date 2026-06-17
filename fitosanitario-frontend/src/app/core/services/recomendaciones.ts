import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ComentarioForo, CreateRecomendacionDto, RecomendacionComunidad, TipoRecomendacion } from '../models/recomendacion.model';

@Injectable({
  providedIn: 'root'
})
export class RecomendacionesService {
  private readonly apiUrl = `${environment.apiUrl}/recomendaciones`;

  constructor(private http: HttpClient) {}

  findAll(filtros?: { tipo?: TipoRecomendacion }): Observable<RecomendacionComunidad[]> {
    let params = new HttpParams();
    if (filtros?.tipo) {
      params = params.set('tipo', filtros.tipo);
    }
    return this.http.get<RecomendacionComunidad[]>(this.apiUrl, { params });
  }

  moderar(id: number, moderado: boolean): Observable<RecomendacionComunidad> {
    return this.http.patch<RecomendacionComunidad>(`${this.apiUrl}/${id}/moderar`, { moderado });
  }

  create(dto: CreateRecomendacionDto): Observable<RecomendacionComunidad> {
    return this.http.post<RecomendacionComunidad>(this.apiUrl, dto);
  }

  remove(id: number): Observable<RecomendacionComunidad> {
    return this.http.delete<RecomendacionComunidad>(`${this.apiUrl}/${id}`);
  }

  getComentarios(recomendacionId: number): Observable<ComentarioForo[]> {
    return this.http.get<ComentarioForo[]>(`${this.apiUrl}/${recomendacionId}/comentarios`);
  }

  removeComentario(comentarioId: number): Observable<ComentarioForo> {
    return this.http.delete<ComentarioForo>(`${environment.apiUrl}/comentarios/${comentarioId}`);
  }
}
