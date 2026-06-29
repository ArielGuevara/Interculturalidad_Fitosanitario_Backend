import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReportesBandeja } from './reportes-bandeja';
import { ReportesService } from '../../../core/services/reportes';
import { CultivosService } from '../../../core/services/cultivos';
import { PlagasService } from '../../../core/services/plagas';
import { Reporte } from '../../../core/models/reporte.model';
import { of } from 'rxjs';

describe('ReportesBandeja', () => {
  let component: ReportesBandeja;
  let fixture: ComponentFixture<ReportesBandeja>;
  let reportesServiceMock: { findPendientes: ReturnType<typeof vi.fn> };

  const mockReportes: Reporte[] = [
    {
      id: 1, titulo: 'Plaga en maíz', usuarioId: 1, cultivoId: 1,
      imagenesUrls: [], latitud: -1.23, longitud: -78.45,
      estado: 'PENDIENTE', sincronizado: true, createdAt: '2025-01-01T00:00:00Z'
    },
    {
      id: 2, titulo: 'Hongo en café', usuarioId: 2, cultivoId: 2,
      imagenesUrls: [], latitud: -2.34, longitud: -79.56,
      estado: 'COMUNIDAD', sincronizado: true, createdAt: '2025-01-02T00:00:00Z'
    }
  ];

  beforeEach(async () => {
    reportesServiceMock = {
      findPendientes: vi.fn().mockReturnValue(of(mockReportes))
    };

    await TestBed.configureTestingModule({
      imports: [ReportesBandeja],
      providers: [
        { provide: ReportesService, useValue: reportesServiceMock },
        { provide: CultivosService, useValue: { findAll: () => of([]) } },
        { provide: PlagasService, useValue: { findAll: () => of([]) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ReportesBandeja);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call reportesService.findPendientes on init', () => {
    expect(reportesServiceMock.findPendientes).toHaveBeenCalledTimes(1);
  });

  it('should display list of reportes', () => {
    fixture.detectChanges();
    expect(component.reportes().length).toBe(2);
    expect(component.reportes()[0].titulo).toBe('Plaga en maíz');
    expect(component.reportes()[1].titulo).toBe('Hongo en café');
  });
});
