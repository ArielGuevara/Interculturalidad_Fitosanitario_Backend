import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthResponse, Usuario } from '../models/auth.model';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  
  // Signals para manejar el estado de forma reactiva y moderna (Angular 18+)
  currentUser = signal<Usuario | null>(null);
  isAuthenticated = signal<boolean>(false);

  constructor(private http: HttpClient, private router: Router) {
    this.checkToken();
  }

  login(credentials: { email: string; password: string }) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        this.setSession(response);
      })
    );
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/login']);
  }

  private setSession(authResult: AuthResponse) {
    localStorage.setItem('access_token', authResult.accessToken);
    localStorage.setItem('user_data', JSON.stringify(authResult.usuario));
    this.currentUser.set(authResult.usuario);
    this.isAuthenticated.set(true);
  }

  private checkToken() {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user_data');
    
    if (token && userData) {
      this.currentUser.set(JSON.parse(userData));
      this.isAuthenticated.set(true);
    }
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }
}
