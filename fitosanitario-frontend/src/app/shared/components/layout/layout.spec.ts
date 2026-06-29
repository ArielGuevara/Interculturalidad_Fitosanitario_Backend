import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { Layout } from './layout';
import { AuthService } from '../../../core/services/auth';

describe('Layout', () => {
  let component: Layout;
  let fixture: ComponentFixture<Layout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Layout],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            logout: () => {},
            currentUser: signal({ id: 1, nombre: 'Test', email: 'test@test.com', rol: 'AGRICULTOR' }),
            isAuthenticated: signal(true),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Layout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
