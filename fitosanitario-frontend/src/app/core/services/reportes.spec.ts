import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReportesService } from './reportes';
import { environment } from '../../../environments/environment';
import { Reporte } from '../models/reporte.model';

describe('ReportesService', () => {
  let service: ReportesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ReportesService]
    });
    service = TestBed.inject(ReportesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('findAll() should return list of reportes', () => {
    const mockReportes: Reporte[] = [
      {
        id: 1, titulo: 'Reporte 1', usuarioId: 1, cultivoId: 1,
        imagenesUrls: [], latitud: 0, longitud: 0, estado: 'PENDIENTE',
        sincronizado: true, createdAt: '2025-01-01T00:00:00Z'
      },
      {
        id: 2, titulo: 'Reporte 2', usuarioId: 2, cultivoId: 2,
        imagenesUrls: [], latitud: 0, longitud: 0, estado: 'COMUNIDAD',
        sincronizado: true, createdAt: '2025-01-02T00:00:00Z'
      }
    ];

    service.findAll().subscribe(reportes => {
      expect(reportes).toEqual(mockReportes);
      expect(reportes.length).toBe(2);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/reportes`);
    expect(req.request.method).toBe('GET');
    req.flush(mockReportes);
  });

  it('findById() should return a single reporte', () => {
    const mockReporte: Reporte = {
      id: 1, titulo: 'Reporte 1', usuarioId: 1, cultivoId: 1,
      imagenesUrls: [], latitud: 0, longitud: 0, estado: 'PENDIENTE',
      sincronizado: true, createdAt: '2025-01-01T00:00:00Z'
    };

    service.findById(1).subscribe(reporte => {
      expect(reporte).toEqual(mockReporte);
      expect(reporte.id).toBe(1);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/reportes/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockReporte);
  });

  it('findPendientes() should return pending reportes', () => {
    const mockPendientes: Reporte[] = [
      {
        id: 1, titulo: 'Reporte pendiente', usuarioId: 1, cultivoId: 1,
        imagenesUrls: [], latitud: 0, longitud: 0, estado: 'PENDIENTE',
        sincronizado: true, createdAt: '2025-01-01T00:00:00Z'
      }
    ];

    service.findPendientes().subscribe(reportes => {
      expect(reportes).toEqual(mockPendientes);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/reportes/pendientes`);
    expect(req.request.method).toBe('GET');
    req.flush(mockPendientes);
  });
});
