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

  findAll(filtros?: { tipo?: TipoRecomendacion; cultivoId?: number; plagaId?: number }): Observable<RecomendacionComunidad[]> {
    let params = new HttpParams();
    if (filtros?.tipo) params = params.set('tipo', filtros.tipo);
    if (filtros?.cultivoId) params = params.set('cultivoId', filtros.cultivoId);
    if (filtros?.plagaId) params = params.set('plagaId', filtros.plagaId);
    return this.http.get<RecomendacionComunidad[]>(this.apiUrl, { params });
  }

  findAllSaberes(filtros?: { q?: string; estado?: string; cultivoId?: number; plagaId?: number }): Observable<RecomendacionComunidad[]> {
    let params = new HttpParams();
    if (filtros?.q) params = params.set('q', filtros.q);
    if (filtros?.estado) params = params.set('estado', filtros.estado);
    if (filtros?.cultivoId) params = params.set('cultivoId', filtros.cultivoId);
    if (filtros?.plagaId) params = params.set('plagaId', filtros.plagaId);
    return this.http.get<RecomendacionComunidad[]>(`${this.apiUrl}/saberes-ancestrales`, { params });
  }

  moderarConDuracion(id: number, dto: { moderado: boolean; duracionDias?: number; motivoRechazo?: string }): Observable<RecomendacionComunidad> {
    return this.http.patch<RecomendacionComunidad>(`${this.apiUrl}/${id}/moderar`, dto);
  }

  moderar(id: number, moderado: boolean): Observable<RecomendacionComunidad> {
    return this.http.patch<RecomendacionComunidad>(`${this.apiUrl}/${id}/moderar`, { moderado });
  }

  create(dto: CreateRecomendacionDto): Observable<RecomendacionComunidad> {
    return this.http.post<RecomendacionComunidad>(this.apiUrl, dto);
  }

  update(id: number, dto: Partial<RecomendacionComunidad>): Observable<RecomendacionComunidad> {
    return this.http.patch<RecomendacionComunidad>(`${this.apiUrl}/${id}`, dto);
  }

  remove(id: number): Observable<RecomendacionComunidad> {
    return this.http.delete<RecomendacionComunidad>(`${this.apiUrl}/${id}`);
  }

  hardRemove(id: number): Observable<RecomendacionComunidad> {
    return this.http.delete<RecomendacionComunidad>(`${this.apiUrl}/${id}/fisica`);
  }

  toggle(id: number): Observable<RecomendacionComunidad> {
    return this.http.patch<RecomendacionComunidad>(`${this.apiUrl}/${id}/toggle`, {});
  }

  getComentarios(recomendacionId: number): Observable<ComentarioForo[]> {
    return this.http.get<ComentarioForo[]>(`${this.apiUrl}/${recomendacionId}/comentarios`);
  }

  getInteracciones(recomendacionId: number): Observable<{ comentarios: ComentarioForo[]; valoraciones: any[] }> {
    return this.http.get<{ comentarios: ComentarioForo[]; valoraciones: any[] }>(`${this.apiUrl}/${recomendacionId}/interacciones`);
  }

  valorar(recomendacionId: number, puntuacion: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${recomendacionId}/valorar`, { puntuacion });
  }

  getMiValoracion(recomendacionId: number): Observable<{ puntuacion: number | null }> {
    return this.http.get<{ puntuacion: number | null }>(`${this.apiUrl}/${recomendacionId}/mi-valoracion`);
  }

  promoverComentario(recomendacionId: number, comentarioId: number, dto?: { comentarioModerador?: string }): Observable<RecomendacionComunidad> {
    return this.http.post<RecomendacionComunidad>(`${this.apiUrl}/${recomendacionId}/promover-comentario/${comentarioId}`, dto || {});
  }

  createComentario(recomendacionId: number, contenido: string, comentarioPadreId?: number): Observable<ComentarioForo> {
    return this.http.post<ComentarioForo>(`${this.apiUrl}/${recomendacionId}/comentarios`, { contenido, comentarioPadreId: comentarioPadreId || undefined });
  }

  createComentarioWithAudio(recomendacionId: number, contenido: string, audioBlob: Blob, comentarioPadreId?: number): Observable<ComentarioForo> {
    const formData = new FormData();
    formData.append('contenido', contenido);
    if (comentarioPadreId) formData.append('comentarioPadreId', String(comentarioPadreId));
    formData.append('audio', audioBlob, 'comentario.webm');
    return this.http.post<ComentarioForo>(`${this.apiUrl}/${recomendacionId}/comentarios/with-audio`, formData);
  }

  createComentarioWithImage(recomendacionId: number, contenido: string, imagenFile: File, comentarioPadreId?: number): Observable<ComentarioForo> {
    const formData = new FormData();
    formData.append('contenido', contenido);
    if (comentarioPadreId) formData.append('comentarioPadreId', String(comentarioPadreId));
    formData.append('imagen', imagenFile, imagenFile.name);
    return this.http.post<ComentarioForo>(`${this.apiUrl}/${recomendacionId}/comentarios/with-image`, formData);
  }

  removeComentario(comentarioId: number): Observable<ComentarioForo> {
    return this.http.delete<ComentarioForo>(`${environment.apiUrl}/comentarios/${comentarioId}`);
  }
}
