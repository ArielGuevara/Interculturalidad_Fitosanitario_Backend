import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Producto, CreateProductoDto, UpdateProductoDto } from '../models/producto.model';
import { Observable } from 'rxjs';

export interface PlagaCultivoPair {
  plagaId: number;
  plagaNombre: string;
  cultivoId: number;
  cultivoNombre: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductosService {
  private readonly apiUrl = `${environment.apiUrl}/productos`;

  constructor(private http: HttpClient) {}

  findAll(search?: string, cultivoId?: number, plagaId?: number): Observable<Producto[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (cultivoId) params = params.set('cultivoId', cultivoId);
    if (plagaId) params = params.set('plagaId', plagaId);
    return this.http.get<Producto[]>(this.apiUrl, { params });
  }

  findById(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/${id}`);
  }

  findCultivos(id: number): Observable<{ id: number; nombre: string }[]> {
    return this.http.get<{ id: number; nombre: string }[]>(`${this.apiUrl}/${id}/cultivos`);
  }

  findPlagasCultivos(id: number): Observable<PlagaCultivoPair[]> {
    return this.http.get<PlagaCultivoPair[]>(`${this.apiUrl}/${id}/plagas-cultivos`);
  }

  setPlagasCultivos(id: number, pairs: { plagaId: number; cultivoId: number }[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/plagas-cultivos`, { pairs });
  }

  findAllAsociaciones(): Observable<(PlagaCultivoPair & { productoId: number })[]> {
    return this.http.get<(PlagaCultivoPair & { productoId: number })[]>(`${this.apiUrl}/asociaciones`);
  }

  create(dto: CreateProductoDto): Observable<Producto> {
    return this.http.post<Producto>(this.apiUrl, dto);
  }

  update(id: number, dto: UpdateProductoDto): Observable<Producto> {
    return this.http.patch<Producto>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<Producto> {
    return this.http.delete<Producto>(`${this.apiUrl}/${id}`);
  }
}
