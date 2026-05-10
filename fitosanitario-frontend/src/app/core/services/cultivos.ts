import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Cultivo, CreateCultivoDto, UpdateCultivoDto } from '../models/cultivo.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CultivosService {
  private readonly apiUrl = `${environment.apiUrl}/cultivos`;

  constructor(private http: HttpClient) {}

  findAll(): Observable<Cultivo[]> {
    return this.http.get<Cultivo[]>(this.apiUrl);
  }

  findById(id: number): Observable<Cultivo> {
    return this.http.get<Cultivo>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateCultivoDto): Observable<Cultivo> {
    return this.http.post<Cultivo>(this.apiUrl, dto);
  }

  update(id: number, dto: UpdateCultivoDto): Observable<Cultivo> {
    return this.http.patch<Cultivo>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<Cultivo> {
    return this.http.delete<Cultivo>(`${this.apiUrl}/${id}`);
  }
}
