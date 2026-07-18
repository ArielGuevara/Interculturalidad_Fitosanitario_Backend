import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateTratamientoDto, TratamientoOficial } from '../models/tratamiento.model';

@Injectable({
  providedIn: 'root'
})
export class TratamientosService {
  private readonly apiUrl = `${environment.apiUrl}/tratamientos`;

  constructor(private http: HttpClient) {}

  findAll(search?: string, cultivoId?: number): Observable<TratamientoOficial[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (cultivoId) params = params.set('cultivoId', cultivoId);
    return this.http.get<TratamientoOficial[]>(this.apiUrl, { params });
  }

  create(dto: CreateTratamientoDto): Observable<TratamientoOficial> {
    return this.http.post<TratamientoOficial>(this.apiUrl, dto);
  }
}
