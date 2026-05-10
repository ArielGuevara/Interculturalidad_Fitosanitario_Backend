import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Producto, CreateProductoDto, UpdateProductoDto } from '../models/producto.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductosService {
  private readonly apiUrl = `${environment.apiUrl}/productos`;

  constructor(private http: HttpClient) {}

  findAll(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.apiUrl);
  }

  findById(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/${id}`);
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
