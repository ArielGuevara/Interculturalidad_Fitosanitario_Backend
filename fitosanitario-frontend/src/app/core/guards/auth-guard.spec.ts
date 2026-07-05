import { vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { authGuard } from './auth-guard';

describe('authGuard', () => {
  let authServiceMock: { isAuthenticated: ReturnType<typeof vi.fn> };
  let routerSpy: { createUrlTree: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authServiceMock = { isAuthenticated: vi.fn() };
    routerSpy = { createUrlTree: vi.fn().mockReturnValue({} as any) };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerSpy }
      ]
    });
  });

  it('should return true when user is authenticated', () => {
    authServiceMock.isAuthenticated.mockReturnValue(true);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, {} as any)
    );

    expect(result).toBe(true);
    expect(routerSpy.createUrlTree).not.toHaveBeenCalled();
  });

  it('should redirect to /login when user is not authenticated', () => {
    authServiceMock.isAuthenticated.mockReturnValue(false);
    routerSpy.createUrlTree.mockReturnValue({} as any);

    TestBed.runInInjectionContext(() =>
      authGuard({} as any, {} as any)
    );

    expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/login']);
  });
});
