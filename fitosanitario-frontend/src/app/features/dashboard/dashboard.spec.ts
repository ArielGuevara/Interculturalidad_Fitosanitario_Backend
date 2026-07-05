import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Dashboard } from './dashboard';
import { CultivosService } from '../../core/services/cultivos';
import { PlagasService } from '../../core/services/plagas';
import { ProductosService } from '../../core/services/productos';
import { ReportesService } from '../../core/services/reportes';
import { AlertasService } from '../../core/services/alertas';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideRouter([]),
        { provide: CultivosService, useValue: { findAll: () => of([]) } },
        { provide: PlagasService, useValue: { findAll: () => of([]) } },
        { provide: ProductosService, useValue: { findAll: () => of([]) } },
        { provide: ReportesService, useValue: { findAll: () => of([]), findPendientes: () => of([]) } },
        { provide: AlertasService, useValue: { findAllAlertas: () => of([]) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
