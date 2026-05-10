import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Plaga, CreatePlagaDto, UpdatePlagaDto } from '../models/plaga.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PlagasService {
  private readonly apiUrl = `${environment.apiUrl}/plagas`;

  constructor(private http: HttpClient) {}

  findAll(): Observable<Plaga[]> {
    return this.http.get<Plaga[]>(this.apiUrl);
  }

  findById(id: number): Observable<Plaga> {
    return this.http.get<Plaga>(`${this.apiUrl}/${id}`);
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
