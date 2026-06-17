import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateTratamientoDto, TratamientoOficial } from '../models/tratamiento.model';

@Injectable({
  providedIn: 'root'
})
export class TratamientosService {
  private readonly apiUrl = `${environment.apiUrl}/tratamientos`;

  constructor(private http: HttpClient) {}

  findAll(): Observable<TratamientoOficial[]> {
    return this.http.get<TratamientoOficial[]>(this.apiUrl);
  }

  create(dto: CreateTratamientoDto): Observable<TratamientoOficial> {
    return this.http.post<TratamientoOficial>(this.apiUrl, dto);
  }
}
