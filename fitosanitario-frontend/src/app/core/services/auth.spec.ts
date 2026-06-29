import { vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    routerSpy = { navigate: vi.fn() };
    localStorage.clear();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpy }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('login() should call correct endpoint with credentials', () => {
    const credentials = { email: 'test@test.com', password: '123456' };
    const mockResponse = {
      accessToken: 'token123',
      usuario: { id: 1, nombre: 'Test', email: 'test@test.com', rol: 'AGRICULTOR' as const }
    };

    service.login(credentials).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(credentials);
    req.flush(mockResponse);

    expect(localStorage.getItem('access_token')).toBe('token123');
    expect(service.isAuthenticated()).toBe(true);
  });

  it('getToken() should return token from localStorage', () => {
    localStorage.setItem('access_token', 'stored-token');
    service = TestBed.inject(AuthService);
    expect(service.getToken()).toBe('stored-token');
  });

  it('logout() should clear localStorage and redirect to login', () => {
    localStorage.setItem('access_token', 'token');
    localStorage.setItem('user_data', JSON.stringify({ id: 1, nombre: 'Test', email: 'test@test.com', rol: 'AGRICULTOR' }));
    service = TestBed.inject(AuthService);

    service.logout();

    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('user_data')).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });
});
