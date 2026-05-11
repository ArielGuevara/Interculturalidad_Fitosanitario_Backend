import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface UploadImageResponse {
    count: number;
    urls: string[];
}

@Injectable({
  providedIn: 'root'
})
export class MultimediaService {
  private readonly apiUrl = `${environment.apiUrl}/multimedia`;

  constructor(private http: HttpClient) {}

  uploadImage(file: File): Observable<UploadImageResponse> {
    const formData = new FormData();
    formData.append('images', file);
    return this.http.post<UploadImageResponse>(`${this.apiUrl}/upload-image`, formData).pipe(
        map(res => ({
            ...res,
            // Corregimos las URLs que vienen del servidor antes de usarlas en el front
            urls: res.urls.map(url => this.fixMinioUrl(url))
        }))
    );
  }

  /**
   * Corrige URLs de MinIO que puedan venir con 'localhost' o IPs incorrectas
   * para que el navegador siempre apunte al servidor real.
   */
  fixMinioUrl(url: string | undefined | null): string {
    if (!url) return '';
    
    // Obtenemos la IP de la API desde el environment (ej: 192.168.1.54)
    const apiHost = new URL(environment.apiUrl).hostname;
    
    try {
        const urlObj = new URL(url);
        // Si la URL apunta a localhost pero estamos en red, la corregimos
        if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
            urlObj.hostname = apiHost;
        }
        return urlObj.toString();
    } catch (e) {
        return url;
    }
  }
}
